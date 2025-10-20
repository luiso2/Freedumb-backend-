const express = require('express');
const router = express.Router();

// Get all budgets
router.get('/', async (req, res) => {
  res.json([]);
});

// Create budget
router.post('/', async (req, res) => {
  const budget = {
    id: Date.now().toString(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  res.status(201).json(budget);
});

// Update budget
router.put('/:id', async (req, res) => {
  res.json({ message: `Updated budget ${req.params.id}` });
});

// Delete budget
router.delete('/:id', async (req, res) => {
  res.status(204).send();
});

module.exports = router;