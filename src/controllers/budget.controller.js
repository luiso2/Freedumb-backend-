const { Op } = require('sequelize');
const logger = require('../utils/logger');
const { getModels } = require('../models');

// Get all budgets for a user
const getBudgets = async (req, res) => {
  try {
    const { Budget } = getModels();
    const { userId } = req;

    const { isActive } = req.query;
    const where = { userId };

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const budgets = await Budget.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });

    res.json(budgets);
  } catch (error) {
    logger.error('Get budgets error:', error);
    res.status(500).json({ error: 'Failed to fetch budgets' });
  }
};

// Get budget by ID
const getBudgetById = async (req, res) => {
  try {
    const { Budget } = getModels();
    const { id } = req.params;
    const { userId } = req;

    const budget = await Budget.findOne({
      where: { id, userId }
    });

    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    // Calculate percentage spent
    const percentageSpent = (parseFloat(budget.spent) / parseFloat(budget.limit)) * 100;

    res.json({
      ...budget.toJSON(),
      percentageSpent: percentageSpent.toFixed(2)
    });
  } catch (error) {
    logger.error('Get budget error:', error);
    res.status(500).json({ error: 'Failed to fetch budget' });
  }
};

// Create budget
const createBudget = async (req, res) => {
  try {
    const { Budget } = getModels();
    const { userId } = req;

    const budget = await Budget.create({
      ...req.body,
      userId
    });

    res.status(201).json(budget);
  } catch (error) {
    logger.error('Create budget error:', error);
    res.status(500).json({ error: 'Failed to create budget' });
  }
};

// Update budget
const updateBudget = async (req, res) => {
  try {
    const { Budget } = getModels();
    const { id } = req.params;
    const { userId } = req;

    const budget = await Budget.findOne({
      where: { id, userId }
    });

    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    await budget.update(req.body);

    res.json(budget);
  } catch (error) {
    logger.error('Update budget error:', error);
    res.status(500).json({ error: 'Failed to update budget' });
  }
};

// Delete budget
const deleteBudget = async (req, res) => {
  try {
    const { Budget } = getModels();
    const { id } = req.params;
    const { userId } = req;

    const budget = await Budget.findOne({
      where: { id, userId }
    });

    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    await budget.destroy();

    res.status(204).send();
  } catch (error) {
    logger.error('Delete budget error:', error);
    res.status(500).json({ error: 'Failed to delete budget' });
  }
};

// Update budget spent amount (called internally when transactions are created)
const updateBudgetSpent = async (userId, category, amount) => {
  try {
    const { Budget } = getModels();
    const now = new Date();

    // Find active budget for this category
    const budget = await Budget.findOne({
      where: {
        userId,
        category,
        isActive: true,
        startDate: { [Op.lte]: now },
        endDate: { [Op.gte]: now }
      }
    });

    if (budget) {
      const newSpent = parseFloat(budget.spent) + amount;
      await budget.update({ spent: newSpent });

      // Check if alert threshold reached
      const percentageSpent = (newSpent / parseFloat(budget.limit)) * 100;
      if (percentageSpent >= budget.alertThreshold && !budget.alertSent) {
        // Send alert notification
        const { Notification } = getModels();
        await Notification.create({
          userId,
          type: 'budget_alert',
          title: `Budget Alert: ${category}`,
          message: `You've reached ${percentageSpent.toFixed(1)}% of your ${category} budget`,
          priority: 'high',
          relatedEntityType: 'Budget',
          relatedEntityId: budget.id
        });

        await budget.update({ alertSent: true });

        // Emit WebSocket notification
        if (global.io) {
          global.io.to(`user-${userId}`).emit('budget:alert', {
            budget,
            percentageSpent
          });
        }
      }
    }
  } catch (error) {
    logger.error('Update budget spent error:', error);
  }
};

module.exports = {
  getBudgets,
  getBudgetById,
  createBudget,
  updateBudget,
  deleteBudget,
  updateBudgetSpent
};
