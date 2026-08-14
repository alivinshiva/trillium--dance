require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { ClerkExpressWithAuth } = require('./utils/auth');
const { startFeedScoreWorker } = require('./workers/feedScores');
const { startSubChallengeWorker } = require('./workers/subChallenges');

const app = express();
const PORT = process.env.PORT;

// Middleware
app.use(cors({
    origin: ["http://localhost:5174", "http://localhost:5175", "http://localhost:5173", "https://dance.shivam-trillium.workers.dev"],
    credentials: true,
    methods: "GET,POST,PUT,DELETE",
    allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());
app.use(ClerkExpressWithAuth());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('MongoDB Connected (ShowGrid User Backend)');
        startFeedScoreWorker();
        startSubChallengeWorker();
    })
    .catch(err => console.error('MongoDB Connection Error:', err));

// Routes
const challengeRoutes = require('./routes/challenges');
const submissionRoutes = require('./routes/submissions');
const feedRoutes = require('./routes/feed');
const interactionRoutes = require('./routes/interactions');
const notificationRoutes = require('./routes/notifications');
const subChallengeRoutes = require('./routes/subChallenges');

app.use('/api/challenges', (req, res, next) => {
    console.log('API Request: /api/challenges');
    next();
}, challengeRoutes);

app.use('/api/submissions', (req, res, next) => {
    console.log('API Request: /api/submissions');
    next();
}, submissionRoutes);

app.use('/api/feed', (req, res, next) => {
    console.log('API Request: /api/feed');
    next();
}, feedRoutes);

app.use('/api/interactions', (req, res, next) => {
    console.log('API Request: /api/interactions');
    next();
}, interactionRoutes);

app.use('/api/notifications', (req, res, next) => {
    console.log('API Request: /api/notifications');
    next();
}, notificationRoutes);

app.use('/api/sub-challenges', (req, res, next) => {
    console.log('API Request: /api/sub-challenges');
    next();
}, subChallengeRoutes);

app.get('/', (req, res) => {
    res.send('ShowGrid User Backend Running on Port ' + PORT);
});

// Start Server
app.listen(PORT, () => {
    console.log(`ShowGrid User Server running on port ${PORT}`);
});
