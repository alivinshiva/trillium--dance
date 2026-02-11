const express = require('express');
const router = express.Router();
const Challenge = require('../models/Challenge');

// GET all challenges (active ones for users)
router.get('/', async (req, res) => {
    try {
        const challenges = await Challenge.find().sort({ startDate: -1 });
        res.json(challenges);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
