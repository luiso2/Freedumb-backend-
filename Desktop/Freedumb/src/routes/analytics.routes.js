const express = require('express');

const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');

// Get financial summary
router.get('/summary', analyticsController.getSummary);

// Get cashflow analysis
router.get('/cashflow', analyticsController.getCashflow);

// Get predictions
router.get('/predictions', analyticsController.getPredictions);

module.exports = router;
