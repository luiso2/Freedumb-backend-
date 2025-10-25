// routes/transactions.js
const express = require('express');
const router = express.Router();
const { Transaction, Category } = require('../models');
const { authenticateApiKey } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticateApiKey);

// GET /api/transactions - List transactions
router.get('/', async (req, res) => {
  try {
    const {
      type,
      categoryId,
      startDate,
      endDate,
      limit = 100,
      skip = 0,
      sort = '-date'
    } = req.query;

    // Build query
    const query = { userId: req.userId };
    
    if (type && ['expense', 'income'].includes(type)) {
      query.type = type;
    }
    
    if (categoryId) {
      query.categoryId = categoryId;
    }
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // Execute query
    const transactions = await Transaction
      .find(query)
      .populate('category')
      .sort(sort)
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Transaction.countDocuments(query);

    res.json({
      success: true,
      total,
      data: transactions
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

// GET /api/transactions/:id - Get single transaction
router.get('/:id', async (req, res) => {
  try {
    const transaction = await Transaction
      .findOne({ _id: req.params.id, userId: req.userId })
      .populate('category');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

// POST /api/transactions - Create transaction
router.post('/', async (req, res) => {
  try {
    const { type, amount, description, categoryId, date } = req.body;

    // Validate required fields
    if (!type || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Type and amount are required'
      });
    }

    // Validate type
    if (!['expense', 'income'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Type must be either "expense" or "income"'
      });
    }

    // If no categoryId, find default category for the type
    let finalCategoryId = categoryId;
    if (!finalCategoryId) {
      const defaultCategory = await Category.findOne({
        type,
        isDefault: true,
        name: type === 'expense' ? 'Other Expense' : 'Other Income'
      });
      
      if (defaultCategory) {
        finalCategoryId = defaultCategory._id;
      }
    }

    // Create transaction
    const transaction = await Transaction.create({
      userId: req.userId,
      type,
      amount: parseFloat(amount),
      description: description || `${type} transaction`,
      categoryId: finalCategoryId,
      date: date ? new Date(date) : new Date()
    });

    // Populate category before sending response
    await transaction.populate('category');

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: transaction
    });
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

// PUT /api/transactions/:id - Update transaction
router.put('/:id', async (req, res) => {
  try {
    const { type, amount, description, categoryId, date } = req.body;

    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Transaction not found'
      });
    }

    // Update fields if provided
    if (type && ['expense', 'income'].includes(type)) {
      transaction.type = type;
    }
    if (amount !== undefined) {
      transaction.amount = parseFloat(amount);
    }
    if (description !== undefined) {
      transaction.description = description;
    }
    if (categoryId) {
      transaction.categoryId = categoryId;
    }
    if (date) {
      transaction.date = new Date(date);
    }

    await transaction.save();
    await transaction.populate('category');

    res.json({
      success: true,
      message: 'Transaction updated successfully',
      data: transaction
    });
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

// DELETE /api/transactions/:id - Delete transaction
router.delete('/:id', async (req, res) => {
  try {
    const result = await Transaction.deleteOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      message: 'Transaction deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

module.exports = router;
