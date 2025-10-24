const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const investmentSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuidv4
  },
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  symbol: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['stock', 'bond', 'crypto', 'etf', 'mutual_fund', 'real_estate', 'other'],
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  purchasePrice: {
    type: Number,
    required: true
  },
  currentPrice: {
    type: Number,
    required: true
  },
  purchaseDate: {
    type: Date,
    required: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    default: null
  }
}, {
  timestamps: true,
  collection: 'investments'
});

// Indexes
investmentSchema.index({ userId: 1 });
investmentSchema.index({ symbol: 1 });
investmentSchema.index({ type: 1 });

// Virtual fields for calculations
investmentSchema.methods.getTotalValue = function() {
  return this.quantity * this.currentPrice;
};

investmentSchema.methods.getTotalCost = function() {
  return this.quantity * this.purchasePrice;
};

investmentSchema.methods.getGainLoss = function() {
  return this.getTotalValue() - this.getTotalCost();
};

investmentSchema.methods.getGainLossPercentage = function() {
  const cost = this.getTotalCost();
  if (cost === 0) return 0;
  return ((this.getGainLoss() / cost) * 100).toFixed(2);
};

const Investment = mongoose.model('Investment', investmentSchema);

module.exports = Investment;
