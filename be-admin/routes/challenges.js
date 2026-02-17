const express = require('express');
const router = express.Router();
const Challenge = require('../models/Challenge');
const { upload } = require('../config/cloudinary');
const parseComments = require('../utils/parseComments');

// GET parsed presets
router.get('/presets', (req, res) => {
    console.log("GET /presets request received");
    try {
        const presets = parseComments();
        console.log("Presets parsed successfully:", Object.keys(presets));
        res.json(presets);
    } catch (err) {
        console.error("Error in GET /presets:", err);
        res.status(500).json({ error: "Failed to load presets" });
    }
});

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
router.post('/', upload.single('image'), async (req, res) => {
    try {
        const { title, description, startDate, endDate, songUrl, tags, presetComments } = req.body;
        // Handle file upload or text URL fallback
        const coverUrl = req.file ? req.file.path : req.body.coverUrl;

        // Parse tags if they come as a string (from FormData)
        // FormData sends arrays as multiple entries, but multer might put them in body
        // If it's a JSON string, parse it. If it's single value, array-ify it.
        // Usually FormData sends `tags[0]`, `tags[1]` which bodyParser might not handle perfectly with multer.
        // Let's assume frontend sends stringified JSON or we handle simple list.
        // If `tags` is a string (e.g. "tag1,tag2"), split it.
        // If it comes as array from body parser, use it.
        let parsedTags = tags;
        if (typeof tags === 'string') {
            // Try to parse as JSON first (e.g. "[\"tag1\", \"tag2\"]")
            try {
                parsedTags = JSON.parse(tags);
            } catch (e) {
                // Fallback: split by comma if simply comma separated
                parsedTags = tags.split(',').map(tag => tag.trim());
            }
        }

        let parsedPresets = presetComments;
        if (typeof presetComments === 'string') {
            try {
                parsedPresets = JSON.parse(presetComments);
            } catch (e) {
                console.error("Error parsing presetComments:", e);
                parsedPresets = { positive: [], neutral: [], negative: [] };
            }
        }

        const challenge = new Challenge({
            title,
            description,
            startDate,
            endDate,
            songUrl,
            coverUrl,
            tags: parsedTags,
            presetComments: parsedPresets
        });

        const newChallenge = await challenge.save();
        res.status(201).json(newChallenge);
    } catch (err) {
        console.error("Error creating challenge:", err);
        res.status(400).json({ message: err.message });
    }
});

// DELETE a challenge
router.delete('/:id', async (req, res) => {
    try {
        const challenge = await Challenge.findByIdAndDelete(req.params.id);
        if (!challenge) {
            return res.status(404).json({ message: 'Challenge not found' });
        }
        res.json({ message: 'Challenge deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PUT update challenge
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = { ...req.body };

        // Parse JSON fields if they come as strings (from FormData)
        if (typeof updates.tags === 'string') {
            try { updates.tags = JSON.parse(updates.tags); } catch (e) { }
        }
        if (typeof updates.presetComments === 'string') {
            try { updates.presetComments = JSON.parse(updates.presetComments); } catch (e) { }
        }

        const challenge = await Challenge.findByIdAndUpdate(id, updates, { new: true });
        res.json(challenge);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
