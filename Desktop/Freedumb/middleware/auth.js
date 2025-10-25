// middleware/auth.js
const { User } = require('../models');

// API Key authentication middleware
const authenticateApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'] || req.headers['authorization'];
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'API key is required'
      });
    }

    // For now, use the hardcoded API key and test user
    if (apiKey === 'a11f82a9e99991af3e04c87268513cd48ba812e5227896001cf08e4259393703') {
      // Find or create the test user
      let user = await User.findOne({ email: 'test@freedumb.com' });
      
      if (!user) {
        // Create test user if it doesn't exist
        user = await User.create({
          name: 'Test User',
          email: 'test@freedumb.com',
          username: 'testuser',
          password: '$2b$10$YourHashedPasswordHere',
          role: 'user',
          apiKey: apiKey
        });
      }
      
      req.user = user;
      req.userId = user._id;
      next();
    } else {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid API key'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Authentication failed'
    });
  }
};

// Optional auth - doesn't fail if no API key
const optionalAuth = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'] || req.headers['authorization'];
    
    if (apiKey === 'a11f82a9e99991af3e04c87268513cd48ba812e5227896001cf08e4259393703') {
      let user = await User.findOne({ email: 'test@freedumb.com' });
      
      if (user) {
        req.user = user;
        req.userId = user._id;
      }
    }
    
    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    next();
  }
};

module.exports = {
  authenticateApiKey,
  optionalAuth
};
