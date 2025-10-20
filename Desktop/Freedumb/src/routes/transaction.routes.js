const express = require('express');
const router = express.Router();
const openAIService = require('../services/openai.service');

// Get all transactions
router.get('/', async (req, res) => {
  res.json({
    transactions: [],
    pagination: {
      page: 1,
      limit: 50,
      total: 0,
      pages: 0
    }
  });
});

// Create transaction
router.post('/', async (req, res) => {
  const transaction = {
    id: Date.now().toString(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  res.status(201).json(transaction);
});

// Create transaction from natural language
router.post('/nlp', async (req, res) => {
  try {
    const { input } = req.body;
    const parsed = await openAIService.processTransactionNLP(input);

    const transaction = {
      id: Date.now().toString(),
      ...parsed,
      createdAt: new Date().toISOString()
    };

    res.status(201).json({
      transaction,
      parsed: {
        confidence: parsed.confidence || 0.95,
        originalInput: input
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get transaction by ID
router.get('/:id', async (req, res) => {
  res.json({ message: `Transaction ${req.params.id}` });
});

// Update transaction
router.put('/:id', async (req, res) => {
  res.json({ message: `Updated transaction ${req.params.id}` });
});

// Delete transaction
router.delete('/:id', async (req, res) => {
  res.status(204).send();
});

module.exports = router;