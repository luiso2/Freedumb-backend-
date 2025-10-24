const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const transactionSchema = new mongoose.Schema({
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
  amount: {
    type: Number,
    required: [true, 'El monto es requerido'],
    min: [0.01, 'El monto debe ser mayor a 0']
  },
  type: {
    type: String,
    required: true,
    enum: ['income', 'expense', 'transfer'],
    index: true
  },
  category: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  description: {
    type: String,
    trim: true
  },
  merchant: {
    type: String,
    trim: true
  },
  paymentMethod: {
    type: String,
    trim: true
  },
  cardName: {
    type: String,
    trim: true
  },
  date: {
    type: Date,
    default: Date.now,
    index: true
  },
  isTaxDeductible: {
    type: Boolean,
    default: false
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    trim: true
  },
  aiCategorized: {
    type: Boolean,
    default: false
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1
  }
}, {
  timestamps: true,
  _id: false
});

// Índices compuestos para queries frecuentes
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, category: 1, date: -1 });
transactionSchema.index({ userId: 1, type: 1, date: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
