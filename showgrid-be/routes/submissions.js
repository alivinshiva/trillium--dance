const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Submission = require('../models/Submission');
const { createNotification } = require('../utils/notify');
const { generateAiRating } = require('../utils/aiRating');
const { VideoRatingAggregate } = require('../models/Interaction');
const { upload } = require('../config/cloudinary');
const { requireAuth } = require('../utils/auth');

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
                ratingCount: { $ifNull: ['$ratingStats.count', 0] },
                wilsonScore: { $ifNull: ['$wilsonScore', 0] }
            }
        });

        // 5. Keep only videos that cleared the minRatings gate (wilsonScore > 0)
        pipeline.push({
            $match: { wilsonScore: { $gt: 0 } }
        });

        // 6. Sort
        pipeline.push({
            $sort: {
                wilsonScore: -1,
                averageRating: -1,
                ratingCount: -1,
                createdAt: -1
            }
        });

        // 7. Limit
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
router.post('/', requireAuth, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const { userId, userName, userAvatar, description, city, challengeId, tags, studioName } = req.body;

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
            tags: parsedTags,
            studioName
        });

        const newSubmission = await submission.save();
        res.status(201).json(newSubmission);

        // Trigger AI Rating in Background
        if (req.file.path) {
            // We don't await this because we don't want to block the response
            generateAiRating(req.file.path).then(async (rating) => {
                if (rating) {
                    console.log(`[AI-RATING] Saving rating for submission ${newSubmission._id}`);
                    newSubmission.aiRating = rating;
                    await newSubmission.save();
                }
            }).catch(err => {
                console.error(`[AI-RATING] Background process failed for ${newSubmission._id}:`, err);
            });
        }
    } catch (err) {
        console.error("Submission Error:", err);
        res.status(500).json({ message: err.message });
    }
});

// POST a comment to a submission
router.post('/:id/comments', requireAuth, async (req, res) => {
    try {
        const { userId, userName, userAvatar, text, type } = req.body;
        const submission = await Submission.findById(req.params.id);

        if (!submission) {
            return res.status(404).json({ message: 'Submission not found' });
        }

        // Check if user has already commented
        /* 
        // Allow multiple comments? User request implies they can delete and maybe re-comment?
        // Current logic blocks multiple comments. 
        // If we want to allow delete, we should keep this restriction OR if they delete, they can comment again.
        // The current restriction is fine.
        */
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

// DELETE a comment
router.delete('/:id/comments/:commentId', requireAuth, async (req, res) => {
    try {
        const { id, commentId } = req.params;
        const submission = await Submission.findById(id);

        if (!submission) {
            return res.status(404).json({ message: 'Submission not found' });
        }

        // Filter out the comment
        const initialLength = submission.comments.length;
        submission.comments = submission.comments.filter(c => c._id.toString() !== commentId);

        if (submission.comments.length === initialLength) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        await submission.save();
        await submission.populate('challengeId');
        res.json(submission);
    } catch (err) {
        console.error("Error deleting comment:", err);
        res.status(500).json({ message: err.message });
    }
});

// DELETE a submission
router.delete('/:id', requireAuth, async (req, res) => {
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
router.put('/:id/status', requireAuth, async (req, res) => {
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

        await createNotification({
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
