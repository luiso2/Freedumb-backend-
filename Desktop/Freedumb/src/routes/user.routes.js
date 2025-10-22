const express = require('express');

const router = express.Router();

router.get('/profile', async (req, res) => {
  res.json({
    id: req.userId,
    email: 'user@example.com',
    name: 'Test User'
  });
});

router.put('/profile', async (req, res) => {
  res.json({ message: 'Profile updated' });
});

router.delete('/account', async (req, res) => {
  res.status(204).send();
});

module.exports = router;
