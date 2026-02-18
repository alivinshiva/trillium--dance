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
    studioName: {
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
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Submission', submissionSchema);
