const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const userSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuidv4
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Invalid email format'
    }
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  monthlyIncome: {
    type: Number,
    default: 0
  },
  savingsGoal: {
    type: Number,
    default: 0
  },
  riskTolerance: {
    type: String,
    enum: ['low', 'moderate', 'high'],
    default: 'moderate'
  },
  filingStatus: {
    type: String,
    enum: ['single', 'married', 'head_of_household'],
    default: 'single'
  },
  incomeBracket: {
    type: String,
    default: null
  },
  selfEmployed: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  collection: 'users'
});

// Index for email
userSchema.index({ email: 1 }, { unique: true });

const User = mongoose.model('User', userSchema);

module.exports = User;
