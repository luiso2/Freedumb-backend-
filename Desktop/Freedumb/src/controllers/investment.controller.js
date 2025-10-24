const logger = require('../utils/logger');
const { User, Transaction, Budget, Investment, Notification } = require('../models');

// Helper function to add calculated fields to investment
const addCalculatedFields = (investment) => {
  return {
    ...investment.toObject(),
    totalValue: investment.getTotalValue(),
    totalGainLoss: investment.getGainLoss(),
    gainLossPercentage: investment.getGainLossPercentage()
  };
};

// Get all investments for a user
const getInvestments = async (req, res) => {
  try {
    const { userId } = req;
    const { type } = req.query;
    
    const filter = { userId };
    if (type) {
      filter.type = type;
    }

    const investments = await Investment.find(filter)
      .sort({ createdAt: -1 });

    // Calculate summary
    const summary = {
      totalValue: 0,
      totalCost: 0,
      totalGainLoss: 0,
      totalGainLossPercentage: 0
    };

    investments.forEach(inv => {
      const value = inv.getTotalValue();
      const cost = inv.getTotalCost();
      summary.totalValue += value;
      summary.totalCost += cost;
      summary.totalGainLoss += inv.getGainLoss();
    });

    if (summary.totalCost > 0) {
      summary.totalGainLossPercentage = parseFloat(
        ((summary.totalGainLoss / summary.totalCost) * 100).toFixed(2)
      );
    }

    // Add calculated fields to each investment
    const investmentsWithCalcs = investments.map(addCalculatedFields);

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
    const { id } = req.params;
    const { userId } = req;

    const investment = await Investment.findOne({
      _id: id,
      userId
    });

    if (!investment) {
      return res.status(404).json({ error: 'Investment not found' });
    }

    res.json(addCalculatedFields(investment));
  } catch (error) {
    logger.error('Get investment error:', error);
    res.status(500).json({ error: 'Failed to fetch investment' });
  }
};

// Create investment
const createInvestment = async (req, res) => {
  try {
    const { userId } = req;
    
    const investmentData = {
      ...req.body,
      userId
    };

    // If currentPrice not provided, use purchasePrice
    if (!investmentData.currentPrice) {
      investmentData.currentPrice = investmentData.purchasePrice;
    }

    const investment = await Investment.create(investmentData);

    res.status(201).json(addCalculatedFields(investment));
  } catch (error) {
    logger.error('Create investment error:', error);
    res.status(500).json({ error: 'Failed to create investment' });
  }
};

// Update investment
const updateInvestment = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req;

    const investment = await Investment.findOne({
      _id: id,
      userId
    });

    if (!investment) {
      return res.status(404).json({ error: 'Investment not found' });
    }

    // Update fields
    Object.assign(investment, req.body);
    investment.lastUpdated = new Date();
    
    await investment.save();

    res.json(addCalculatedFields(investment));
  } catch (error) {
    logger.error('Update investment error:', error);
    res.status(500).json({ error: 'Failed to update investment' });
  }
};

// Delete investment
const deleteInvestment = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req;

    const investment = await Investment.findOne({
      _id: id,
      userId
    });

    if (!investment) {
      return res.status(404).json({ error: 'Investment not found' });
    }

    await investment.deleteOne();
    
    res.json({ 
      message: 'Investment deleted successfully',
      id 
    });
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
