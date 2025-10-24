const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const transactionSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuidv4
  },
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  amount: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true
  },
  category: {
    type: String,
    required: true
  },
  subCategory: {
    type: String,
    default: null
  },
  description: {
    type: String,
    default: null
  },
  merchant: {
    type: String,
    default: null
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'credit_card', 'debit_card', 'bank_transfer', 'other'],
    default: 'cash'
  },
  cardName: {
    type: String,
    default: null
  },
  businessType: {
    type: String,
    enum: ['personal', 'business'],
    default: 'personal'
  },
  businessName: {
    type: String,
    default: null
  },
  isTaxDeductible: {
    type: Boolean,
    default: false
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringFrequency: {
    type: String,
    enum: ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'],
    default: null
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  confidence: {
    type: Number,
    default: 1.0,
    min: 0,
    max: 1
  },
  notes: {
    type: String,
    default: null
  }
}, {
  timestamps: true,
  collection: 'transactions'
});

// Indexes for performance
transactionSchema.index({ userId: 1 });
transactionSchema.index({ date: -1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ category: 1 });
transactionSchema.index({ userId: 1, date: -1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
