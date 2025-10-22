const express = require('express');

const router = express.Router();
const openAIService = require('../services/openai.service');
const { getModels } = require('../models');

// Chat with AI assistant
router.post('/chat', async (req, res) => {
  try {
    const { message, context = [] } = req.body;
    const { User, Transaction } = getModels();
    const { userId } = req;

    // Get user data for context
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });

    // Get recent transactions for context
    const transactions = await Transaction.findAll({
      where: { userId },
      limit: 100,
      order: [['date', 'DESC']]
    });

    // Calculate financial data for context
    const financialData = {
      balance: 0,
      monthlyIncome: parseFloat(user.monthlyIncome) || 0,
      monthlyExpenses: 0,
      savingsRate: 0,
      activeGoals: 0
    };

    transactions.forEach(t => {
      if (t.type === 'income') {
        financialData.balance += parseFloat(t.amount);
      } else {
        financialData.balance -= parseFloat(t.amount);
        financialData.monthlyExpenses += parseFloat(t.amount);
      }
    });

    if (financialData.monthlyIncome > 0) {
      financialData.savingsRate = (((financialData.monthlyIncome - financialData.monthlyExpenses)
        / financialData.monthlyIncome) * 100).toFixed(2);
    }

    const response = await openAIService.chatWithAssistant(message, context, financialData);

    res.json({ response, suggestions: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Auto-categorize transaction
router.post('/categorize', async (req, res) => {
  try {
    const result = await openAIService.categorizeTransaction(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get financial insights
router.get('/insights', async (req, res) => {
  try {
    const { Transaction, User } = getModels();
    const { userId } = req;

    // Get user data
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });

    // Get transactions
    const transactions = await Transaction.findAll({
      where: { userId },
      order: [['date', 'DESC']]
    });

    const userData = {
      monthlyIncome: parseFloat(user.monthlyIncome) || 0,
      savingsGoal: parseFloat(user.savingsGoal) || 0,
      riskTolerance: user.riskTolerance || 'moderate'
    };

    const insights = await openAIService.generateFinancialInsights(
      transactions.map(t => t.toJSON()),
      userData
    );

    res.json(insights);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get budget recommendations
router.post('/budget-recommendations', async (req, res) => {
  try {
    const { Transaction, Budget } = getModels();
    const { userId } = req;

    // Get transactions
    const transactions = await Transaction.findAll({
      where: { userId },
      order: [['date', 'DESC']]
    });

    // Get current budgets
    const budgets = await Budget.findAll({
      where: { userId, isActive: true }
    });

    const currentBudget = {};
    budgets.forEach(b => {
      currentBudget[b.category] = parseFloat(b.limit);
    });

    const recommendations = await openAIService.generateBudgetRecommendations(
      transactions.map(t => t.toJSON()),
      currentBudget
    );

    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
