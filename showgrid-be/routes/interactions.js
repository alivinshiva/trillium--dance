const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const {
    VideoLike,
    VideoComment,
    VideoShare,
    VideoRating,
    VideoAggregate,
    VideoRatingAggregate
} = require('../models/Interaction');
const Submission = require('../models/Submission');
const { requireAuth } = require('../utils/auth');
const { rateLimit } = require('../utils/rateLimit');

// --- Helper to update Aggregates ---
const updateAggregate = async (videoId, field, amount) => {
    await VideoAggregate.updateOne(
        { _id: videoId },
        { $inc: { [field]: amount }, $set: { updatedAt: new Date() } },
        { upsert: true }
    );
};

// --- Routes ---

// GET Interactions for a Video (Summary + User Context)
router.get('/video/:videoId', async (req, res) => {
    try {
        const { videoId } = req.params;
        const { userId } = req.query; // Authenticated user ID

        const [aggregate, ratingAggregate] = await Promise.all([
            VideoAggregate.findById(videoId).lean(),
            VideoRatingAggregate.findById(videoId).lean()
        ]);

        let userInteraction = {};
        if (userId) {
            const [liked, rated] = await Promise.all([
                VideoLike.exists({ videoId, userId }),
                VideoRating.findOne({ videoId, userId }).lean()
            ]);
            userInteraction = {
                hasLiked: !!liked,
                userRating: rated ? rated.rating : null
            };
        }

        res.json({
            stats: {
                likes: aggregate?.likes || 0,
                comments: aggregate?.comments || 0,
                shares: aggregate?.shares || 0,
                ratingAverage: ratingAggregate?.average || 0,
                ratingCount: ratingAggregate?.count || 0
            },
            user: userInteraction
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST Like / Unlike (Toggle)
router.post('/like', requireAuth, rateLimit, async (req, res) => {
    try {
        const { videoId, userId } = req.body;

        // Try to delete (Unlike)
        const deleted = await VideoLike.findOneAndDelete({ videoId, userId });

        if (deleted) {
            // Was liked, so decrement
            await updateAggregate(videoId, 'likes', -1);
            return res.json({ liked: false });
        } else {
            // Not liked, so insert (Like)
            await VideoLike.create({ videoId, userId });
            await updateAggregate(videoId, 'likes', 1);
            return res.json({ liked: true });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST Rate
router.post('/rate', requireAuth, rateLimit, async (req, res) => {
    try {
        const { videoId, userId, rating } = req.body;
        const numericRating = parseInt(rating);

        if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
            return res.status(400).json({ message: "Rating must be an integer between 1 and 5" });
        }

        const now = new Date();

        // Check for existing rating
        const existingRating = await VideoRating.findOne({ videoId, userId });

        if (existingRating) {
            // Update existing
            const diff = numericRating - existingRating.rating;
            existingRating.rating = numericRating;
            existingRating.updatedAt = now;
            await existingRating.save();

            // Update Aggregate (Sum Only)
            if (diff !== 0) {
                await VideoRatingAggregate.updateOne(
                    { _id: videoId },
                    {
                        $inc: { sum: diff },
                        $set: { updatedAt: now }
                    }
                );
            }
        } else {
            // Create New
            await VideoRating.create({ videoId, userId, rating: numericRating });

            // Update Aggregate (Count + Sum)
            await VideoRatingAggregate.updateOne(
                { _id: videoId },
                {
                    $inc: { count: 1, sum: numericRating },
                    $set: { updatedAt: now }
                },
                { upsert: true }
            );
        }

        // Recalculate Average (Atomic read-update might be better but this is simpler for now)
        const agg = await VideoRatingAggregate.findById(videoId);
        if (agg && agg.count > 0) {
            agg.average = agg.sum / agg.count;
            await agg.save();
        }

        res.json({ success: true, rating: numericRating, average: agg?.average || 0 });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST Comment
router.post('/comment', requireAuth, rateLimit, async (req, res) => {
    try {
        const { videoId, userId, userName, userAvatar, body, parentId } = req.body;

        const comment = await VideoComment.create({
            videoId,
            userId,
            userName,
            userAvatar,
            body,
            parentId: parentId || null
        });

        await updateAggregate(videoId, 'comments', 1);

        res.status(201).json(comment);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET Comments
router.get('/comments/:videoId', async (req, res) => {
    try {
        const { videoId } = req.params;
        const { after } = req.query; // Pagination cursor (date) or ID

        // Simple fetch for now, can optimize later
        const comments = await VideoComment.find({
            videoId,
            parentId: null, // Top-level comments only by default
            isDeleted: false
        })
            .sort({ createdAt: -1 })
            .limit(20);

        res.json(comments);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST Share
router.post('/share', requireAuth, rateLimit, async (req, res) => {
    try {
        const { videoId, userId, targetType } = req.body;

        await VideoShare.create({
            videoId,
            userId,
            targetType: targetType || 'external'
        });

        await updateAggregate(videoId, 'shares', 1);

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
