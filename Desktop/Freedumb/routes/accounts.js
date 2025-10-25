// routes/accounts.js
const express = require('express');
const router = express.Router();
const { Account, Transaction } = require('../models');
const { authenticateApiKey } = require('../middleware/auth');

// Apply authentication
router.use(authenticateApiKey);

// GET /api/accounts - List accounts
router.get('/', async (req, res) => {
  try {
    const accounts = await Account.find({ 
      userId: req.userId,
      isActive: true 
    }).sort({ createdAt: -1 });

    // Calculate current balance for each account based on transactions
    const accountsWithBalance = await Promise.all(
      accounts.map(async (account) => {
        const transactions = await Transaction.aggregate([
          { 
            $match: { 
              userId: req.userId,
              accountId: account._id 
            } 
          },
          {
            $group: {
              _id: '$type',
              total: { $sum: '$amount' }
            }
          }
        ]);

        const income = transactions.find(t => t._id === 'income')?.total || 0;
        const expenses = transactions.find(t => t._id === 'expense')?.total || 0;
        const calculatedBalance = account.balance + income - expenses;

        return {
          ...account.toJSON(),
          currentBalance: calculatedBalance
        };
      })
    );

    res.json({
      success: true,
      data: accountsWithBalance
    });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

// GET /api/accounts/:id - Get single account
router.get('/:id', async (req, res) => {
  try {
    const account = await Account.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Account not found'
      });
    }

    // Get account transactions summary
    const summary = await Transaction.aggregate([
      { 
        $match: { 
          userId: req.userId,
          accountId: account._id 
        } 
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $count: {} }
        }
      }
    ]);

    const income = summary.find(s => s._id === 'income') || { total: 0, count: 0 };
    const expenses = summary.find(s => s._id === 'expense') || { total: 0, count: 0 };

    res.json({
      success: true,
      data: {
        ...account.toJSON(),
        currentBalance: account.balance + income.total - expenses.total,
        totalIncome: income.total,
        totalExpenses: expenses.total,
        transactionCount: income.count + expenses.count
      }
    });
  } catch (error) {
    console.error('Error fetching account:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

// POST /api/accounts - Create account
router.post('/', async (req, res) => {
  try {
    const { name, type, balance, currency, institution } = req.body;

    if (!name || !type) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Name and type are required'
      });
    }

    const account = await Account.create({
      userId: req.userId,
      name,
      type,
      balance: balance || 0,
      currency: currency || 'USD',
      institution
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: account
    });
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

// PUT /api/accounts/:id - Update account
router.put('/:id', async (req, res) => {
  try {
    const { name, type, balance, currency, institution, isActive } = req.body;

    const account = await Account.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Account not found'
      });
    }

    if (name) account.name = name;
    if (type) account.type = type;
    if (balance !== undefined) account.balance = balance;
    if (currency) account.currency = currency;
    if (institution !== undefined) account.institution = institution;
    if (isActive !== undefined) account.isActive = isActive;

    await account.save();

    res.json({
      success: true,
      message: 'Account updated successfully',
      data: account
    });
  } catch (error) {
    console.error('Error updating account:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

// DELETE /api/accounts/:id - Delete account (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const account = await Account.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Account not found'
      });
    }

    // Soft delete - just mark as inactive
    account.isActive = false;
    await account.save();

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

module.exports = router;
