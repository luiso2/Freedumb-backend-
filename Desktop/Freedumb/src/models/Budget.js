const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const budgetSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuidv4
  },
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  limit: {
    type: Number,
    required: true
  },
  spent: {
    type: Number,
    default: 0
  },
  period: {
    type: String,
    enum: ['weekly', 'monthly', 'quarterly', 'yearly'],
    default: 'monthly'
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  alertThreshold: {
    type: Number,
    default: 80,
    min: 0,
    max: 100
  },
  alertSent: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'budgets'
});

// Indexes
budgetSchema.index({ userId: 1 });
budgetSchema.index({ category: 1 });
budgetSchema.index({ isActive: 1 });

const Budget = mongoose.model('Budget', budgetSchema);

module.exports = Budget;
