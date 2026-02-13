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
        type: String,
        required: true
    },
    videoUrl: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    city: {
        type: String
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    judgeTags: {
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

module.exports = mongoose.model('Submission', submissionSchema);
