// Simple in-memory interaction rate limiter (per user per hour).
// Single-instance only - swap for Redis when running 2+ API instances.

const WINDOW_MS = 60 * 60 * 1000;
const MAX_ACTIONS = parseInt(process.env.INTERACTION_RATE_LIMIT) || 120;

const counters = new Map(); // userId -> [timestamps]

const prune = () => {
    const cutoff = Date.now() - WINDOW_MS;
    for (const [key, timestamps] of counters) {
        const recent = timestamps.filter(ts => ts > cutoff);
        if (recent.length) counters.set(key, recent);
        else counters.delete(key);
    }
};

// Prune stale entries periodically so the map doesn't grow unbounded
setInterval(prune, 5 * 60 * 1000).unref();

const rateLimit = (req, res, next) => {
    const userId = req.body.userId || req.query.userId;
    if (!userId) return next();

    const now = Date.now();
    const cutoff = now - WINDOW_MS;
    const timestamps = (counters.get(userId) || []).filter(ts => ts > cutoff);

    if (timestamps.length >= MAX_ACTIONS) {
        return res.status(429).json({ message: 'Too many actions. Please slow down and try again later.' });
    }

    timestamps.push(now);
    counters.set(userId, timestamps);
    next();
};

module.exports = { rateLimit };
