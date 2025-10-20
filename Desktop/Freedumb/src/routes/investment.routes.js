const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  res.json({ investments: [], summary: { totalValue: 0, totalGain: 0, totalGainPercentage: 0 }});
});

router.post('/', async (req, res) => {
  res.status(201).json({ id: Date.now().toString(), ...req.body });
});

router.put('/:id', async (req, res) => {
  res.json({ message: `Updated investment ${req.params.id}` });
});

router.delete('/:id', async (req, res) => {
  res.status(204).send();
});

module.exports = router;
