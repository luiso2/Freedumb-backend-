const express = require('express');
const router = express.Router();
const openAIService = require('../services/openai.service');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');

// Chat with AI assistant
router.post('/chat', async (req, res) => {
  try {
    const { message, context = [] } = req.body;
    const userId = req.user.id;

    // Get user data for context
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get recent transactions for context
    const transactions = await Transaction.find({ userId })
      .sort({ date: -1 })
      .limit(100);

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
    const userId = req.user.id;

    // Get user data
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get transactions
    const transactions = await Transaction.find({ userId })
      .sort({ date: -1 });

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
    const userId = req.user.id;

    // Get transactions
    const transactions = await Transaction.find({ userId })
      .sort({ date: -1 });

    // Get current budgets
    const budgets = await Budget.find({ 
      userId, 
      isActive: true 
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
