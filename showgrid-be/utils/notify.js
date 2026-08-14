const Notification = require('../models/Notification');
const { broadcastTo } = require('./sse');

// Create a notification and push it live to the owner's open streams.
const createNotification = async ({ userId, type, title, message, metadata, link }) => {
    const notification = await Notification.create({ userId, type, title, message, metadata, link });
    broadcastTo(userId, 'notification', { notification });
    return notification;
};

module.exports = { createNotification };
