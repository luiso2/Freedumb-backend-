// routes/summary.js
const express = require('express');
const router = express.Router();
const { Transaction, Category } = require('../models');
const { authenticateApiKey } = require('../middleware/auth');

// Apply authentication
router.use(authenticateApiKey);

// GET /api/summary - Get financial summary
router.get('/', async (req, res) => {
  try {
    const { startDate, endDate, period } = req.query;
    
    // Build date filter
    const dateFilter = {};
    const now = new Date();
    
    if (period) {
      switch (period) {
        case 'today':
          dateFilter.$gte = new Date(now.setHours(0, 0, 0, 0));
          dateFilter.$lte = new Date(now.setHours(23, 59, 59, 999));
          break;
        case 'week':
          const weekStart = new Date(now);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          weekStart.setHours(0, 0, 0, 0);
          dateFilter.$gte = weekStart;
          dateFilter.$lte = new Date();
          break;
        case 'month':
          dateFilter.$gte = new Date(now.getFullYear(), now.getMonth(), 1);
          dateFilter.$lte = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
        case 'year':
          dateFilter.$gte = new Date(now.getFullYear(), 0, 1);
          dateFilter.$lte = new Date(now.getFullYear(), 11, 31);
          break;
        case 'all':
        default:
          // No date filter
          break;
      }
    } else {
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) dateFilter.$lte = new Date(endDate);
    }

    const query = { userId: req.userId };
    if (Object.keys(dateFilter).length > 0) {
      query.date = dateFilter;
    }

    // Get aggregated data
    const summary = await Transaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $count: {} },
          average: { $avg: '$amount' }
        }
      }
    ]);

    // Get expenses by category
    const expensesByCategory = await Transaction.aggregate([
      { 
        $match: { 
          ...query, 
          type: 'expense' 
        } 
      },
      {
        $group: {
          _id: '$categoryId',
          amount: { $sum: '$amount' },
          count: { $count: {} }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category'
        }
      },
      {
        $unwind: {
          path: '$category',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          category: '$category.name',
          icon: '$category.icon',
          color: '$category.color',
          amount: 1,
          count: 1
        }
      },
      { $sort: { amount: -1 } }
    ]);

    // Calculate totals
    const expenseData = summary.find(s => s._id === 'expense') || { total: 0, count: 0, average: 0 };
    const incomeData = summary.find(s => s._id === 'income') || { total: 0, count: 0, average: 0 };
    
    const totalExpenses = expenseData.total;
    const totalIncome = incomeData.total;
    const balance = totalIncome - totalExpenses;

    // Add percentages to categories
    if (totalExpenses > 0) {
      expensesByCategory.forEach(cat => {
        cat.percentage = (cat.amount / totalExpenses) * 100;
      });
    }

    res.json({
      success: true,
      data: {
        totalExpenses,
        totalIncome,
        balance,
        transactionCount: expenseData.count + incomeData.count,
        averageExpense: expenseData.average,
        averageIncome: incomeData.average,
        expensesByCategory,
        period: {
          start: dateFilter.$gte || null,
          end: dateFilter.$lte || null
        }
      }
    });
  } catch (error) {
    console.error('Error generating summary:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

// GET /api/summary/monthly - Get monthly report
router.get('/monthly', async (req, res) => {
  try {
    const { month, year } = req.query;
    
    const currentDate = new Date();
    const targetMonth = month ? parseInt(month) - 1 : currentDate.getMonth();
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();
    
    const startDate = new Date(targetYear, targetMonth, 1);
    const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);
    
    const query = {
      userId: req.userId,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    };

    // Get daily balance
    const dailyData = await Transaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            day: { $dayOfMonth: '$date' },
            type: '$type'
          },
          amount: { $sum: '$amount' }
        }
      },
      {
        $group: {
          _id: '$_id.day',
          expenses: {
            $sum: {
              $cond: [{ $eq: ['$_id.type', 'expense'] }, '$amount', 0]
            }
          },
          income: {
            $sum: {
              $cond: [{ $eq: ['$_id.type', 'income'] }, '$amount', 0]
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Calculate daily balances
    const dailyBalance = dailyData.map(day => ({
      date: new Date(targetYear, targetMonth, day._id).toISOString(),
      expenses: day.expenses,
      income: day.income,
      balance: day.income - day.expenses
    }));

    // Get totals
    const totals = await Transaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' }
        }
      }
    ]);

    const totalExpenses = totals.find(t => t._id === 'expense')?.total || 0;
    const totalIncome = totals.find(t => t._id === 'income')?.total || 0;

    // Get expenses by category
    const expensesByCategory = await Transaction.aggregate([
      { 
        $match: { 
          ...query, 
          type: 'expense' 
        } 
      },
      {
        $group: {
          _id: '$categoryId',
          amount: { $sum: '$amount' }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category'
        }
      },
      {
        $unwind: '$category'
      },
      {
        $project: {
          category: '$category.name',
          amount: 1,
          percentage: {
            $multiply: [{ $divide: ['$amount', totalExpenses] }, 100]
          }
        }
      },
      { $sort: { amount: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        month: targetMonth + 1,
        year: targetYear,
        totalExpenses,
        totalIncome,
        balance: totalIncome - totalExpenses,
        expensesByCategory,
        dailyBalance
      }
    });
  } catch (error) {
    console.error('Error generating monthly report:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

module.exports = router;
