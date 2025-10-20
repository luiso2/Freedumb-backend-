# FREEDUMB - Code Examples
## Implementaciones Completas de Componentes Principales

---

## 13. EJEMPLOS DE CÓDIGO - SERVICIOS COMPLETOS

### 13.1 Main Server Setup (Express)

```javascript
// services/transaction/index.js
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { sequelize } = require('./config/database');
const logger = require('./services/logger/Logger');
const { initTracing } = require('./services/tracing/tracer');
const { metricsMiddleware, metricsEndpoint } = require('./middleware/metricsMiddleware');
const { authenticate } = require('./middleware/authMiddleware');
const { helmetMiddleware, corsMiddleware, apiLimiter } = require('./middleware/securityMiddleware');
const compressionMiddleware = require('./middleware/compressionMiddleware');
const errorHandler = require('./middleware/errorHandler');

// Routes
const transactionRoutes = require('./routes/transactionRoutes');
const accountRoutes = require('./routes/accountRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const recurringRoutes = require('./routes/recurringRoutes');

// Initialize tracing
initTracing('transaction-service');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compressionMiddleware);
app.use(metricsMiddleware);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'transaction-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Metrics endpoint (Prometheus)
app.get('/metrics', metricsEndpoint);

// API routes (all require authentication)
app.use('/v1/transactions', authenticate, apiLimiter, transactionRoutes);
app.use('/v1/accounts', authenticate, apiLimiter, accountRoutes);
app.use('/v1/categories', authenticate, apiLimiter, categoryRoutes);
app.use('/v1/recurring', authenticate, apiLimiter, recurringRoutes);

// Error handling
app.use(errorHandler);

// Database connection and server start
async function startServer() {
  try {
    // Test database connection
    await sequelize.authenticate();
    logger.info('Database connection established successfully');

    // Sync models (in development only)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      logger.info('Database models synchronized');
    }

    // Start server
    app.listen(PORT, () => {
      logger.info(`Transaction Service running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('Unable to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing server gracefully');

  // Close database connection
  await sequelize.close();

  // Exit process
  process.exit(0);
});

startServer();

module.exports = app;
```

### 13.2 Transaction Routes

```javascript
// routes/transactionRoutes.js
const express = require('express');
const router = express.Router();
const TransactionController = require('../controllers/TransactionController');
const { validationRules } = require('../middleware/validationMiddleware');

// GET /v1/transactions - List transactions with filters
router.get('/',
  validationRules.pagination,
  TransactionController.list
);

// GET /v1/transactions/stats - Get statistics
router.get('/stats',
  TransactionController.getStatistics
);

// GET /v1/transactions/by-category - Group by category
router.get('/by-category',
  TransactionController.getByCategory
);

// GET /v1/transactions/by-merchant - Group by merchant
router.get('/by-merchant',
  TransactionController.getByMerchant
);

// POST /v1/transactions/search - Advanced search
router.post('/search',
  TransactionController.advancedSearch
);

// POST /v1/transactions - Create transaction
router.post('/',
  validationRules.createTransaction,
  TransactionController.create
);

// POST /v1/transactions/batch - Batch create
router.post('/batch',
  TransactionController.batchCreate
);

// GET /v1/transactions/:id - Get single transaction
router.get('/:id',
  validationRules.uuidParam('id'),
  TransactionController.getById
);

// PUT /v1/transactions/:id - Update transaction
router.put('/:id',
  validationRules.uuidParam('id'),
  validationRules.createTransaction,
  TransactionController.update
);

// PATCH /v1/transactions/:id/category - Update category only
router.patch('/:id/category',
  validationRules.uuidParam('id'),
  TransactionController.updateCategory
);

// DELETE /v1/transactions/:id - Delete transaction
router.delete('/:id',
  validationRules.uuidParam('id'),
  TransactionController.delete
);

// POST /v1/transactions/:id/receipt - Upload receipt
router.post('/:id/receipt',
  validationRules.uuidParam('id'),
  TransactionController.uploadReceipt
);

module.exports = router;
```

### 13.3 Transaction Controller

```javascript
// controllers/TransactionController.js
const TransactionService = require('../services/TransactionService');
const logger = require('../services/logger/Logger');

