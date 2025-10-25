// models/AuthLog.js
const mongoose = require('mongoose');

const authLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    enum: ['login', 'logout', 'register', 'password_reset', 'token_refresh'],
    required: true
  },
  success: {
    type: Boolean,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  errorMessage: {
    type: String
  }
}, {
  timestamps: true
});

// Index for user lookup
authLogSchema.index({ userId: 1, timestamp: -1 });
authLogSchema.index({ action: 1 });

module.exports = mongoose.model('AuthLog', authLogSchema);
