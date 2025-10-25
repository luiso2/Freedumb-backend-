const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { Transaction, Category, Account } = require('../models');

// ============================================
// CREAR TRANSACCIÓN - POST /api/transactions
// ============================================
router.post('/transactions', authenticateToken, async (req, res) => {
  try {
    const { type, amount, description, categoryId, date } = req.body;
    const userId = req.userId;

    // Validación
    if (!type || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Type and amount are required',
        code: 'VALIDATION_ERROR'
      });
    }

    if (!['expense', 'income'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Type must be expense or income',
        code: 'INVALID_TYPE'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be greater than 0',
        code: 'INVALID_AMOUNT'
      });
    }

    // Crear transacción
    const transaction = new Transaction({
      userId,
      type,
      amount,
      description: description || '',
      categoryId: categoryId || null,
      date: date ? new Date(date) : new Date()
    });

    await transaction.save();

    console.log(`✅ Transaction created: ${type} ${amount} - ${description}`);

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: transaction
    });

  } catch (error) {
    console.error('❌ Error creating transaction:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
});

// ============================================
// LISTAR TRANSACCIONES - GET /api/transactions
// ============================================
router.get('/transactions', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { type, categoryId, startDate, endDate, limit = 100, skip = 0 } = req.query;

    // Construir filtro
    const filter = { userId };
    if (type) filter.type = type;
    if (categoryId) filter.categoryId = categoryId;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .sort({ date: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(skip)),
      Transaction.countDocuments(filter)
    ]);

    res.json({
      success: true,
      total,
      data: transactions
    });

  } catch (error) {
    console.error('❌ Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
});

// ============================================
// OBTENER TRANSACCIÓN - GET /api/transactions/:id
// ============================================
router.get('/transactions/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const transaction = await Transaction.findOne({ _id: id, userId });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found',
        code: 'NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: transaction
    });

  } catch (error) {
    console.error('❌ Error fetching transaction:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
});

// ============================================
// ACTUALIZAR TRANSACCIÓN - PUT /api/transactions/:id
// ============================================
router.put('/transactions/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { type, amount, description, categoryId, date } = req.body;

    const transaction = await Transaction.findOne({ _id: id, userId });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found',
        code: 'NOT_FOUND'
      });
    }

    // Actualizar campos
    if (type) transaction.type = type;
    if (amount !== undefined) transaction.amount = amount;
    if (description !== undefined) transaction.description = description;
    if (categoryId !== undefined) transaction.categoryId = categoryId;
    if (date) transaction.date = new Date(date);

    await transaction.save();

    res.json({
      success: true,
      message: 'Transaction updated successfully',
      data: transaction
    });

  } catch (error) {
    console.error('❌ Error updating transaction:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
});

// ============================================
// ELIMINAR TRANSACCIÓN - DELETE /api/transactions/:id
// ============================================
router.delete('/transactions/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const transaction = await Transaction.findOne({ _id: id, userId });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found',
        code: 'NOT_FOUND'
      });
    }

    await transaction.deleteOne();

    res.json({
      success: true,
      message: 'Transaction deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting transaction:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
});

// ============================================
// OBTENER RESUMEN - GET /api/summary
// ============================================
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { startDate, endDate } = req.query;

    const filter = { userId };
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(filter);

    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalIncome - totalExpenses;

    // Agrupar por categoría
    const expensesByCategory = {};
    const incomeByCategory = {};

    transactions.forEach(t => {
      const cat = t.categoryId || 'uncategorized';
      if (t.type === 'expense') {
        expensesByCategory[cat] = (expensesByCategory[cat] || 0) + t.amount;
      } else {
        incomeByCategory[cat] = (incomeByCategory[cat] || 0) + t.amount;
      }
    });

    res.json({
      success: true,
      data: {
        totalExpenses,
        totalIncome,
        balance,
        expensesByCategory: Object.entries(expensesByCategory).map(([category, amount]) => ({
          category,
          amount
        })),
        incomeByCategory: Object.entries(incomeByCategory).map(([category, amount]) => ({
          category,
          amount
        }))
      }
    });

  } catch (error) {
    console.error('❌ Error calculating summary:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
});

// ============================================
// LISTAR CATEGORÍAS - GET /api/categories
// ============================================
router.get('/categories', authenticateToken, async (req, res) => {
  try {
    const { type } = req.query;
    
    const filter = {};
    if (type) filter.type = type;

    const categories = await Category.find(filter);

    res.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('❌ Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
});

// ============================================
// LISTAR CUENTAS - GET /api/accounts
// ============================================
router.get('/accounts', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    
    const accounts = await Account.find({ userId, isActive: true });

    res.json({
      success: true,
      data: accounts
    });

  } catch (error) {
    console.error('❌ Error fetching accounts:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
});

module.exports = router;
