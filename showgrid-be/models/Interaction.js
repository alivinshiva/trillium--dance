const mongoose = require('mongoose');

// --- Interactions ---

// Video Likes
const videoLikeSchema = new mongoose.Schema({
    videoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Submission', required: true },
    userId: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});
// Unique constraints are handled at the DB level, but explicit indexing helps
videoLikeSchema.index({ videoId: 1, userId: 1 }, { unique: true });
videoLikeSchema.index({ videoId: 1, createdAt: -1 });

// Video Comments
const videoCommentSchema = new mongoose.Schema({
    videoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Submission', required: true },
    userId: { type: String, required: true },
    userName: String,
    userAvatar: String,
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'VideoComment', default: null }, // For replies
    body: { type: String, required: true },
    isDeleted: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});
videoCommentSchema.index({ videoId: 1, parentId: 1, createdAt: -1 });

// Video Shares
const videoShareSchema = new mongoose.Schema({
    videoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Submission', required: true },
    userId: { type: String, required: true },
    targetType: {
        type: String,
        enum: ['external', 'user', 'group', 'channel'],
        default: 'external'
    },
    targetId: { type: mongoose.Schema.Types.ObjectId, default: null },
    createdAt: { type: Date, default: Date.now }
});
videoShareSchema.index({ videoId: 1, createdAt: -1 });

// Video Ratings (1-5 stars)
const videoRatingSchema = new mongoose.Schema({
    videoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Submission', required: true },
    userId: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 }, // Single integer rating 1-5
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});
videoRatingSchema.index({ videoId: 1, userId: 1 }, { unique: true });

// Video Views (feed serves - powers re-show cap & cooldown)
const videoViewSchema = new mongoose.Schema({
    videoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Submission', required: true },
    userId: { type: String, required: true },
    seenAt: { type: Date, default: Date.now }
});
videoViewSchema.index({ userId: 1, videoId: 1 });
videoViewSchema.index({ userId: 1, seenAt: -1 });

// --- Aggregates (Denormalized Counts) ---

// General Video Aggregates (Likes, Comments, Shares)
const videoAggregateSchema = new mongoose.Schema({
    _id: { type: mongoose.Schema.Types.ObjectId, ref: 'Submission' }, // Maps directly to Submission ID
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    impressions: { type: Number, default: 0 }, // Feed serves (YouTube model, serve-counted)
    updatedAt: { type: Date, default: Date.now }
});

// Rating Aggregates (Sum and Count for Average Calculation)
const videoRatingAggregateSchema = new mongoose.Schema({
    _id: { type: mongoose.Schema.Types.ObjectId, ref: 'Submission' }, // Maps directly to Submission ID
    count: { type: Number, default: 0 },
    sum: { type: Number, default: 0 }, // Sum of all ratings
    average: { type: Number, default: 0 }, // Pre-calculated average for easy sorting
    updatedAt: { type: Date, default: Date.now }
});
videoRatingAggregateSchema.index({ average: -1 }); // Index for Leaderboard sorting

module.exports = {
    VideoLike: mongoose.model('VideoLike', videoLikeSchema),
    VideoComment: mongoose.model('VideoComment', videoCommentSchema),
    VideoShare: mongoose.model('VideoShare', videoShareSchema),
    VideoRating: mongoose.model('VideoRating', videoRatingSchema),
    VideoView: mongoose.model('VideoView', videoViewSchema),
    VideoAggregate: mongoose.model('VideoAggregate', videoAggregateSchema),
    VideoRatingAggregate: mongoose.model('VideoRatingAggregate', videoRatingAggregateSchema)
};
