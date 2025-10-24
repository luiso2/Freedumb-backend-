const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const notificationSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => uuidv4()
  },
  userId: {
    type: String,
    required: true,
    ref: 'User',
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: ['budget_alert', 'goal_reached', 'transaction_reminder', 'ai_insight'],
    index: true
  },
  title: {
    type: String,
    required: [true, 'El título es requerido'],
    trim: true
  },
  message: {
    type: String,
    required: [true, 'El mensaje es requerido'],
    trim: true
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  relatedEntity: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true,
  _id: false
});

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
