const express = require('express');
const router = express.Router();

router.get('/summary', async (req, res) => {
  res.json({
    income: 0,
    expenses: 0,
    savings: 0,
    netWorth: 0,
    topCategories: []
  });
});

router.get('/cashflow', async (req, res) => {
  res.json({ cashflow: [] });
});

router.get('/predictions', async (req, res) => {
  res.json({ predictions: [] });
});

module.exports = router;