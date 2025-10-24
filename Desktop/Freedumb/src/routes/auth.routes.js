const express = require('express');
const router = express.Router();
const { register, login, refresh } = require('../controllers/auth.controller');

// POST /api/auth/register - Register new user
router.post('/register', register);

// POST /api/auth/login - Login user
router.post('/login', login);

// POST /api/auth/refresh - Refresh access token
router.post('/refresh', refresh);

module.exports = router;
