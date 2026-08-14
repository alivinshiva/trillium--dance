const express = require('express');
const router = express.Router();
const SubChallenge = require('../models/SubChallenge');
const Submission = require('../models/Submission');
const { SubChallengeVote } = require('../models/Interaction');
const { requireAuth } = require('../utils/auth');
const { rateLimit } = require('../utils/rateLimit');

// Pure ranking logic (unit-testable). Takes closed battles as {videoAId, videoBId, winnerId}
// plus a map of submissionId -> {studioName, userName, userAvatar} and returns studios
// ranked by hookScore = winRate * log1p(battles) (0 if under MIN_BATTLES).
const MIN_BATTLES = 3;
const rankBestHook = (closed, submissionMap) => {
    const studioOf = (id) => {
        const s = submissionMap.get(String(id));
        return s ? (s.studioName || s.userId) : null;
    };
    const displayOf = (id) => {
        const s = submissionMap.get(String(id));
        return s ? { userName: s.userName, userAvatar: s.userAvatar } : {};
    };

    const stats = new Map(); // studio -> { studio, userName, userAvatar, battles, wins }
    for (const sc of closed) {
        const a = studioOf(sc.videoAId);
        const b = studioOf(sc.videoBId);
        for (const studio of [a, b]) {
            if (!studio) continue;
            let entry = stats.get(studio);
            if (!entry) {
                entry = { studio, ...displayOf(sc.videoAId === a ? sc.videoAId : sc.videoBId), battles: 0, wins: 0 };
                stats.set(studio, entry);
            }
            entry.battles += 1;
        }
        const winner = studioOf(sc.winnerId);
        if (winner && stats.has(winner)) stats.get(winner).wins += 1;
    }

    return [...stats.values()]
        .map(s => ({
            ...s,
            winRate: s.battles ? s.wins / s.battles : 0,
            hookScore: s.battles >= MIN_BATTLES ? (s.wins / s.battles) * Math.log1p(s.battles) : 0
        }))
        .sort((x, y) => y.hookScore - x.hookScore || y.wins - x.wins || y.battles - x.battles);
};

// GET best-hook studio badge from closed battles (win-rate weighted by volume).
router.get('/best-hook', async (req, res) => {
    try {
        const { challengeId } = req.query;
        const filter = { status: 'closed', winnerId: { $ne: null } };
        if (challengeId) filter.challengeId = challengeId;

        const closed = await SubChallenge.find(filter)
            .select('challengeId videoAId videoBId winnerId')
            .lean();
        if (!closed.length) return res.json({ studio: null, rankings: [] });

        const videoIds = [...new Set(closed.flatMap(sc => [sc.videoAId, sc.videoBId].map(String)))];
        const subs = await Submission.find({ _id: { $in: videoIds } })
            .select('studioName userId userName userAvatar')
            .lean();
        const submissionMap = new Map(subs.map(s => [s._id.toString(), s]));

        const rankings = rankBestHook(closed, submissionMap);
        res.json({ studio: rankings[0] || null, rankings: rankings.slice(0, 5) });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

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
module.exports.rankBestHook = rankBestHook;
