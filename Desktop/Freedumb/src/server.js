/**
 * FREEDUMB Backend Server
 * Main server file with Express configuration and middleware
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');
const http = require('http');
const path = require('path');
const jwt = require('jsonwebtoken');

// Import database connections
const { connectRedis } = require('./database/redis');
const { connectMongoDB } = require('./database/mongodb');

// Import routes
const authRoutes = require('./routes/auth.routes');
const transactionRoutes = require('./routes/transaction.routes');
const budgetRoutes = require('./routes/budget.routes');
const investmentRoutes = require('./routes/investment.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const aiRoutes = require('./routes/ai.routes');
const userRoutes = require('./routes/user.routes');
const notificationRoutes = require('./routes/notification.routes');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');
const { authenticate } = require('./middleware/auth');
const logger = require('./utils/logger');

// Import background jobs
const { startCronJobs } = require('./jobs/cronJobs');

// Create Express app
const app = express();
const server = http.createServer(app);

// CORS configuration for Socket.IO - allow multiple origins
const allowedSocketOrigins = [
  'http://localhost:3001',
  'http://localhost:3000',
  'http://localhost:5500', // Live Server
  'http://127.0.0.1:5500',
  'https://frontend-production-95a0.up.railway.app',
  process.env.FRONTEND_URL
].filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: allowedSocketOrigins,
    credentials: true,
    methods: ['GET', 'POST']
  }
});

// Store io instance for use in other modules
global.io = io;

// Basic rate limiter
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per 15 minutes
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true,
});

// CORS configuration to allow multiple origins
const allowedOrigins = [
  'http://localhost:3001',
  'http://localhost:3000',
  'http://localhost:5500', // Live Server
  'http://127.0.0.1:5500',
  'https://frontend-production-95a0.up.railway.app',
  process.env.FRONTEND_URL
].filter(Boolean);

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API Documentation (Swagger)
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Apply rate limiting
app.use('/api/', limiter);
app.use('/api/v1/', limiter);
app.use('/api/auth/', authLimiter);
app.use('/api/v1/auth/', authLimiter);

// Public routes (no authentication required)
app.use('/api/auth', authRoutes);
app.use('/api/v1/auth', authRoutes);

// Protected routes (authentication required)
app.use('/api/users', authenticate, userRoutes);
app.use('/api/v1/users', authenticate, userRoutes);

app.use('/api/transactions', authenticate, transactionRoutes);
app.use('/api/v1/transactions', authenticate, transactionRoutes);

app.use('/api/budgets', authenticate, budgetRoutes);
app.use('/api/v1/budgets', authenticate, budgetRoutes);

app.use('/api/investments', authenticate, investmentRoutes);
app.use('/api/v1/investments', authenticate, investmentRoutes);

app.use('/api/analytics', authenticate, analyticsRoutes);
app.use('/api/v1/analytics', authenticate, analyticsRoutes);

app.use('/api/ai', authenticate, aiRoutes);
app.use('/api/v1/ai', authenticate, aiRoutes);

app.use('/api/notifications', authenticate, notificationRoutes);
app.use('/api/v1/notifications', authenticate, notificationRoutes);

// WebSocket connection handling
io.on('connection', (socket) => {
  logger.info(`New WebSocket connection: ${socket.id}`);

  socket.on('authenticate', async (token) => {
    try {
      // Verify token and join user room
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.join(`user-${decoded.userId}`);
      socket.emit('authenticated', { userId: decoded.userId });
    } catch (error) {
      socket.emit('error', { message: 'Authentication failed' });
      socket.disconnect();
    }
  });

  socket.on('subscribe', (channel) => {
    socket.join(channel);
    logger.info(`Socket ${socket.id} joined channel: ${channel}`);
  });

  socket.on('unsubscribe', (channel) => {
    socket.leave(channel);
    logger.info(`Socket ${socket.id} left channel: ${channel}`);
  });

  socket.on('disconnect', () => {
    logger.info(`WebSocket disconnected: ${socket.id}`);
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.url}`,
    timestamp: new Date().toISOString()
  });
});

// Initialize database connections and start server
async function startServer() {
  try {
    // Connect to databases
    await connectMongoDB();
    logger.info('✅ MongoDB connected');

    await connectRedis();
    logger.info('✅ Redis connected');

    // Start background jobs
    startCronJobs();
    logger.info('✅ Background jobs started');

    // Start server
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      logger.info(`🚀 FREEDUMB Backend Server running on port ${PORT}`);
      logger.info(`📚 API Documentation available at http://localhost:${PORT}/api-docs`);
      logger.info(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions and rejections
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');

  server.close(() => {
    logger.info('HTTP server closed');
  });

  // Close database connections
  // Add cleanup logic here

  process.exit(0);
});

// Start the server
startServer();