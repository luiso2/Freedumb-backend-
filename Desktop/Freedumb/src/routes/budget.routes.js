const express = require('express');

const router = express.Router();
const budgetController = require('../controllers/budget.controller');

// Get all budgets
router.get('/', budgetController.getBudgets);

// Create budget
router.post('/', budgetController.createBudget);

// Get budget by ID
router.get('/:id', budgetController.getBudgetById);

// Update budget
router.put('/:id', budgetController.updateBudget);

// Delete budget
router.delete('/:id', budgetController.deleteBudget);

module.exports = router;
