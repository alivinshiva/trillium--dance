const express = require('express');
const router = express.Router();
const Challenge = require('../models/Challenge');

const parseComments = require('../utils/parseComments');

// GET parsed presets
router.get('/presets', (req, res) => {
    try {
        const presets = parseComments();
        res.json(presets);
    } catch (err) {
        res.status(500).json({ error: "Failed to load presets" });
    }
});

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