class TransactionController {
  // GET /v1/transactions
  async list(req, res, next) {
    try {
      const { userId } = req.user;
      const filters = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 50,
        start_date: req.query.start_date,
        end_date: req.query.end_date,
        account_id: req.query.account_id,
        category_id: req.query.category_id,
        transaction_type: req.query.transaction_type,
        min_amount: req.query.min_amount,
        max_amount: req.query.max_amount,
        sort: req.query.sort || 'transaction_date',
        order: req.query.order || 'desc'
      };

      logger.logRequest(req, { filters });

      const result = await TransactionService.getTransactions(userId, filters);

      return res.json({
        success: true,
        data: result.transactions,
        meta: result.meta
      });
    } catch (error) {
      logger.logError(error, { controller: 'TransactionController', method: 'list' });
      next(error);
    }
  }

  // POST /v1/transactions
  async create(req, res, next) {
    try {
      const { userId } = req.user;
      const transactionData = req.body;

      logger.logTransaction('create', userId, { amount: transactionData.amount });

      const transaction = await TransactionService.create(userId, transactionData);

      return res.status(201).json({
        success: true,
        data: transaction,
        message: 'Transaction created successfully'
      });
    } catch (error) {
      logger.logError(error, { controller: 'TransactionController', method: 'create' });
      next(error);
    }
  }

  // GET /v1/transactions/:id
  async getById(req, res, next) {
    try {
      const { userId } = req.user;
      const { id } = req.params;

      const transaction = await TransactionService.findById(userId, id);

      if (!transaction) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Transaction not found'
          }
        });
      }

      return res.json({
        success: true,
        data: transaction
      });
    } catch (error) {
      logger.logError(error, { controller: 'TransactionController', method: 'getById' });
      next(error);
    }
  }

  // PUT /v1/transactions/:id
  async update(req, res, next) {
    try {
      const { userId } = req.user;
      const { id } = req.params;
      const updateData = req.body;

      logger.logTransaction('update', userId, { transactionId: id });

      const transaction = await TransactionService.update(userId, id, updateData);

      if (!transaction) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Transaction not found'
          }
        });
      }

      return res.json({
        success: true,
        data: transaction,
        message: 'Transaction updated successfully'
      });
    } catch (error) {
      logger.logError(error, { controller: 'TransactionController', method: 'update' });
      next(error);
    }
  }

  // DELETE /v1/transactions/:id
  async delete(req, res, next) {
    try {
      const { userId } = req.user;
      const { id } = req.params;

      logger.logTransaction('delete', userId, { transactionId: id });

      const deleted = await TransactionService.delete(userId, id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Transaction not found'
          }
        });
      }

      return res.json({
        success: true,
        message: 'Transaction deleted successfully'
      });
    } catch (error) {
      logger.logError(error, { controller: 'TransactionController', method: 'delete' });
      next(error);
    }
  }

  // GET /v1/transactions/stats
  async getStatistics(req, res, next) {
    try {
      const { userId } = req.user;
      const { start_date, end_date } = req.query;

      const stats = await TransactionService.getStatistics(userId, {
        start_date,
        end_date
      });

      return res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.logError(error, { controller: 'TransactionController', method: 'getStatistics' });
      next(error);
    }
  }

  // GET /v1/transactions/by-category
  async getByCategory(req, res, next) {
    try {
      const { userId } = req.user;
      const { start_date, end_date, transaction_type } = req.query;

      const result = await TransactionService.groupByCategory(userId, {
        start_date,
        end_date,
        transaction_type
      });

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.logError(error, { controller: 'TransactionController', method: 'getByCategory' });
      next(error);
    }
  }

  // GET /v1/transactions/by-merchant
  async getByMerchant(req, res, next) {
    try {
      const { userId } = req.user;
      const { start_date, end_date, limit = 20 } = req.query;

      const result = await TransactionService.groupByMerchant(userId, {
        start_date,
        end_date,
        limit
      });

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.logError(error, { controller: 'TransactionController', method: 'getByMerchant' });
      next(error);
    }
  }

  // POST /v1/transactions/batch
  async batchCreate(req, res, next) {
    try {
      const { userId } = req.user;
      const { transactions } = req.body;

      if (!Array.isArray(transactions) || transactions.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Transactions must be a non-empty array'
          }
        });
      }

      logger.logTransaction('batch_create', userId, { count: transactions.length });

      const result = await TransactionService.batchImport(userId, transactions);

      return res.status(201).json({
        success: true,
        data: result,
        message: `${result.success.length} transactions created, ${result.failed.length} failed`
      });
    } catch (error) {
      logger.logError(error, { controller: 'TransactionController', method: 'batchCreate' });
      next(error);
    }
  }

  // POST /v1/transactions/search
  async advancedSearch(req, res, next) {
    try {
      const { userId } = req.user;
      const searchCriteria = req.body;

      const result = await TransactionService.advancedSearch(userId, searchCriteria);

      return res.json({
        success: true,
        data: result.transactions,
        meta: result.meta
      });
    } catch (error) {
      logger.logError(error, { controller: 'TransactionController', method: 'advancedSearch' });
      next(error);
    }
  }

  // PATCH /v1/transactions/:id/category
  async updateCategory(req, res, next) {
    try {
      const { userId } = req.user;
      const { id } = req.params;
      const { category_id } = req.body;

      if (!category_id) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'category_id is required'
          }
        });
      }

      const transaction = await TransactionService.update(userId, id, {
        category_id,
        ai_categorized: false
      });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Transaction not found'
          }
        });
      }

      return res.json({
        success: true,
        data: transaction,
        message: 'Category updated successfully'
      });
    } catch (error) {
      logger.logError(error, { controller: 'TransactionController', method: 'updateCategory' });
      next(error);
    }
  }

  // POST /v1/transactions/:id/receipt
  async uploadReceipt(req, res, next) {
    try {
      const { userId } = req.user;
      const { id } = req.params;

      // Implementation depends on file upload library (multer, etc.)
      // This is a placeholder
      const receiptUrl = req.body.receipt_url;

      const transaction = await TransactionService.update(userId, id, {
        receipt_url: receiptUrl
      });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Transaction not found'
          }
        });
      }

      return res.json({
        success: true,
        data: transaction,
        message: 'Receipt uploaded successfully'
      });
    } catch (error) {
      logger.logError(error, { controller: 'TransactionController', method: 'uploadReceipt' });
      next(error);
    }
  }
}

