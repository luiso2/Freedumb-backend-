const express = require('express');

const router = express.Router();
const { body, validationResult } = require('express-validator');
const authController = require('../controllers/auth.controller');

// Validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Register route
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('name').notEmpty().trim()
  ],
  validateRequest,
  authController.register
);

// Login route
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  validateRequest,
  authController.login
);

// Refresh token route
router.post(
  '/refresh',
  body('refreshToken').notEmpty(),
  validateRequest,
  authController.refreshToken
);

// Logout route
router.post('/logout', authController.logout);

module.exports = router;
