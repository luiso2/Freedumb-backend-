const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction
} = require('../controllers/transaction.controller');

// All routes require authentication
router.use(authenticate);

// GET /api/transactions - Get all transactions
router.get('/', getTransactions);

// GET /api/transactions/:id - Get transaction by ID
router.get('/:id', getTransaction);

// POST /api/transactions - Create transaction
router.post('/', createTransaction);

// PUT /api/transactions/:id - Update transaction
router.put('/:id', updateTransaction);

// DELETE /api/transactions/:id - Delete transaction
router.delete('/:id', deleteTransaction);

module.exports = router;