module.exports = new TransactionController();
```

### 13.4 Error Handler Middleware

```javascript
// middleware/errorHandler.js
const logger = require('../services/logger/Logger');

class AppError extends Error {
  constructor(message, statusCode, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.logError(err, {
    url: req.url,
    method: req.method,
    userId: req.user?.userId
  });

  // Sequelize validation error
  if (err.name === 'SequelizeValidationError') {
    const message = err.errors.map(e => e.message).join(', ');
    error = new AppError(message, 400, 'VALIDATION_ERROR');
  }

  // Sequelize unique constraint error
  if (err.name === 'SequelizeUniqueConstraintError') {
    const message = 'Duplicate field value entered';
    error = new AppError(message, 400, 'DUPLICATE_ERROR');
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = new AppError(message, 401, 'INVALID_TOKEN');
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = new AppError(message, 401, 'TOKEN_EXPIRED');
  }

  // Send response
  res.status(error.statusCode || 500).json({
    success: false,
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: error.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    }
  });
};

module.exports = errorHandler;
module.exports.AppError = AppError;
```

### 13.5 Database Models (Sequelize)

```javascript
// models/Transaction.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  account_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'accounts',
      key: 'id'
    }
  },
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'transaction_categories',
      key: 'id'
    }
  },
  transaction_type: {
    type: DataTypes.ENUM('income', 'expense', 'transfer'),
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    validate: {
      min: 0.01
    }
  },
  currency_code: {
    type: DataTypes.STRING(3),
    defaultValue: 'USD'
  },
  transaction_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  merchant_name: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  location: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  receipt_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  is_recurring: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  recurring_rule_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'recurring_rules',
      key: 'id'
    }
  },
  is_business_expense: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  tax_deduction_amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    defaultValue: []
  },
  ai_categorized: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  ai_confidence_score: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 1
    }
  },
  external_transaction_id: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed', 'cancelled'),
    defaultValue: 'completed'
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'transactions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['user_id', 'transaction_date']
    },
    {
      fields: ['account_id']
    },
    {
      fields: ['category_id']
    },
    {
      fields: ['merchant_name']
    }
  ]
});

