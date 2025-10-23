const logger = require('../utils/logger');
const { getModels } = require('../models');

// Get user profile
const getProfile = async (req, res) => {
  try {
    const { User } = getModels();
    const { userId } = req;

    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const { User } = getModels();
    const { userId } = req;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Don't allow updating password or email through this endpoint
    const { password: _password, email: _email, ...updateData } = req.body;

    await user.update(updateData);

    const updatedUser = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });

    res.json(updatedUser);
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

// Delete user account
const deleteAccount = async (req, res) => {
  try {
    const { User } = getModels();
    const { userId } = req;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Soft delete by marking as inactive
    await user.update({ isActive: false });

    // In a production app, you might want to:
    // 1. Delete or anonymize user data
    // 2. Cancel subscriptions
    // 3. Send confirmation email

    res.status(204).send();
  } catch (error) {
    logger.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  deleteAccount
};
