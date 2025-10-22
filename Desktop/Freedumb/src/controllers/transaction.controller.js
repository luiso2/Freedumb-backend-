const { Op } = require('sequelize');
const logger = require('../utils/logger');
const { getModels } = require('../models');
const openAIService = require('../services/openai.service');

// Get all transactions for a user
const getTransactions = async (req, res) => {
  try {
    const { Transaction } = getModels();
    const { userId } = req;

    const {
      page = 1,
      limit = 50,
      type,
      category,
      startDate,
      endDate,
      sortBy = 'date',
      order = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;

    // Build where clause
    const where = { userId };

    if (type) where.type = type;
    if (category) where.category = category;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date[Op.gte] = new Date(startDate);
      if (endDate) where.date[Op.lte] = new Date(endDate);
    }

    // Query transactions
    const { count, rows } = await Transaction.findAndCountAll({
      where,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      order: [[sortBy, order]]
    });

    res.json({
      transactions: rows,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    logger.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};

// Get transaction by ID
const getTransactionById = async (req, res) => {
  try {
    const { Transaction } = getModels();
    const { id } = req.params;
    const { userId } = req;

    const transaction = await Transaction.findOne({
      where: { id, userId }
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json(transaction);
  } catch (error) {
    logger.error('Get transaction error:', error);
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
};

// Create transaction
const createTransaction = async (req, res) => {
  try {
    const { Transaction } = getModels();
    const { userId } = req;

    const transaction = await Transaction.create({
      ...req.body,
      userId
    });

    // Emit real-time notification via WebSocket
    if (global.io) {
      global.io.to(`user-${userId}`).emit('transaction:created', transaction);
    }

    res.status(201).json(transaction);
  } catch (error) {
    logger.error('Create transaction error:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
};

// Create transaction from natural language
const createTransactionFromNLP = async (req, res) => {
  try {
    const { Transaction } = getModels();
    const { input } = req.body;
    const { userId } = req;

    // Parse natural language input
    const parsed = await openAIService.processTransactionNLP(input);

    // Create transaction with parsed data
    const transaction = await Transaction.create({
      ...parsed,
      userId,
      description: parsed.description || input
    });

    // Emit real-time notification via WebSocket
    if (global.io) {
      global.io.to(`user-${userId}`).emit('transaction:created', transaction);
    }

    res.status(201).json({
      transaction,
      parsed: {
        confidence: parsed.confidence || 0.95,
        originalInput: input
      }
    });
  } catch (error) {
    logger.error('Create transaction from NLP error:', error);
    res.status(500).json({ error: error.message || 'Failed to parse transaction' });
  }
};

// Update transaction
const updateTransaction = async (req, res) => {
  try {
    const { Transaction } = getModels();
    const { id } = req.params;
    const { userId } = req;

    const transaction = await Transaction.findOne({
      where: { id, userId }
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    await transaction.update(req.body);

    // Emit real-time notification via WebSocket
    if (global.io) {
      global.io.to(`user-${userId}`).emit('transaction:updated', transaction);
    }

    res.json(transaction);
  } catch (error) {
    logger.error('Update transaction error:', error);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
};

// Delete transaction
const deleteTransaction = async (req, res) => {
  try {
    const { Transaction } = getModels();
    const { id } = req.params;
    const { userId } = req;

    const transaction = await Transaction.findOne({
      where: { id, userId }
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    await transaction.destroy();

    // Emit real-time notification via WebSocket
    if (global.io) {
      global.io.to(`user-${userId}`).emit('transaction:deleted', { id });
    }

    res.status(204).send();
  } catch (error) {
    logger.error('Delete transaction error:', error);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
};

module.exports = {
  getTransactions,
  getTransactionById,
  createTransaction,
  createTransactionFromNLP,
  updateTransaction,
  deleteTransaction
};
