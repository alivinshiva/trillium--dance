// Sub-challenge worker: closes finished battles and generates new A/B pairings.
// Same 10-min cadence as the feed score worker; decoupled so it can be extracted.

const Submission = require('../models/Submission');
const SubChallenge = require('../models/SubChallenge');

const RECOMPUTE_INTERVAL_MS = 10 * 60 * 1000;
const CHALLENGE_LIFETIME_MS = 48 * 60 * 60 * 1000;
const VOTE_THRESHOLD = 20; // close when this many votes are in (or lifetime expires)
const SCORE_PARITY = 0.8; // pair videos within this wilson-score range
const CONCURRENT_CAP_PER_VIDEO = 3; // max active battles a video can be in
const NEW_PAIRS_PER_RUN = 10;
const TYPES = ['hook', 'transition', 'ending'];

const pairKey = (a, b) => [String(a), String(b)].sort().join(':');

// Pure pairing logic (unit-testable). Given eligible submissions plus existing active
// pairs/counts, returns new pair candidates respecting score parity, studio exclusion,
// the concurrent cap, and no duplicate active pairs.
const buildPairs = (submissions, { activePairs = new Set(), activeCounts = new Map(), maxPairs = NEW_PAIRS_PER_RUN } = {}) => {
    const byChallenge = new Map();
    for (const s of submissions) {
        if ((activeCounts.get(String(s._id)) || 0) >= CONCURRENT_CAP_PER_VIDEO) continue;
        const cid = String(s.challengeId);
        if (!byChallenge.has(cid)) byChallenge.set(cid, []);
        byChallenge.get(cid).push(s);
    }

    const pairs = [];
    for (const list of byChallenge.values()) {
        if (pairs.length >= maxPairs) break;
        list.sort((a, b) => b.wilsonScore - a.wilsonScore);
        const usedThisRun = new Set();

        for (let i = 0; i < list.length && pairs.length < maxPairs; i++) {
            const a = list[i];
            if (usedThisRun.has(String(a._id))) continue;
            if ((activeCounts.get(String(a._id)) || 0) >= CONCURRENT_CAP_PER_VIDEO) continue;

            for (let j = i + 1; j < list.length; j++) {
                const b = list[j];
                if (usedThisRun.has(String(b._id))) continue;
                if (b.wilsonScore < a.wilsonScore - SCORE_PARITY) break; // sorted desc, parity exceeded
                if ((activeCounts.get(String(b._id)) || 0) >= CONCURRENT_CAP_PER_VIDEO) continue;

                const aStudio = a.studioName || a.userId;
                const bStudio = b.studioName || b.userId;
                if (aStudio === bStudio) continue;
                if (activePairs.has(pairKey(a._id, b._id))) continue;

                pairs.push({
                    challengeId: a.challengeId,
                    type: TYPES[pairs.length % TYPES.length],
                    videoAId: a._id,
                    videoBId: b._id
                });
                usedThisRun.add(String(a._id));
                usedThisRun.add(String(b._id));
                activePairs.add(pairKey(a._id, b._id));
                for (const vid of [a._id, b._id]) {
                    const k = String(vid);
                    activeCounts.set(k, (activeCounts.get(k) || 0) + 1);
                }
                break;
            }
        }
    }
    return pairs;
};

// Close active battles: lifetime expired OR vote threshold reached. Majority wins; ties discard.
const closeExpired = async () => {
    const now = new Date();
    const actives = await SubChallenge.find({ status: 'active' })
        .select('_id votesA votesB videoAId videoBId endsAt')
        .lean();

    const toClose = actives.filter(sc => sc.endsAt <= now || sc.votesA + sc.votesB >= VOTE_THRESHOLD);
    if (!toClose.length) return 0;

    const ops = toClose.map(sc => {
        let winnerId = null;
        if (sc.votesA !== sc.votesB) {
            winnerId = sc.votesA > sc.votesB ? sc.videoAId : sc.videoBId;
        }
        return {
            updateOne: {
                filter: { _id: sc._id },
                update: { $set: { status: 'closed', winnerId } }
            }
        };
    });
    await SubChallenge.bulkWrite(ops, { ordered: false });
    return ops.length;
};

// Generate fresh pairings: proven videos only (wilsonScore > 0), same challenge,
// score parity, never same studio, never a duplicate active pair, capped per video.
const generatePairs = async () => {
    const submissions = await Submission.find({ status: 'approved', wilsonScore: { $gt: 0 } })
        .select('_id challengeId studioName userId wilsonScore')
        .lean();
    if (!submissions.length) return 0;

    const actives = await SubChallenge.find({ status: 'active' })
        .select('videoAId videoBId')
        .lean();
    const activePairs = new Set();
    const activeCounts = new Map();
    for (const sc of actives) {
        activePairs.add(pairKey(sc.videoAId, sc.videoBId));
        for (const vid of [sc.videoAId, sc.videoBId]) {
            const k = vid.toString();
            activeCounts.set(k, (activeCounts.get(k) || 0) + 1);
        }
    }

    const pairs = buildPairs(submissions, { activePairs, activeCounts });
    if (!pairs.length) return 0;

    await SubChallenge.insertMany(pairs.map(p => ({
        ...p,
        endsAt: new Date(Date.now() + CHALLENGE_LIFETIME_MS)
    })));
    return pairs.length;
};

const run = async () => {
    try {
        const closed = await closeExpired();
        const created = await generatePairs();
        console.log(`[sub-challenges] closed=${closed}, created=${created}`);
    } catch (err) {
        console.error('[sub-challenges] recompute error:', err);
    }
};

const startSubChallengeWorker = () => {
    run();
    setInterval(run, RECOMPUTE_INTERVAL_MS);
    console.log(`[sub-challenges] worker started (recompute every ${RECOMPUTE_INTERVAL_MS / 60000} min)`);
};

module.exports = { startSubChallengeWorker, closeExpired, generatePairs, buildPairs, pairKey };
