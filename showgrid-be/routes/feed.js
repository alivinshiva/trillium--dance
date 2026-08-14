const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Submission = require('../models/Submission');
const SubChallenge = require('../models/SubChallenge');
const Challenge = require('../models/Challenge');
const {
    VideoRating,
    VideoView,
    VideoLike,
    VideoShare,
    VideoAggregate,
    SubChallengeVote
} = require('../models/Interaction');

// Re-show policy (Publisher Boost) - tunable via env
const RE_SHOW_CAP = parseInt(process.env.RE_SHOW_CAP) || 3;
const RE_SHOW_COOLDOWN_MS = (parseInt(process.env.RE_SHOW_COOLDOWN_HOURS) || 24) * 60 * 60 * 1000;

// Trending assembly
const FRESH_WINDOW_MS = 48 * 60 * 60 * 1000;
const STUDIO_CAP = 2;

// "For You" personalization - additive delivery-layer boost, never touches feedScore.
const AFFINITY_BOOST = parseFloat(process.env.AFFINITY_BOOST) || 0.5;
const AFFINITY_WINDOW_MULT = parseInt(process.env.AFFINITY_WINDOW_MULT) || 6;

// Videos this viewer must not see: rated (Requirement 1) or past re-show limits (Re-Show Policy)
const buildViewerExclusions = async (viewerId) => {
    const cooldownCutoff = new Date(Date.now() - RE_SHOW_COOLDOWN_MS);

    const [rated, viewStats] = await Promise.all([
        VideoRating.find({ userId: viewerId }).select('videoId').lean(),
        VideoView.aggregate([
            { $match: { userId: viewerId } },
            {
                $group: {
                    _id: '$videoId',
                    count: { $sum: 1 },
                    lastSeen: { $max: '$seenAt' }
                }
            },
            {
                $match: {
                    $or: [
                        { count: { $gte: RE_SHOW_CAP } },
                        { lastSeen: { $gte: cooldownCutoff } }
                    ]
                }
            }
        ])
    ]);

    const excluded = new Set(rated.map(r => r.videoId.toString()));
    for (const v of viewStats) {
        excluded.add(v._id.toString());
    }

    return [...excluded];
};

// Record a serve: 1 impression per serve (YouTube model) + a VideoView for the viewer
const recordServe = async (submissions, viewerId) => {
    if (!submissions.length) return;
    const now = new Date();

    await VideoAggregate.bulkWrite(submissions.map(sub => ({
        updateOne: {
            filter: { _id: sub._id },
            update: { $inc: { impressions: 1 }, $set: { updatedAt: now } },
            upsert: true
        }
    })));

    if (viewerId) {
        await VideoView.insertMany(submissions.map(sub => ({
            videoId: sub._id,
            userId: viewerId,
            seenAt: now
        })));
    }
};

// Assemble a trending page: freshness floor + studio cap + challenge round-robin.
// Deterministic within a worker window - same window => same assembly every request.
const assembleFeed = (windowSubs, freshSubs, limitNum) => {
    const assembled = [];
    const studioCounts = new Map();
    const seen = new Set();

    // Claim reserves a slot (dedupe + studio cap). Appending happens only in the
    // round-robin below so the final order reflects the interleave, not the passes.
    const claim = (sub) => {
        const key = sub._id.toString();
        if (seen.has(key)) return false;
        const studioKey = sub.studioName || sub.userId;
        const count = studioCounts.get(studioKey) || 0;
        if (count >= STUDIO_CAP) return false;
        seen.add(key);
        studioCounts.set(studioKey, count + 1);
        return true;
    };

    const freshFloorCount = Math.max(1, Math.ceil(limitNum * 0.25));
    const freshChosen = [];
    for (const sub of freshSubs) {
        if (freshChosen.length >= freshFloorCount) break;
        if (claim(sub)) freshChosen.push(sub);
    }
    const freshIds = new Set(freshChosen.map(s => s._id.toString()));

    // Remaining scored candidates not already taken by the freshness floor
    const rest = [];
    for (const sub of windowSubs) {
        if (rest.length >= limitNum * 2) break;
        if (!seen.has(sub._id.toString())) rest.push(sub);
    }

    // Group candidates by challenge (fresh-first within each group), then round-robin
    // across challenges so no single challenge can dominate or sit adjacent to itself.
    const keyOf = (sub) => {
        const cid = sub.challengeId;
        const id = cid && cid._id ? cid._id : cid;
        return id ? String(id) : 'none';
    };
    const byChallenge = new Map();
    for (const sub of [...freshChosen, ...rest]) {
        const cid = keyOf(sub);
        if (!byChallenge.has(cid)) byChallenge.set(cid, []);
        byChallenge.get(cid).push(sub);
    }

    // The freshest challenge leads the rotation; each pass pops one candidate per challenge.
    let progressed = true;
    while (progressed) {
        progressed = false;
        for (const list of byChallenge.values()) {
            while (list.length) {
                const sub = list.shift();
                const key = sub._id.toString();
                // Fresh-floor subs already reserved a slot; just append them.
                if (freshIds.has(key) || claim(sub)) {
                    assembled.push(sub);
                    progressed = true;
                    break;
                }
            }
        }
    }

    return assembled;
};