module.exports = Transaction;
```

### 13.6 Database Configuration

```javascript
// config/database.js
const { Sequelize } = require('sequelize');
const logger = require('../services/logger/Logger');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: (msg) => logger.debug(msg),
  pool: {
    max: 20,
    min: 5,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: true,
    underscored: true
  },
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  }
});

// Test connection
sequelize.authenticate()
  .then(() => {
    logger.info('Database connection established successfully');
  })
  .catch(err => {
    logger.error('Unable to connect to database:', err);
  });

module.exports = sequelize;
```

---

## 14. FRONTEND INTEGRATION EXAMPLES

### 14.1 API Client (Axios)

```javascript
// frontend/src/services/api/apiClient.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.freedumb.app/v1';

class ApiClient {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response.data,
      async (error) => {
        const originalRequest = error.config;

        // Handle 401 errors (token expired)
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem('refresh_token');
            const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
              refresh_token: refreshToken
            });

            const { access_token, refresh_token: newRefreshToken } = response.data.data;

            localStorage.setItem('access_token', access_token);
            localStorage.setItem('refresh_token', newRefreshToken);

            originalRequest.headers.Authorization = `Bearer ${access_token}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed, logout user
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Generic request methods
  async get(url, config = {}) {
    return this.client.get(url, config);
  }

  async post(url, data = {}, config = {}) {
    return this.client.post(url, data, config);
  }

  async put(url, data = {}, config = {}) {
    return this.client.put(url, data, config);
  }

  async patch(url, data = {}, config = {}) {
    return this.client.patch(url, data, config);
  }

  async delete(url, config = {}) {
    return this.client.delete(url, config);
  }
}

export default new ApiClient();
```

### 14.2 Transaction Service (Frontend)

```javascript
// frontend/src/services/transactionService.js
import apiClient from './api/apiClient';

class TransactionService {
  // Get transactions with filters
  async getTransactions(filters = {}) {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    });

    const queryString = params.toString();
    const url = `/transactions${queryString ? `?${queryString}` : ''}`;

    return apiClient.get(url);
  }

  // Create transaction
  async createTransaction(transactionData) {
    return apiClient.post('/transactions', transactionData);
  }

  // Update transaction
  async updateTransaction(id, transactionData) {
    return apiClient.put(`/transactions/${id}`, transactionData);
  }

  // Delete transaction
  async deleteTransaction(id) {
    return apiClient.delete(`/transactions/${id}`);
  }

  // Get statistics
  async getStatistics(startDate, endDate) {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    return apiClient.get(`/transactions/stats?${params.toString()}`);
  }

  // Get by category
  async getByCategory(filters = {}) {
    const params = new URLSearchParams(filters);
    return apiClient.get(`/transactions/by-category?${params.toString()}`);
  }

  // Parse transaction from text (AI)
  async parseTransactionFromText(text) {
    return apiClient.post('/ai/parse-transaction', { text });
  }

  // Batch import
  async batchImport(transactions) {
    return apiClient.post('/transactions/batch', { transactions });
  }
}

export default new TransactionService();
```

### 14.3 React Hook Example

```javascript
// frontend/src/hooks/useTransactions.js
import { useState, useEffect, useCallback } from 'react';
import transactionService from '../services/transactionService';

export const useTransactions = (initialFilters = {}) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });

  const fetchTransactions = useCallback(async (filters = initialFilters) => {
    setLoading(true);
    setError(null);

    try {
      const response = await transactionService.getTransactions(filters);
      setTransactions(response.data);
      setMeta(response.meta);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  }, []);

  const createTransaction = async (transactionData) => {
    try {
      const response = await transactionService.createTransaction(transactionData);
      setTransactions(prev => [response.data, ...prev]);
      return { success: true, data: response.data };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.error?.message || 'Failed to create transaction'
      };
    }
  };

  const updateTransaction = async (id, transactionData) => {
    try {
      const response = await transactionService.updateTransaction(id, transactionData);
      setTransactions(prev =>
        prev.map(tx => tx.id === id ? response.data : tx)
      );
      return { success: true, data: response.data };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.error?.message || 'Failed to update transaction'
      };
    }
  };

  const deleteTransaction = async (id) => {
    try {
      await transactionService.deleteTransaction(id);
      setTransactions(prev => prev.filter(tx => tx.id !== id));
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.error?.message || 'Failed to delete transaction'
      };
    }
  };

  useEffect(() => {
    fetchTransactions(initialFilters);
  }, [fetchTransactions]);

  return {
    transactions,
    loading,
    error,
    meta,
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction
  };
};
```

