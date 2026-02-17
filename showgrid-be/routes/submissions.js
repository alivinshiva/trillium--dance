const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Submission = require('../models/Submission');
const Notification = require('../models/Notification');
const { VideoRatingAggregate } = require('../models/Interaction');
const { upload } = require('../config/cloudinary');

// GET Leaderboard (Submissions sorted by rating)
router.get('/leaderboard', async (req, res) => {
    try {
        const { challengeId } = req.query;
        const limit = parseInt(req.query.limit) || 100;

        const pipeline = [];

        // 1. Filter by challenge if provided
        if (challengeId) {
            pipeline.push({
                $match: {
                    challengeId: new mongoose.Types.ObjectId(challengeId)
                }
            });
        }

        // 2. Lookup Rating Aggregate
        pipeline.push({
            $lookup: {
                from: 'videoratingaggregates',
                localField: '_id',
                foreignField: '_id',
                as: 'ratingStats'
            }
        });

        // 3. Unwind (preserve nulls)
        pipeline.push({
            $unwind: {
                path: '$ratingStats',
                preserveNullAndEmptyArrays: true
            }
        });

        // 4. Add computed fields
        pipeline.push({
            $addFields: {
                averageRating: { $ifNull: ['$ratingStats.average', 0] },
                ratingCount: { $ifNull: ['$ratingStats.count', 0] }
            }
        });

        // 5. Sort
        pipeline.push({
            $sort: {
                averageRating: -1,
                ratingCount: -1,
                createdAt: -1
            }
        });

        // 6. Limit
        pipeline.push({ $limit: limit });

        const leaderboard = await Submission.aggregate(pipeline);
        res.json(leaderboard);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET submissions
router.get('/', async (req, res) => {
    try {
        const filter = {};
        if (req.query.userId) filter.userId = req.query.userId;
        if (req.query.challengeId) filter.challengeId = req.query.challengeId;

        const submissions = await Submission.find(filter).sort({ createdAt: -1 }).populate('challengeId');
        res.json(submissions);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST a new submission (with video upload)
router.post('/', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const { userId, userName, userAvatar, description, city, challengeId, tags } = req.body;

        // Parse tags if sent as string (FormData)
        let parsedTags = [];
        if (tags) {
            try {
                parsedTags = JSON.parse(tags);
            } catch (e) {
                // If not JSON, maybe comma separated or just single value
                parsedTags = Array.isArray(tags) ? tags : tags.split(',');
            }
        }

        const submission = new Submission({
            userId,
            userName,
            userAvatar,
            description,
            city,
            challengeId,
            videoUrl: req.file.path, // Cloudinary URL
            status: 'pending',
            tags: parsedTags
        });

        const newSubmission = await submission.save();
        res.status(201).json(newSubmission);
    } catch (err) {
        console.error("Submission Error:", err);
        res.status(500).json({ message: err.message });
    }
});

// POST a comment to a submission
router.post('/:id/comments', async (req, res) => {
    try {
        const { userId, userName, userAvatar, text, type } = req.body;
        const submission = await Submission.findById(req.params.id);

        if (!submission) {
            return res.status(404).json({ message: 'Submission not found' });
        }

        // Check if user has already commented
        const existingComment = submission.comments.find(c => c.userId === userId);
        if (existingComment) {
            return res.status(400).json({ message: 'You have already commented on this video' });
        }

        submission.comments.push({
            userId,
            userName,
            userAvatar,
            text,
            type,
            createdAt: new Date()
        });

        await submission.save();
        await submission.populate('challengeId');
        res.json(submission);
    } catch (err) {
        console.error("Error adding comment:", err);
        res.status(500).json({ message: err.message });
    }
});

// DELETE a submission
router.delete('/:id', async (req, res) => {
    try {
        const submission = await Submission.findByIdAndDelete(req.params.id);
        if (!submission) {
            return res.status(404).json({ message: 'Submission not found' });
        }
        res.json({ message: 'Submission deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PUT update submission status (Approve/Reject)
router.put('/:id/status', async (req, res) => {
    try {
        const { status, message } = req.body; // status: 'approved' | 'rejected'
        const submission = await Submission.findById(req.params.id);

        if (!submission) {
            return res.status(404).json({ message: 'Submission not found' });
        }

        // Update status
        submission.status = status;
        await submission.save();

        // Create Notification
        const notificationType = status === 'approved' ? 'video_approved' : 'video_rejected';
        const title = status === 'approved' ? 'Performance Approved!' : 'Submission Returned';
        const notifMessage = message || (status === 'approved'
            ? `Your submission for ${submission.challengeId?.title || 'the challenge'} is live!`
            : `Your submission needs some changes.`);

        await Notification.create({
            userId: submission.userId,
            type: notificationType,
            title,
            message: notifMessage,
            metadata: {
                submissionId: submission._id,
                challengeId: submission.challengeId
            }
        });

        res.json(submission);
    } catch (err) {
        console.error("Error updating status:", err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
