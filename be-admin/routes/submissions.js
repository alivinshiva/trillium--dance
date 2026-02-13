const express = require('express');
const router = express.Router();
const Submission = require('../models/Submission');

// GET submissions (can filter by status, userId, challengeId)
// Example: /api/submissions?status=pending
// Example: /api/submissions?userId=user123
router.get('/', async (req, res) => {
    try {
        const filter = {};
        if (req.query.status) filter.status = req.query.status;
        if (req.query.userId) filter.userId = req.query.userId;
        if (req.query.challengeId) filter.challengeId = req.query.challengeId;

        const submissions = await Submission.find(filter).sort({ createdAt: -1 });
        res.json(submissions);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST a new submission
router.post('/', async (req, res) => {
    try {
        const submission = new Submission(req.body);
        const newSubmission = await submission.save();
        res.status(201).json(newSubmission);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PATCH update status (approve/reject)
router.patch('/:id/status', async (req, res) => {
    try {
        const { status, comment } = req.body;
        if (!['pending', 'approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const updateData = { status };

        // If a comment is provided, push it to the comments array
        if (comment) {
            const newComment = {
                userId: 'admin', // Hardcoded for now
                userName: 'ShowGrid Judge',
                userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Judge',
                text: comment,
                type: 'custom',
                createdAt: new Date()
            };
            // Use $push to append to the array
            // We use findByIdAndUpdate with $set for status and $push for comments
            const submission = await Submission.findByIdAndUpdate(
                req.params.id,
                {
                    $set: { status },
                    $push: { comments: newComment }
                },
                { new: true }
            );
            if (!submission) {
                return res.status(404).json({ message: 'Submission not found' });
            }
            return res.json(submission);
        }

        // If no comment, just update status
        const submission = await Submission.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!submission) {
            return res.status(404).json({ message: 'Submission not found' });
        }

        res.json(submission);
    } catch (err) {
        console.error('Error in PATCH /status:', err);
        res.status(500).json({ message: err.message, stack: err.stack });
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

module.exports = router;