// Per-user tag affinity from explicit positive signals (rated 4-5, liked, or shared).
// Returns a Map<tag, weight>; only meaningful signals contribute.
const buildTagAffinity = async (viewerId) => {
    const [ratings, likes, shares] = await Promise.all([
        VideoRating.find({ userId: viewerId, rating: { $gte: 4 } }).select('videoId rating').lean(),
        VideoLike.find({ userId: viewerId }).select('videoId').lean(),
        VideoShare.find({ userId: viewerId }).select('videoId').lean()
    ]);

    const videoWeights = new Map(); // videoId -> weight
    const add = (id, w) => videoWeights.set(id.toString(), (videoWeights.get(id.toString()) || 0) + w);
    for (const r of ratings) add(r.videoId, r.rating - 2); // 4★=2, 5★=3
    for (const l of likes) add(l.videoId, 1);
    for (const s of shares) add(s.videoId, 2); // sharing is the strongest signal

    if (!videoWeights.size) return new Map();

    const subs = await Submission.find({ _id: { $in: [...videoWeights.keys()] } })
        .select('challengeId')
        .lean();
    const challengeIds = [...new Set(subs.map(s => s.challengeId).filter(Boolean))];
    const challenges = challengeIds.length
        ? await Challenge.find({ _id: { $in: challengeIds } }).select('tags').lean()
        : [];
    const tagOf = new Map(challenges.map(c => [c._id.toString(), c.tags || []]));

    const affinity = new Map();
    for (const s of subs) {
        const w = videoWeights.get(s._id.toString());
        for (const tag of tagOf.get(String(s.challengeId)) || []) {
            affinity.set(tag, (affinity.get(tag) || 0) + w);
        }
    }
    return affinity;
};

// Re-rank the scored window by tag overlap (delivery layer only - feedScore untouched).
// overlap = fraction of the video's challenge tags the user has shown affinity for.
// Pure/exported for unit tests.
const rankForYou = (windowSubs, affinity, limitNum) => {
    let ranked = windowSubs;
    if (affinity.size) {
        ranked = windowSubs.map(sub => {
            const tags = (sub.challengeId && sub.challengeId.tags) || [];
            const matched = tags.filter(t => affinity.has(t)).length;
            const overlap = tags.length ? matched / tags.length : 0;
            return {
                sub,
                overlap,
                personalized: sub.feedScore * (1 + AFFINITY_BOOST * overlap)
            };
        })
        .sort((a, b) =>
            b.personalized - a.personalized ||
            new Date(b.sub.createdAt) - new Date(a.sub.createdAt)
        )
        .map(s => s.sub);
    }

    // Studio cap (2) - a creator can't dominate even a personalized feed.
    const studioCounts = new Map();
    const out = [];
    for (const sub of ranked) {
        if (out.length >= limitNum) break;
        const studioKey = sub.studioName || sub.userId;
        const count = studioCounts.get(studioKey) || 0;
        if (count >= STUDIO_CAP) continue;
        studioCounts.set(studioKey, count + 1);
        out.push(sub);
    }
    return out;
};

