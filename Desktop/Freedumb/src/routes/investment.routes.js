const express = require('express');

const router = express.Router();
const investmentController = require('../controllers/investment.controller');

// Get all investments
router.get('/', investmentController.getInvestments);

// Create investment
router.post('/', investmentController.createInvestment);

// Get investment by ID
router.get('/:id', investmentController.getInvestmentById);

// Update investment
router.put('/:id', investmentController.updateInvestment);

// Delete investment
router.delete('/:id', investmentController.deleteInvestment);

module.exports = router;
