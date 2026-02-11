require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected (ShowGrid User Backend)'))
    .catch(err => console.error('MongoDB Connection Error:', err));

// Routes
const challengeRoutes = require('./routes/challenges');
const submissionRoutes = require('./routes/submissions');

app.use('/api/challenges', (req, res, next) => {
    console.log('API Request: /api/challenges');
    next();
}, challengeRoutes);

app.use('/api/submissions', (req, res, next) => {
    console.log('API Request: /api/submissions');
    next();
}, submissionRoutes);

app.get('/', (req, res) => {
    res.send('ShowGrid User Backend Running on Port ' + PORT);
});

// Start Server
app.listen(PORT, () => {
    console.log(`ShowGrid User Server running on port ${PORT}`);
});
