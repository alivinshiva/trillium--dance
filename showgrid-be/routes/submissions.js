const express = require('express');
const router = express.Router();
const Submission = require('../models/Submission');
const { upload } = require('../config/cloudinary');

// GET submissions
router.get('/', async (req, res) => {
    try {
        const filter = {};
        if (req.query.userId) filter.userId = req.query.userId;
        if (req.query.challengeId) filter.challengeId = req.query.challengeId;

        const submissions = await Submission.find(filter).sort({ createdAt: -1 });
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

        const { userId, userName, userAvatar, description, city, challengeId } = req.body;

        const submission = new Submission({
            userId,
            userName,
            userAvatar,
            description,
            city,
            challengeId,
            videoUrl: req.file.path, // Cloudinary URL
            status: 'pending'
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

        submission.comments.push({
            userId,
            userName,
            userAvatar,
            text,
            type,
            createdAt: new Date()
        });

        await submission.save();
        res.json(submission);
    } catch (err) {
        console.error("Error adding comment:", err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
