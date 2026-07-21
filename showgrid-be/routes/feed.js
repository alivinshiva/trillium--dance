const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Submission = require('../models/Submission');

// GET /api/feed - Paginated, filtered, sorted feed of approved submissions
router.get('/', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            sort = 'latest',
            challengeId,
            userId
        } = req.query;

        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
        const skip = (pageNum - 1) * limitNum;

        // Build filter - only approved submissions
        const filter = { status: 'approved' };
        if (challengeId) {
            filter.challengeId = new mongoose.Types.ObjectId(challengeId);
        }
        if (userId) {
            filter.userId = userId;
        }

        // Build sort
        let sortQuery = {};
        switch (sort) {
            case 'top_rated':
                // Will be enhanced with feedScore in Step 5
                sortQuery = { createdAt: -1 }; // fallback for now
                break;
            case 'oldest':
                sortQuery = { createdAt: 1 };
                break;
            case 'latest':
            default:
                sortQuery = { createdAt: -1 };
        }

        // Execute query
        const [submissions, total] = await Promise.all([
            Submission.find(filter)
                .sort(sortQuery)
                .skip(skip)
                .limit(limitNum)
                .populate('challengeId')
                .lean(),
            Submission.countDocuments(filter)
        ]);

        res.json({
            data: submissions,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum),
                hasMore: pageNum * limitNum < total
            }
        });
    } catch (err) {
        console.error('Feed error:', err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
