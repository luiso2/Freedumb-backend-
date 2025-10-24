/**
 * Models Index - MongoDB/Mongoose
 * Exports all models for the application
 */

const User = require('./User');
const Transaction = require('./Transaction');
const Budget = require('./Budget');
const Investment = require('./Investment');
const Notification = require('./Notification');

module.exports = {
  User,
  Transaction,
  Budget,
  Investment,
  Notification
};
