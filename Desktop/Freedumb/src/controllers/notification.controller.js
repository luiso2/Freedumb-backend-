const logger = require('../utils/logger');
const { getModels } = require('../models');

// Get all notifications for a user
const getNotifications = async (req, res) => {
  try {
    const { Notification } = getModels();
    const { userId } = req;

    const { isRead, type, limit = 50 } = req.query;

    const where = { userId };
    if (isRead !== undefined) {
      where.isRead = isRead === 'true';
    }
    if (type) {
      where.type = type;
    }

    const notifications = await Notification.findAll({
      where,
      limit: parseInt(limit, 10),
      order: [['createdAt', 'DESC']]
    });

    res.json({ notifications });
  } catch (error) {
    logger.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

// Get notification by ID
const getNotificationById = async (req, res) => {
  try {
    const { Notification } = getModels();
    const { id } = req.params;
    const { userId } = req;

    const notification = await Notification.findOne({
      where: { id, userId }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json(notification);
  } catch (error) {
    logger.error('Get notification error:', error);
    res.status(500).json({ error: 'Failed to fetch notification' });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const { Notification } = getModels();
    const { id } = req.params;
    const { userId } = req;

    const notification = await Notification.findOne({
      where: { id, userId }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    await notification.update({
      isRead: true,
      readAt: new Date()
    });

    res.json(notification);
  } catch (error) {
    logger.error('Mark as read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
  try {
    const { Notification } = getModels();
    const { userId } = req;

    await Notification.update(
      {
        isRead: true,
        readAt: new Date()
      },
      {
        where: {
          userId,
          isRead: false
        }
      }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    logger.error('Mark all as read error:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
};

// Delete notification
const deleteNotification = async (req, res) => {
  try {
    const { Notification } = getModels();
    const { id } = req.params;
    const { userId } = req;

    const notification = await Notification.findOne({
      where: { id, userId }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    await notification.destroy();

    res.status(204).send();
  } catch (error) {
    logger.error('Delete notification error:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
};

module.exports = {
  getNotifications,
  getNotificationById,
  markAsRead,
  markAllAsRead,
  deleteNotification
};
