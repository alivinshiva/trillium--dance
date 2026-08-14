// Sub-challenge: a generated A/B battle between two videos from the same challenge.
// Voters pick the better hook (first 8s). Results are separate from the main
// feedScore/leaderboard - they feed the "Best Hook" studio badge.

const mongoose = require('mongoose');

const subChallengeSchema = new mongoose.Schema({
    challengeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Challenge',
        required: true
    },
    type: {
        type: String,
        enum: ['hook', 'transition', 'ending'],
        default: 'hook'
    },
    videoAId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Submission',
        required: true
    },
    videoBId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Submission',
        required: true
    },
    segmentA: {
        startSec: { type: Number, default: 0 },
        endSec: { type: Number, default: 8 }
    },
    segmentB: {
        startSec: { type: Number, default: 0 },
        endSec: { type: Number, default: 8 }
    },
    status: {
        type: String,
        enum: ['active', 'closed'],
        default: 'active'
    },
    votesA: { type: Number, default: 0 },
    votesB: { type: Number, default: 0 },
    winnerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Submission',
        default: null
    },
    endsAt: {
        type: Date,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Serve active battles fast: per challenge + per video, plus a global active pool
subChallengeSchema.index({ status: 1, endsAt: 1 });
subChallengeSchema.index({ status: 1, videoAId: 1 });
subChallengeSchema.index({ status: 1, videoBId: 1 });

module.exports = mongoose.model('SubChallenge', subChallengeSchema);
