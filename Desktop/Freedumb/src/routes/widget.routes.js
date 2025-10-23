/**
 * Widget Routes - Generate dynamic widget URLs for ChatGPT
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

/**
 * Generate widget URL with embedded token
 * POST /api/widget/generate
 */
router.post('/generate', async (req, res) => {
  try {
    const { widgetType, period, category, params } = req.body;
    const userId = req.userId; // From authenticate middleware

    // Validate widget type
    const validTypes = ['dashboard', 'transactions', 'budgets', 'insights', 'category'];
    if (widgetType && !validTypes.includes(widgetType)) {
      return res.status(400).json({
        error: 'Invalid widget type',
        validTypes
      });
    }

    // Generate temporary token for widget (expires in 1 hour)
    const widgetToken = jwt.sign(
      {
        userId,
        widgetType: widgetType || 'dashboard',
        period: period || 'month',
        scope: 'widget-read',
        iat: Math.floor(Date.now() / 1000)
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Build widget URL
    const frontendUrl = process.env.FRONTEND_URL || 'https://freedumb.app';
    const widgetUrl = new URL(`${frontendUrl}/`);

    // Add query parameters
    widgetUrl.searchParams.set('user', userId);
    widgetUrl.searchParams.set('type', widgetType || 'dashboard');
    widgetUrl.searchParams.set('period', period || 'month');
    widgetUrl.searchParams.set('token', widgetToken);

    if (category) {
      widgetUrl.searchParams.set('category', category);
    }

    // Add any custom params
    if (params && typeof params === 'object') {
      Object.entries(params).forEach(([key, value]) => {
        widgetUrl.searchParams.set(key, value);
      });
    }

    // Generate embed code
    const embedCode = `<iframe src="${widgetUrl.toString()}" width="100%" height="600" frameborder="0" style="border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);"></iframe>`;

    // Calculate expiration time
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    logger.info('Widget URL generated', {
      userId,
      widgetType: widgetType || 'dashboard',
      period: period || 'month'
    });

    res.json({
      success: true,
      widgetUrl: widgetUrl.toString(),
      embedCode,
      expiresAt: expiresAt.toISOString(),
      metadata: {
        widgetType: widgetType || 'dashboard',
        period: period || 'month',
        category: category || null,
        validUntil: expiresAt.toISOString()
      }
    });
  } catch (error) {
    logger.error('Error generating widget URL:', error);
    res.status(500).json({
      error: 'Failed to generate widget URL',
      message: error.message
    });
  }
});

/**
 * Validate widget token
 * GET /api/widget/validate
 */
router.get('/validate', async (req, res) => {
  try {
    const token = req.query.token || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if it's a widget token
    if (decoded.scope !== 'widget-read') {
      return res.status(403).json({ error: 'Invalid token scope' });
    }

    res.json({
      valid: true,
      userId: decoded.userId,
      widgetType: decoded.widgetType,
      period: decoded.period,
      expiresAt: new Date(decoded.exp * 1000).toISOString()
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    res.status(401).json({ error: 'Invalid token' });
  }
});

/**
 * Get widget configuration
 * GET /api/widget/config
 */
router.get('/config', async (req, res) => {
  try {
    const config = {
      availableTypes: [
        {
          type: 'dashboard',
          name: 'Dashboard Completo',
          description: 'Vista general con stats, gráficos, transacciones e insights'
        },
        {
          type: 'transactions',
          name: 'Transacciones',
          description: 'Lista detallada de transacciones con filtros'
        },
        {
          type: 'budgets',
          name: 'Presupuestos',
          description: 'Estado de presupuestos con barras de progreso'
        },
        {
          type: 'insights',
          name: 'Insights IA',
          description: 'Análisis y recomendaciones personalizadas'
        },
        {
          type: 'category',
          name: 'Análisis por Categoría',
          description: 'Deep dive en una categoría específica'
        }
      ],
      availablePeriods: [
        { value: 'day', label: 'Hoy' },
        { value: 'week', label: 'Esta Semana' },
        { value: 'month', label: 'Este Mes' },
        { value: 'year', label: 'Este Año' },
        { value: 'all', label: 'Todo el Historial' }
      ],
      categories: [
        { value: 'food', label: 'Comida y Restaurantes', icon: '🍔' },
        { value: 'transport', label: 'Transporte', icon: '🚗' },
        { value: 'shopping', label: 'Compras', icon: '🛍️' },
        { value: 'entertainment', label: 'Entretenimiento', icon: '🎬' },
        { value: 'bills', label: 'Facturas y Servicios', icon: '📄' },
        { value: 'healthcare', label: 'Salud', icon: '🏥' },
        { value: 'education', label: 'Educación', icon: '📚' },
        { value: 'investment', label: 'Inversiones', icon: '📈' }
      ],
      theme: {
        primary: '#667eea',
        secondary: '#764ba2',
        success: '#10b981',
        danger: '#ef4444'
      }
    };

    res.json(config);
  } catch (error) {
    logger.error('Error getting widget config:', error);
    res.status(500).json({ error: 'Failed to get widget configuration' });
  }
});

module.exports = router;
