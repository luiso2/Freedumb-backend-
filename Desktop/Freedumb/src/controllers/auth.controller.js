const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const { getModels } = require('../models');

const generateToken = userId => jwt.sign(
  { userId },
  process.env.JWT_SECRET || 'default-secret-key',
  { expiresIn: process.env.JWT_EXPIRE || '15m' }
);

const generateRefreshToken = userId => jwt.sign(
  { userId },
  process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
  { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
);

const register = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const { User } = getModels();

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      name
    });

    // Update last login
    await user.update({ lastLogin: new Date() });

    // Generate tokens
    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Remove password from response
    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      monthlyIncome: user.monthlyIncome,
      savingsGoal: user.savingsGoal,
      riskTolerance: user.riskTolerance,
      createdAt: user.createdAt
    };

    res.status(201).json({
      user: userResponse,
      token,
      refreshToken
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { User } = getModels();

    // Find user
    const user = await User.findOne({ where: { email, isActive: true } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await user.update({ lastLogin: new Date() });

    // Generate tokens
    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Remove password from response
    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      monthlyIncome: user.monthlyIncome,
      savingsGoal: user.savingsGoal,
      riskTolerance: user.riskTolerance,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt
    };

    res.json({
      user: userResponse,
      token,
      refreshToken
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken: userRefreshToken } = req.body;
    const { User } = getModels();

    // Verify refresh token
    const decoded = jwt.verify(
      userRefreshToken,
      process.env.JWT_REFRESH_SECRET || 'default-refresh-secret'
    );

    // Verify user still exists and is active
    const user = await User.findOne({
      where: { id: decoded.userId, isActive: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    // Generate new tokens
    const token = generateToken(decoded.userId);
    const newRefreshToken = generateRefreshToken(decoded.userId);

    res.json({
      token,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    logger.error('Refresh token error:', error);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
};

const logout = async (req, res) => {
  // In a production app, you would invalidate the token in Redis here
  // For now, just send success response (token will expire naturally)
  res.json({ message: 'Logged out successfully' });
};

module.exports = {
  register,
  login,
  refreshToken,
  logout
};
