// routes/categories.js
const express = require('express');
const router = express.Router();
const { Category } = require('../models');
const { authenticateApiKey } = require('../middleware/auth');

// Apply authentication
router.use(authenticateApiKey);

// GET /api/categories - List categories
router.get('/', async (req, res) => {
  try {
    const { type } = req.query;
    
    // Build query for default categories and user's custom categories
    const query = {
      $or: [
        { isDefault: true },
        { userId: req.userId }
      ]
    };
    
    if (type && ['expense', 'income'].includes(type)) {
      query.type = type;
    }

    const categories = await Category.find(query).sort({ type: 1, name: 1 });

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

// GET /api/categories/:id - Get single category
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      $or: [
        { isDefault: true },
        { userId: req.userId }
      ]
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

// POST /api/categories - Create custom category
router.post('/', async (req, res) => {
  try {
    const { name, type, icon, color } = req.body;

    if (!name || !type) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Name and type are required'
      });
    }

    if (!['expense', 'income'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Type must be either "expense" or "income"'
      });
    }

    const category = await Category.create({
      name,
      type,
      icon: icon || '📝',
      color: color || '#6C5CE7',
      userId: req.userId,
      isDefault: false
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

// PUT /api/categories/:id - Update custom category
router.put('/:id', async (req, res) => {
  try {
    const { name, icon, color } = req.body;

    const category = await Category.findOne({
      _id: req.params.id,
      userId: req.userId,
      isDefault: false
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Category not found or cannot be edited'
      });
    }

    if (name) category.name = name;
    if (icon) category.icon = icon;
    if (color) category.color = color;

    await category.save();

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

// DELETE /api/categories/:id - Delete custom category
router.delete('/:id', async (req, res) => {
  try {
    const result = await Category.deleteOne({
      _id: req.params.id,
      userId: req.userId,
      isDefault: false
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Category not found or cannot be deleted'
      });
    }

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

module.exports = router;
