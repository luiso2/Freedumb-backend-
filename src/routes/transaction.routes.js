const express = require('express');

const router = express.Router();
const transactionController = require('../controllers/transaction.controller');

// Get all transactions
router.get('/', transactionController.getTransactions);

// Create transaction
router.post('/', transactionController.createTransaction);

// Create transaction from natural language
router.post('/nlp', transactionController.createTransactionFromNLP);

// Get transaction by ID
router.get('/:id', transactionController.getTransactionById);

// Update transaction
router.put('/:id', transactionController.updateTransaction);

// Delete transaction
router.delete('/:id', transactionController.deleteTransaction);

module.exports = router;
