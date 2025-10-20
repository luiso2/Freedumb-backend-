const express = require('express');
const router = express.Router();
const openAIService = require('../services/openai.service');

// Chat with AI assistant
router.post('/chat', async (req, res) => {
  try {
    const { message, context = [] } = req.body;
    const response = await openAIService.chatWithAssistant(message, context);
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
    const insights = await openAIService.generateFinancialInsights([], {});
    res.json(insights);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get budget recommendations
router.post('/budget-recommendations', async (req, res) => {
  try {
    const recommendations = await openAIService.generateBudgetRecommendations([], {});
    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;