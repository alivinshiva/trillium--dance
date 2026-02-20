const express = require('express');
const router = express.Router();
const Submission = require('../models/Submission');
const Notification = require('../models/Notification');

// GET submissions (can filter by status, userId, challengeId)
// Example: /api/submissions?status=pending
// Example: /api/submissions?userId=user123
router.get('/', async (req, res) => {
    try {
        const filter = {};
        if (req.query.status) filter.status = req.query.status;
        if (req.query.userId) filter.userId = req.query.userId;
        if (req.query.challengeId) filter.challengeId = req.query.challengeId;

        const submissions = await Submission.find(filter).sort({ createdAt: -1 }).populate('challengeId');
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

        try {
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
        } catch (error) {
            console.error("Error creating notification", error);
        }

        res.json(submission);
    } catch (err) {
        console.error("Error updating status:", err);
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

module.exports = router;
