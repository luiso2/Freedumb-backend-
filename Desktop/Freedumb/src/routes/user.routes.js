const express = require('express');

const router = express.Router();
const userController = require('../controllers/user.controller');

// Get user profile
router.get('/profile', userController.getProfile);

// Update user profile
router.put('/profile', userController.updateProfile);

// Delete user account
router.delete('/account', userController.deleteAccount);

module.exports = router;
