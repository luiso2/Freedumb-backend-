const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const investmentSchema = new mongoose.Schema({
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
  symbol: {
    type: String,
    required: [true, 'El símbolo es requerido'],
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['stock', 'crypto', 'bond', 'mutual_fund', 'etf'],
    default: 'stock'
  },
  quantity: {
    type: Number,
    required: [true, 'La cantidad es requerida'],
    min: [0, 'La cantidad debe ser mayor a 0']
  },
  purchasePrice: {
    type: Number,
    required: [true, 'El precio de compra es requerido'],
    min: [0, 'El precio debe ser mayor a 0']
  },
  currentPrice: {
    type: Number,
    default: 0,
    min: 0
  },
  purchaseDate: {
    type: Date,
    required: true,
    default: Date.now
  }
}, {
  timestamps: true,
  _id: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Campos virtuales calculados
investmentSchema.virtual('totalValue').get(function() {
  return this.quantity * this.currentPrice;
});

investmentSchema.virtual('totalGainLoss').get(function() {
  return (this.currentPrice - this.purchasePrice) * this.quantity;
});

investmentSchema.virtual('gainLossPercentage').get(function() {
  if (this.purchasePrice === 0) return 0;
  return ((this.currentPrice - this.purchasePrice) / this.purchasePrice) * 100;
});

module.exports = mongoose.model('Investment', investmentSchema);
