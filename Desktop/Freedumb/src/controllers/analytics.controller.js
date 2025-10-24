const logger = require('../utils/logger');
const { User, Transaction, Budget, Investment, Notification } = require('../models');
const openAIService = require('../services/openai.service');

// Get financial summary
const getSummary = async (req, res) => {
  try {

    const { userId } = req;

    const { startDate, endDate } = req.query;

    // Build date filter
    const filter = { userId };
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    // Get all transactions
    const transactions = await Transaction.find(filter);

    // Calculate totals
    const summary = {
      income: 0,
      expenses: 0,
      savings: 0,
      netWorth: 0,
      topCategories: {},
      transactionCount: transactions.length
    };

    transactions.forEach(t => {
      const amount = parseFloat(t.amount);
      if (t.type === 'income') {
        summary.income += amount;
      } else {
        summary.expenses += amount;
        summary.topCategories[t.category] = (summary.topCategories[t.category] || 0) + amount;
      }
    });

    summary.savings = summary.income - summary.expenses;

    // Convert topCategories to sorted array
    summary.topCategories = Object.entries(summary.topCategories)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    res.json(summary);
  } catch (error) {
    logger.error('Get summary error:', error);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
};

// Get cashflow analysis
const getCashflow = async (req, res) => {
  try {

    const { userId } = req;

    const { months = 6 } = req.query;

    // Get transactions from last N months
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(months, 10));

    const transactions = await Transaction.find({
      userId,
      date: { $gte: startDate }
    }).sort({ date: 1 });

    // Group by month
    const cashflowByMonth = {};

    transactions.forEach(t => {
      const month = t.date.toISOString().substring(0, 7); // YYYY-MM
      if (!cashflowByMonth[month]) {
        cashflowByMonth[month] = { income: 0, expenses: 0, net: 0 };
      }

      const amount = parseFloat(t.amount);
      if (t.type === 'income') {
        cashflowByMonth[month].income += amount;
      } else {
        cashflowByMonth[month].expenses += amount;
      }
    });

    // Calculate net for each month
    const cashflow = Object.entries(cashflowByMonth)
      .map(([month, data]) => ({
        month,
        income: data.income,
        expenses: data.expenses,
        net: data.income - data.expenses
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    res.json({ cashflow });
  } catch (error) {
    logger.error('Get cashflow error:', error);
    res.status(500).json({ error: 'Failed to fetch cashflow' });
  }
};

// Get predictions
const getPredictions = async (req, res) => {
  try {

    const { userId } = req;
    const { months = 3 } = req.query;

    // Get user data (for future use/validation)
    const _user = await User.findById(userId).select('-password');

    // Get historical transactions (last 12 months)
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 12);

    const transactions = await Transaction.find({
      userId,
      date: { $gte: startDate }
    });

    // Use AI to predict cashflow
    const predictions = await openAIService.predictCashFlow(
      transactions.map(t => t.toObject()),
      parseInt(months, 10)
    );

    res.json({ predictions });
  } catch (error) {
    logger.error('Get predictions error:', error);
    res.status(500).json({ error: 'Failed to generate predictions' });
  }
};

module.exports = {
  getSummary,
  getCashflow,
  getPredictions
};
