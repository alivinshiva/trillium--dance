const express = require('express');
const router = express.Router();
const Challenge = require('../models/Challenge');

// GET all challenges
router.get('/', async (req, res) => {
    try {
        // Fetch active challenges, sort by newest first (or by start date)
        const challenges = await Challenge.find().sort({ startDate: -1 });
        res.json(challenges);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST a new challenge
router.post('/', async (req, res) => {
    const { title, description, startDate, endDate, songUrl, coverUrl, tags } = req.body;

    const challenge = new Challenge({
        title,
        description,
        startDate,
        endDate,
        songUrl,
        coverUrl,
        tags
    });

    try {
        const newChallenge = await challenge.save();
        res.status(201).json(newChallenge);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