---

## 15. TESTING EXAMPLES

### 15.1 Unit Tests (Jest)

```javascript
// tests/services/TransactionService.test.js
const TransactionService = require('../../services/TransactionService');
const { Transaction, Account } = require('../../models');

jest.mock('../../models');
jest.mock('../../services/cache/RedisCache');

describe('TransactionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a transaction successfully', async () => {
      const userId = 'user-123';
      const accountId = 'account-456';
      const transactionData = {
        account_id: accountId,
        category_id: 1,
        transaction_type: 'expense',
        amount: 100.50,
        transaction_date: '2024-10-20',
        description: 'Test transaction'
      };

      const mockAccount = {
        id: accountId,
        user_id: userId,
        current_balance: 1000,
        update: jest.fn()
      };

      const mockTransaction = {
        id: 'tx-789',
        ...transactionData,
        toJSON: () => ({ id: 'tx-789', ...transactionData })
      };

      Account.findOne.mockResolvedValue(mockAccount);
      Transaction.create.mockResolvedValue(mockTransaction);

      const result = await TransactionService.create(userId, transactionData);

      expect(Account.findOne).toHaveBeenCalledWith({
        where: { id: accountId, user_id: userId }
      });
      expect(Transaction.create).toHaveBeenCalledWith({
        user_id: userId,
        ...transactionData
      });
      expect(result).toEqual(mockTransaction);
    });

    it('should throw error if account not found', async () => {
      const userId = 'user-123';
      const transactionData = {
        account_id: 'invalid-account',
        amount: 100
      };

      Account.findOne.mockResolvedValue(null);

      await expect(
        TransactionService.create(userId, transactionData)
      ).rejects.toThrow('Account not found or access denied');
    });
  });

  describe('getTransactions', () => {
    it('should return paginated transactions', async () => {
      const userId = 'user-123';
      const filters = { page: 1, limit: 10 };

      const mockTransactions = [
        { id: '1', amount: 100 },
        { id: '2', amount: 200 }
      ];

      Transaction.findAndCountAll.mockResolvedValue({
        rows: mockTransactions,
        count: 2
      });

      const result = await TransactionService.getTransactions(userId, filters);

      expect(result).toHaveProperty('transactions');
      expect(result).toHaveProperty('meta');
      expect(result.transactions).toEqual(mockTransactions);
      expect(result.meta.total).toBe(2);
    });
  });
});
```

### 15.2 Integration Tests

```javascript
// tests/integration/transactions.test.js
const request = require('supertest');
const app = require('../../index');
const { sequelize } = require('../../config/database');
const JWTService = require('../../services/auth/JWTService');

describe('Transaction API Integration Tests', () => {
  let authToken;
  let userId;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    // Create test user and get token
    userId = 'test-user-123';
    authToken = JWTService.generateAccessToken({ id: userId, email: 'test@example.com' });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST /v1/transactions', () => {
    it('should create a new transaction', async () => {
      const transactionData = {
        account_id: 'account-123',
        category_id: 1,
        transaction_type: 'expense',
        amount: 50.00,
        transaction_date: '2024-10-20',
        description: 'Integration test transaction'
      };

      const response = await request(app)
        .post('/v1/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(transactionData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.amount).toBe('50.00');
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .post('/v1/transactions')
        .send({})
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 with invalid data', async () => {
      const response = await request(app)
        .post('/v1/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amount: -100 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /v1/transactions', () => {
    it('should return list of transactions', async () => {
      const response = await request(app)
        .get('/v1/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.meta).toHaveProperty('page');
      expect(response.body.meta).toHaveProperty('total');
    });

    it('should filter by date range', async () => {
      const response = await request(app)
        .get('/v1/transactions?start_date=2024-01-01&end_date=2024-12-31')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});
```

---

*Archivo continúa con CI/CD pipeline...*
