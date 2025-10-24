const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const budgetSchema = new mongoose.Schema({
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
  name: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  limit: {
    type: Number,
    required: [true, 'El límite es requerido'],
    min: [0, 'El límite debe ser mayor o igual a 0']
  },
  spent: {
    type: Number,
    default: 0,
    min: 0
  },
  period: {
    type: String,
    required: true,
    enum: ['weekly', 'monthly', 'yearly'],
    default: 'monthly'
  },
  startDate: {
    type: Date,
    required: true
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
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  _id: false
});

budgetSchema.index({ userId: 1, isActive: 1 });
budgetSchema.index({ userId: 1, category: 1 });

module.exports = mongoose.model('Budget', budgetSchema);
