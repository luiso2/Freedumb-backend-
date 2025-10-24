require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { connectMongoDB } = require('./database/mongodb');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const { authenticate } = require('./middleware/auth');

// Import routes
const authRoutes = require('./routes/auth.routes');
const transactionRoutes = require('./routes/transaction.routes');
const budgetRoutes = require('./routes/budget.routes');
const investmentRoutes = require('./routes/investment.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const aiRoutes = require('./routes/ai.routes');
const notificationRoutes = require('./routes/notification.routes');
const userRoutes = require('./routes/user.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:3001',
    'http://localhost:3000',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'https://frontend-production-95a0.up.railway.app',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Trust proxy for Railway deployment
app.set('trust proxy', 1);

// Middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later'
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again later'
});

app.use('/api', limiter);
app.use('/api/auth', authLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// API Routes (sin autenticación)
app.use('/api/auth', authRoutes);

// API Routes (con autenticación)
app.use('/api/transactions', authenticate, transactionRoutes);
app.use('/api/budgets', authenticate, budgetRoutes);
app.use('/api/investments', authenticate, investmentRoutes);
app.use('/api/analytics', authenticate, analyticsRoutes);
app.use('/api/ai', authenticate, aiRoutes);
app.use('/api/notifications', authenticate, notificationRoutes);
app.use('/api/users', authenticate, userRoutes);

// API v1 Routes (alternative paths)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/transactions', authenticate, transactionRoutes);
app.use('/api/v1/budgets', authenticate, budgetRoutes);
app.use('/api/v1/investments', authenticate, investmentRoutes);
app.use('/api/v1/analytics', authenticate, analyticsRoutes);
app.use('/api/v1/ai', authenticate, aiRoutes);
app.use('/api/v1/notifications', authenticate, notificationRoutes);
app.use('/api/v1/users', authenticate, userRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'Cannot ' + req.method + ' ' + req.path,
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    await connectMongoDB();

    const fs = require('fs');
    const path = require('path');
    const logsDir = path.join(__dirname, '..', 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir);
    }

    app.listen(PORT, () => {
      logger.info('Server running on port ' + PORT);
      logger.info('Environment: ' + (process.env.NODE_ENV || 'development'));
      console.log('🚀 Server running on port ' + PORT);
      console.log('🌍 Environment: ' + (process.env.NODE_ENV || 'development'));
      console.log('📍 Health check: http://localhost:' + PORT + '/health');
      console.log('📍 API Base: http://localhost:' + PORT + '/api');
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

startServer();

module.exports = app;
