// User model: trust-weighted ratings. _id = Clerk userId (string).
// Trust is recomputed by the feed worker; stats mirror interaction aggregates for quick access.

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    trust: {
        score: { type: Number, default: 0.2 },
        accountAge: { type: Number, default: 0 },
        history: { type: Number, default: 0 },
        agreement: { type: Number, default: 0 },
        flags: { type: [String], default: [] }
    },
    stats: {
        ratingCount: { type: Number, default: 0 },
        likeCount: { type: Number, default: 0 },
        commentCount: { type: Number, default: 0 },
        shareCount: { type: Number, default: 0 }
    },
    lastRateLimitedAt: { type: Date, default: null },
    updatedAt: { type: Date, default: Date.now }
});

userSchema.index({ 'trust.score': 1 });

module.exports = mongoose.model('User', userSchema);
