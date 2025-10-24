const logger = require('../utils/logger');
const { getModels } = require('../models');

// Get all investments for a user
const getInvestments = async (req, res) => {
  try {
    const { Investment } = getModels();
    const { userId } = req;

    const investments = await Investment.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']]
    });

    // Calculate summary
    const summary = {
      totalValue: 0,
      totalCost: 0,
      totalGain: 0,
      totalGainPercentage: 0
    };

    investments.forEach(inv => {
      const value = inv.getTotalValue();
      const cost = inv.getTotalCost();

      summary.totalValue += value;
      summary.totalCost += cost;
      summary.totalGain += inv.getGainLoss();
    });

    if (summary.totalCost > 0) {
      summary.totalGainPercentage = ((summary.totalGain / summary.totalCost) * 100).toFixed(2);
    }

    // Add calculated fields to each investment
    const investmentsWithCalcs = investments.map(inv => ({
      ...inv.toJSON(),
      totalValue: inv.getTotalValue(),
      totalCost: inv.getTotalCost(),
      gainLoss: inv.getGainLoss(),
      gainLossPercentage: inv.getGainLossPercentage()
    }));

    res.json({
      investments: investmentsWithCalcs,
      summary
    });
  } catch (error) {
    logger.error('Get investments error:', error);
    res.status(500).json({ error: 'Failed to fetch investments' });
  }
};

// Get investment by ID
const getInvestmentById = async (req, res) => {
  try {
    const { Investment } = getModels();
    const { id } = req.params;
    const { userId } = req;

    const investment = await Investment.findOne({
      where: { id, userId }
    });

    if (!investment) {
      return res.status(404).json({ error: 'Investment not found' });
    }

    res.json({
      ...investment.toJSON(),
      totalValue: investment.getTotalValue(),
      totalCost: investment.getTotalCost(),
      gainLoss: investment.getGainLoss(),
      gainLossPercentage: investment.getGainLossPercentage()
    });
  } catch (error) {
    logger.error('Get investment error:', error);
    res.status(500).json({ error: 'Failed to fetch investment' });
  }
};

// Create investment
const createInvestment = async (req, res) => {
  try {
    const { Investment } = getModels();
    const { userId } = req;

    const investment = await Investment.create({
      ...req.body,
      userId,
      currentPrice: req.body.purchasePrice // Initially set current price = purchase price
    });

    res.status(201).json({
      ...investment.toJSON(),
      totalValue: investment.getTotalValue(),
      totalCost: investment.getTotalCost(),
      gainLoss: investment.getGainLoss(),
      gainLossPercentage: investment.getGainLossPercentage()
    });
  } catch (error) {
    logger.error('Create investment error:', error);
    res.status(500).json({ error: 'Failed to create investment' });
  }
};

// Update investment
const updateInvestment = async (req, res) => {
  try {
    const { Investment } = getModels();
    const { id } = req.params;
    const { userId } = req;

    const investment = await Investment.findOne({
      where: { id, userId }
    });

    if (!investment) {
      return res.status(404).json({ error: 'Investment not found' });
    }

    await investment.update({
      ...req.body,
      lastUpdated: new Date()
    });

    res.json({
      ...investment.toJSON(),
      totalValue: investment.getTotalValue(),
      totalCost: investment.getTotalCost(),
      gainLoss: investment.getGainLoss(),
      gainLossPercentage: investment.getGainLossPercentage()
    });
  } catch (error) {
    logger.error('Update investment error:', error);
    res.status(500).json({ error: 'Failed to update investment' });
  }
};

// Delete investment
const deleteInvestment = async (req, res) => {
  try {
    const { Investment } = getModels();
    const { id } = req.params;
    const { userId } = req;

    const investment = await Investment.findOne({
      where: { id, userId }
    });

    if (!investment) {
      return res.status(404).json({ error: 'Investment not found' });
    }

    await investment.destroy();

    res.status(204).send();
  } catch (error) {
    logger.error('Delete investment error:', error);
    res.status(500).json({ error: 'Failed to delete investment' });
  }
};

module.exports = {
  getInvestments,
  getInvestmentById,
  createInvestment,
  updateInvestment,
  deleteInvestment
};
