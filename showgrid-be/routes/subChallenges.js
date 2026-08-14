const express = require('express');
const router = express.Router();
const SubChallenge = require('../models/SubChallenge');
const { SubChallengeVote } = require('../models/Interaction');
const { requireAuth } = require('../utils/auth');
const { rateLimit } = require('../utils/rateLimit');

// GET next active, unvoted sub-challenges for a viewer (oldest active first so
// battles with the most votes surface; voted ones are excluded).
router.get('/next', async (req, res) => {
    try {
        const { userId, challengeId, limit = 1, skip = 0 } = req.query;
        const limitNum = Math.min(5, Math.max(1, parseInt(limit)));
        const skipNum = Math.max(0, parseInt(skip));

        const votedIds = userId
            ? await SubChallengeVote.find({ userId }).distinct('subChallengeId')
            : [];
        const filter = { status: 'active' };
        if (votedIds.length) filter._id = { $nin: votedIds };
        if (challengeId) filter.challengeId = challengeId;

        const subs = await SubChallenge.find(filter)
            .sort({ createdAt: 1 })
            .skip(skipNum)
            .limit(limitNum)
            .populate('videoAId')
            .populate('videoBId')
            .lean();

        res.json({ data: subs });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST vote - idempotent (unique index on subChallengeId+userId); re-votes no-op.
router.post('/vote', requireAuth, rateLimit, async (req, res) => {
    try {
        const { subChallengeId, userId, choice } = req.body;
        if (!['A', 'B'].includes(choice)) {
            return res.status(400).json({ message: 'choice must be "A" or "B"' });
        }

        const sub = await SubChallenge.findOne({ _id: subChallengeId, status: 'active' });
        if (!sub) {
            return res.status(404).json({ message: 'Sub-challenge not found or already closed' });
        }

        const existing = await SubChallengeVote.findOne({ subChallengeId, userId });
        if (existing) {
            return res.json({
                success: true,
                alreadyVoted: true,
                choice: existing.choice,
                votesA: sub.votesA,
                votesB: sub.votesB
            });
        }

        await SubChallengeVote.create({ subChallengeId, userId, choice });
        const field = choice === 'A' ? 'votesA' : 'votesB';
        await SubChallenge.updateOne({ _id: subChallengeId }, { $inc: { [field]: 1 } });

        const updated = await SubChallenge.findById(subChallengeId).lean();
        res.status(201).json({
            success: true,
            alreadyVoted: false,
            choice,
            votesA: updated.votesA,
            votesB: updated.votesB
        });
    } catch (err) {
        if (err.code === 11000) {
            // Duplicate vote (concurrent) - treat as idempotent success
            const updated = await SubChallenge.findById(req.body.subChallengeId).lean();
            return res.json({
                success: true,
                alreadyVoted: true,
                votesA: updated.votesA,
                votesB: updated.votesB
            });
        }
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
