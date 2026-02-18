const mongoose = require('mongoose');

const challengeSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    songUrl: {
        type: String,
        required: true
    },
    coverUrl: {
        type: String
    },
    tags: {
        type: [String],
        default: []
    },
    ratingParameters: {
        type: [{
            name: String,
            weight: Number
        }],
        default: [
            { name: 'Energy', weight: 10 },
            { name: 'Choreo', weight: 10 },
            { name: 'Sync', weight: 10 }
        ]
    },
    presetComments: {
        positive: [String],
        neutral: [String],
        negative: [String]
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Challenge', challengeSchema);
