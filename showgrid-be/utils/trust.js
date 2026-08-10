// Pure trust computation (no DB access - unit-testable). Design: FEED_ALGORITHM.md
// Trust weighs how trustworthy a rater's vote is before it feeds into the wilson score.
// Signals: account age, rating history, agreement with the crowd consensus.

const TRUST_FLOOR = 0.2; // even unknown raters keep a small voice
const AGE_FULL_DAYS = 30; // days of age until full accountAge credit
const HISTORY_FULL = 20; // ratings until full history credit
const W_AGE = 0.35;
const W_HISTORY = 0.35;
const W_AGREEMENT = 0.3;

const clamp01 = (x) => Math.max(0, Math.min(1, x));

// agreement: 0..1 fraction of the user's ratings within ±1 of each video's average.
function computeTrust({ accountAgeDays = 0, ratingCount = 0, agreement = 0.5 }) {
    const accountAge = clamp01(accountAgeDays / AGE_FULL_DAYS);
    const history = clamp01(ratingCount / HISTORY_FULL);
    const agreementC = clamp01(agreement);
    const score = W_AGE * accountAge + W_HISTORY * history + W_AGREEMENT * agreementC;
    return {
        score: clamp01(score) < TRUST_FLOOR ? TRUST_FLOOR : clamp01(score),
        accountAge,
        history,
        agreement: agreementC
    };
}

module.exports = { computeTrust, TRUST_FLOOR, AGE_FULL_DAYS, HISTORY_FULL };
