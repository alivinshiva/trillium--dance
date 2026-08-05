// Feed score worker: recomputes feedScore + wilsonScore for all approved submissions.
// Runs every 10 min in-process; backfills on boot if stale. Decoupled from request handling
// so it can be extracted to a separate process later without code changes.

const Submission = require('../models/Submission');
const {
    VideoAggregate,
    VideoRatingAggregate,
    VideoRating
} = require('../models/Interaction');
const {
    computeScore,
    computeEngagementEff,
    dynamicMinRatings
} = require('../utils/feedScore');

const RECOMPUTE_INTERVAL_MS = 10 * 60 * 1000;
const STALE_AFTER_MS = 15 * 60 * 1000;
const BASELINE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

const computeAllScores = async () => {
    const submissions = await Submission.find({ status: 'approved' })
        .select('_id userId studioName createdAt')
        .lean();

    if (!submissions.length) {
        console.log('[feed-scores] no approved submissions to score');
        return;
    }

    const ids = submissions.map(s => s._id);
    const [aggs, ratingAggs] = await Promise.all([
        VideoAggregate.find({ _id: { $in: ids } }).lean(),
        VideoRatingAggregate.find({ _id: { $in: ids } }).lean()
    ]);

    const aggMap = new Map(aggs.map(a => [a._id.toString(), a]));
    const ratingMap = new Map(ratingAggs.map(a => [a._id.toString(), a]));

    const now = Date.now();

    // Engagement efficiency per video
    const effByVideo = new Map();
    for (const s of submissions) {
        const agg = aggMap.get(s._id.toString());
        effByVideo.set(s._id.toString(), computeEngagementEff({
            likes: agg?.likes || 0,
            comments: agg?.comments || 0,
            shares: agg?.shares || 0,
            impressions: agg?.impressions || 0
        }));
    }

    // Studio baselines: avg engagement efficiency over the last 30 days
    const studioEffs = new Map();
    for (const s of submissions) {
        if (now - new Date(s.createdAt).getTime() > BASELINE_WINDOW_MS) continue;
        const studioKey = s.studioName || s.userId;
        const entry = studioEffs.get(studioKey) || { sum: 0, count: 0 };
        entry.sum += effByVideo.get(s._id.toString()) || 0;
        entry.count += 1;
        studioEffs.set(studioKey, entry);
    }
    const studioBaseline = new Map();
    let globalSum = 0;
    let globalCount = 0;
    for (const [key, e] of studioEffs) {
        studioBaseline.set(key, e.sum / e.count);
        globalSum += e.sum;
        globalCount += e.count;
    }
    const globalBaseline = globalCount ? globalSum / globalCount : 0;

    // Scale-aware eligibility gate
    const activeRaters = (await VideoRating.distinct('userId')).length;
    const minRatings = dynamicMinRatings(activeRaters);

    const updatedAt = new Date();
    const ops = [];

    for (const s of submissions) {
        const agg = aggMap.get(s._id.toString());
        const rAgg = ratingMap.get(s._id.toString());
        const ratingCount = rAgg?.count || 0;
        const ratingAverage = rAgg?.average || 0;

        const isEligible = ratingCount >= minRatings;
        const baseline = studioBaseline.get(s.studioName || s.userId) || globalBaseline;

        const { score, wilsonScore } = computeScore({
            likes: agg?.likes || 0,
            comments: agg?.comments || 0,
            shares: agg?.shares || 0,
            impressions: agg?.impressions || 0,
            ratingCount,
            ratingAverage,
            createdAt: s.createdAt,
            studioBaseline: baseline
        });

        ops.push({
            updateOne: {
                filter: { _id: s._id },
                update: {
                    $set: {
                        feedScore: isEligible ? score : 0,
                        wilsonScore: isEligible ? wilsonScore : 0,
                        feedScoreUpdatedAt: updatedAt
                    }
                }
            }
        });
    }

    if (ops.length) {
        await Submission.bulkWrite(ops, { ordered: false });
    }
    console.log(`[feed-scores] scored ${ops.length} submissions (minRatings=${minRatings}, activeRaters=${activeRaters})`);
};

const startFeedScoreWorker = () => {
    const run = async () => {
        try {
            await computeAllScores();
        } catch (err) {
            console.error('[feed-scores] recompute error:', err);
        }
    };

    const backfillIfStale = async () => {
        try {
            const latest = await Submission.findOne({})
                .sort({ feedScoreUpdatedAt: -1 })
                .select('feedScoreUpdatedAt')
                .lean();
            if (!latest || !latest.feedScoreUpdatedAt || Date.now() - latest.feedScoreUpdatedAt.getTime() > STALE_AFTER_MS) {
                await run();
            } else {
                console.log('[feed-scores] scores up to date, skipping boot backfill');
            }
        } catch (err) {
            console.error('[feed-scores] boot backfill error:', err);
        }
    };

    backfillIfStale();
    setInterval(run, RECOMPUTE_INTERVAL_MS);
    console.log(`[feed-scores] worker started (recompute every ${RECOMPUTE_INTERVAL_MS / 60000} min)`);
};

module.exports = { startFeedScoreWorker, computeAllScores };
