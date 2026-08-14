const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { addClient } = require('../utils/sse');

// GET /api/notifications/stream?userId=... - Server-Sent Events live stream.
// Kept open; new notifications are pushed via the in-process SSE hub.
router.get('/stream', (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: 'UserId is required' });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // disable proxy buffering (nginx)
    res.flushHeaders();

    res.write('event: connected\ndata: {"message":"stream open"}\n\n');
    addClient(userId, res);

    // Heartbeat keeps idle connections and proxies from timing out.
    const heartbeat = setInterval(() => {
        try {
            res.write(': ping\n\n');
        } catch (err) {
            clearInterval(heartbeat);
        }
    }, 30000);
    res.on('close', () => clearInterval(heartbeat));
});

// GET /api/notifications?userId=...
router.get('/', async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) return res.status(400).json({ message: 'UserId is required' });

        const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', async (req, res) => {
    try {
        const notification = await Notification.findByIdAndUpdate(
            req.params.id,
            { read: true },
            { new: true }
        );
        res.json(notification);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PATCH /api/notifications/mark-all-read
router.patch('/mark-all-read', async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ message: 'UserId is required' });

        await Notification.updateMany(
            { userId, read: false },
            { read: true }
        );
        res.json({ message: 'All notifications marked as read' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
