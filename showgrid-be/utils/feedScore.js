// Pure scoring functions for the feed algorithm (no DB access - unit-testable).
// Design: FEED_ALGORITHM.md

const log1p = Math.log1p;

const DECAY_HOURS = 24;
const DECAY_EXP = 1.5;

const MIN_RATINGS_CAP = 5;
const MIN_RATINGS_FLOOR = 2;
const RATINGS_DIVISOR = 10;

// Scale-aware eligibility gate: min(5, max(2, round(activeRaters / 10)))
const dynamicMinRatings = (activeRaters) =>
    Math.min(MIN_RATINGS_CAP, Math.max(MIN_RATINGS_FLOOR, Math.round(activeRaters / RATINGS_DIVISOR)));

const recencyDecay = (ageHours) => 1 / Math.pow(1 + ageHours / DECAY_HOURS, DECAY_EXP);

// Wilson lower bound (95% CI) for a 1-5 rating scale, rescaled to 1-5.
// Anti-vote-stuffing: few ratings => wide interval => conservative score.
function wilson(count, average, z = 1.96) {
    if (!count || count <= 0 || !average || average <= 0) return 0;
    const p = Math.max(0, Math.min(1, (average - 1) / 4));
    const n = count;
    const denom = 1 + (z * z) / n;
    const center = p + (z * z) / (2 * n);
    const margin = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
    const lower = (center - margin) / denom;
    return 1 + Math.max(0, Math.min(1, lower)) * 4;
}

// Engagement efficiency = per-impression rates, log-scaled and weighted.
const computeEngagementEff = ({ likes = 0, comments = 0, shares = 0, impressions = 0 }) => {
    const imp = Math.max(impressions, 1);
    return log1p(likes / imp) + 1.5 * log1p(comments / imp) + 3 * log1p(shares / imp);
};

// Full trending score (feedScore) + leaderboard score (wilsonScore).
// ratingCount/ratingAverage (raw) gate eligibility & display; weightedCount/weightedAverage
// (trust-weighted) feed the wilson score so low-trust votes can't inflate ranking.
function computeScore({ likes, comments, shares, impressions, ratingCount, ratingAverage, weightedCount, weightedAverage, createdAt, studioBaseline = 0 }) {
    const ageHours = (Date.now() - new Date(createdAt).getTime()) / 3600000;
    const eff = computeEngagementEff({ likes, comments, shares, impressions });
    const exposureTrust = log1p(Math.max(impressions, 1));
    const decay = recencyDecay(Math.max(ageHours, 0));
    const boost = studioBaseline > 0 ? 1 + log1p(eff / studioBaseline) : 1;
    const wCount = weightedCount ?? ratingCount;
    const wAvg = weightedAverage ?? ratingAverage;
    const wilsonScore = wilson(wCount, wAvg);
    const score = wilsonScore * eff * exposureTrust * decay * boost;
    return { score, wilsonScore, engagementEff: eff };
}

module.exports = {
    wilson,
    dynamicMinRatings,
    recencyDecay,
    computeEngagementEff,
    computeScore
};
