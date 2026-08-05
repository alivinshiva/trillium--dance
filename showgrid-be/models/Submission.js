const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    userName: {
        type: String
    },
    userAvatar: {
        type: String
    },
    challengeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Challenge',
        required: true
    },
    videoUrl: {
        type: String,
        required: true
    },
    aiRating: {
        synchronization: Number,
        musicality: Number,
        energy_intensity: Number,
        choreography_complexity: Number,
        stage_utilization: Number,
        visual_cleanliness: Number,
        final_grid_index: Number,
        verdict_summary: String
    },
    description: {
        type: String
    },
    city: {
        type: String
    },
    studioName: {
        type: String
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    feedScore: {
        type: Number,
        default: 0
    },
    wilsonScore: {
        type: Number,
        default: 0
    },
    feedScoreUpdatedAt: {
        type: Date,
        default: null
    },
    judgeTags: {
        type: [String],
        default: []
    },
    tags: {
        type: [String],
        default: []
    },
    comments: [{
        userId: String,
        userName: String,
        userAvatar: String,
        text: String,
        type: { type: String, enum: ['positive', 'neutral', 'negative', 'custom'], default: 'custom' },
        createdAt: { type: Date, default: Date.now }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

submissionSchema.index({ feedScore: -1, createdAt: -1 });
submissionSchema.index({ wilsonScore: -1, createdAt: -1 });

module.exports = mongoose.model('Submission', submissionSchema);
