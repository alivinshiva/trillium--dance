require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Connection Error:', err));

// Routes
const challengeRoutes = require('./routes/challenges');
const submissionRoutes = require('./routes/submissions');

app.use('/api/challenges', challengeRoutes);
app.use('/api/submissions', submissionRoutes);

app.get('/', (req, res) => {
    res.send('ShowGrid Admin Backend Running');
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