// Active sub-challenges this viewer hasn't voted on yet (oldest active first).
const getUnvotedSubChallenges = async (viewerId, limit, skip) => {
    const votedIds = viewerId
        ? await SubChallengeVote.find({ userId: viewerId }).distinct('subChallengeId')
        : [];
    const filter = { status: 'active' };
    if (votedIds.length) filter._id = { $nin: votedIds };
    return SubChallenge.find(filter)
        .sort({ createdAt: 1 })
        .skip(skip || 0)
        .limit(limit)
        .populate('videoAId')
        .populate('videoBId')
        .lean();
};

// Interleave sub-challenge cards ~1 per 10 video slots. They are generated items,
// not rankings - they don't consume studio-cap or freshness-floor slots.
const interleaveSubChallenges = (page, subs) => {
    if (!subs.length) return page;
    const out = [];
    let si = 0;
    for (let i = 0; i < page.length; i++) {
        if (i > 0 && i % 10 === 0 && si < subs.length) {
            out.push({ type: 'sub_challenge', subChallenge: subs[si++] });
        }
        out.push(page[i]);
    }
    while (si < subs.length) out.push({ type: 'sub_challenge', subChallenge: subs[si++] });
    return out;
};

// GET /api/feed - Paginated, filtered, sorted feed of approved submissions
router.get('/', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            sort = 'latest',
            challengeId,
            userId,
            viewerId
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

        // Per-viewer exclusions: rated + past re-show limits
        if (viewerId) {
            const excluded = await buildViewerExclusions(viewerId);
            if (excluded.length) {
                filter._id = { $nin: excluded };
            }
        }

        // Trending: score-ranked window + assembly (freshness floor + studio cap)
        if ((sort === 'trending' || sort === 'for_you') && !userId) {
            // For You without a viewer = no profile, so fall back to plain trending.
            if (sort === 'for_you' && !viewerId) sort = 'trending';

            const windowLimit = limitNum * (sort === 'for_you' ? AFFINITY_WINDOW_MULT : 3);
            const freshSince = new Date(Date.now() - FRESH_WINDOW_MS);

            const [windowSubs, freshSubs, affinity] = await Promise.all([
                Submission.find(filter)
                    .sort({ feedScore: -1, createdAt: -1 })
                    .limit(windowLimit)
                    .populate('challengeId')
                    .lean(),
                Submission.find({ ...filter, createdAt: { $gte: freshSince } })
                    .sort({ createdAt: -1 })
                    .limit(limitNum)
                    .populate('challengeId')
                    .lean(),
                sort === 'for_you' ? buildTagAffinity(viewerId) : Promise.resolve(new Map())
            ]);

            const assembled = sort === 'for_you'
                ? rankForYou(windowSubs, affinity, limitNum)
                : assembleFeed(windowSubs, freshSubs, limitNum);
            const page = assembled.slice(skip, skip + limitNum);

            await recordServe(page, viewerId);

            // Interleave sub-challenge cards (~1 per 10 slots); per-page offset avoids
            // repeating the same card every page without votes.
            const subCount = Math.max(1, Math.ceil(limitNum / 10));
            const subChallenges = await getUnvotedSubChallenges(viewerId, subCount, (pageNum - 1) * subCount);
            const data = interleaveSubChallenges(page, subChallenges);

            return res.json({
                data,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total: assembled.length,
                    pages: Math.ceil(assembled.length / limitNum),
                    hasMore: skip + limitNum < assembled.length
                }
            });
        }

        // Build sort
        let sortQuery = {};
        switch (sort) {
            case 'oldest':
                sortQuery = { createdAt: 1 };
                break;
            case 'top_rated':
                sortQuery = { wilsonScore: -1, createdAt: -1 };
                break;
            case 'trending':
                sortQuery = { feedScore: -1, createdAt: -1 };
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

        // Record serves (impressions + viewer history)
        await recordServe(submissions, viewerId);

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
module.exports.assembleFeed = assembleFeed;
module.exports.rankForYou = rankForYou;
module.exports.buildTagAffinity = buildTagAffinity;
