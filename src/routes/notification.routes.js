const express = require('express');

const router = express.Router();
const notificationController = require('../controllers/notification.controller');

// Get all notifications
router.get('/', notificationController.getNotifications);

// Mark all notifications as read
router.put('/read-all', notificationController.markAllAsRead);

// Get notification by ID
router.get('/:id', notificationController.getNotificationById);

// Mark notification as read
router.put('/:id/read', notificationController.markAsRead);

// Delete notification
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;
