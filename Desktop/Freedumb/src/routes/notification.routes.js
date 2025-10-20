const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  res.json({ notifications: [] });
});

router.put('/:id/read', async (req, res) => {
  res.json({ message: 'Notification marked as read' });
});

router.delete('/:id', async (req, res) => {
  res.status(204).send();
});

module.exports = router;