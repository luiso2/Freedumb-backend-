# FREEDUMB - Guía de Implementación
## Configuración, Despliegue y Escalabilidad

---

## 7. IMPLEMENTACIÓN DE MICROSERVICIOS

### 7.1 Transaction Service - Servicio Principal

```javascript
// services/transaction/TransactionService.js
const { Transaction, Account, Category } = require('../models');
const { Op } = require('sequelize');
const RedisCache = require('../cache/RedisCache');
const EventBus = require('../events/EventBus');

class TransactionService {
  // Create transaction
  async create(userId, transactionData) {
    try {
      // Validate account ownership
      const account = await Account.findOne({
        where: { id: transactionData.account_id, user_id: userId }
      });

      if (!account) {
        throw new Error('Account not found or access denied');
      }

      // Create transaction
      const transaction = await Transaction.create({
        user_id: userId,
        ...transactionData
      });

      // Update account balance
      await this.updateAccountBalance(account, transaction);

      // Emit event for real-time updates
      EventBus.emit('transaction.created', {
        userId,
        transaction: transaction.toJSON()
      });

      // Invalidate relevant caches
      await this.invalidateCache(userId, account.id);

      // Check budget alerts
      await this.checkBudgetAlerts(userId, transaction);

      return transaction;
    } catch (error) {
      console.error('Create transaction error:', error);
      throw error;
    }
  }

  // Update account balance
  async updateAccountBalance(account, transaction) {
    let balanceChange = 0;

    switch (transaction.transaction_type) {
      case 'income':
        balanceChange = transaction.amount;
        break;
      case 'expense':
        balanceChange = -transaction.amount;
        break;
      case 'transfer':
        // Handle transfer logic separately
        break;
    }

    await account.update({
      current_balance: parseFloat(account.current_balance) + balanceChange
    });
  }

  // Get transactions with filters
  async getTransactions(userId, filters = {}) {
    const {
      page = 1,
      limit = 50,
      start_date,
      end_date,
      account_id,
      category_id,
      transaction_type,
      min_amount,
      max_amount,
      sort = 'transaction_date',
      order = 'desc'
    } = filters;

    // Build cache key
    const cacheKey = `transactions:${userId}:${JSON.stringify(filters)}`;

    // Try cache first
    const cached = await RedisCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Build where clause
    const where = { user_id: userId };

    if (start_date || end_date) {
      where.transaction_date = {};
      if (start_date) where.transaction_date[Op.gte] = start_date;
      if (end_date) where.transaction_date[Op.lte] = end_date;
    }

    if (account_id) where.account_id = account_id;
    if (category_id) where.category_id = category_id;
    if (transaction_type) where.transaction_type = transaction_type;

    if (min_amount || max_amount) {
      where.amount = {};
      if (min_amount) where.amount[Op.gte] = min_amount;
      if (max_amount) where.amount[Op.lte] = max_amount;
    }

    // Execute query
    const offset = (page - 1) * limit;
    const result = await Transaction.findAndCountAll({
      where,
      include: [
        {
          model: Account,
          attributes: ['id', 'account_name', 'account_type_id']
        },
        {
          model: Category,
          attributes: ['id', 'name', 'icon', 'color']
        }
      ],
      limit: Math.min(limit, 100),
      offset,
      order: [[sort, order.toUpperCase()]]
    });

    const response = {
      transactions: result.rows,
      meta: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.count,
        totalPages: Math.ceil(result.count / limit)
      }
    };

    // Cache for 5 minutes
    await RedisCache.set(cacheKey, response, 300);

    return response;
  }

  // Get statistics
  async getStatistics(userId, filters = {}) {
    const { start_date, end_date } = filters;
    const cacheKey = `stats:${userId}:${start_date}:${end_date}`;

    return await RedisCache.getOrSet(cacheKey, async () => {
      const where = { user_id: userId };

      if (start_date || end_date) {
        where.transaction_date = {};
        if (start_date) where.transaction_date[Op.gte] = start_date;
        if (end_date) where.transaction_date[Op.lte] = end_date;
      }

      // Total income
      const totalIncome = await Transaction.sum('amount', {
        where: { ...where, transaction_type: 'income' }
      }) || 0;

      // Total expenses
      const totalExpenses = await Transaction.sum('amount', {
        where: { ...where, transaction_type: 'expense' }
      }) || 0;

      // Net (income - expenses)
      const net = totalIncome - totalExpenses;

      // Transaction count
      const transactionCount = await Transaction.count({ where });

      // By category
      const byCategory = await Transaction.findAll({
        where: { ...where, transaction_type: 'expense' },
        attributes: [
          'category_id',
          [sequelize.fn('SUM', sequelize.col('amount')), 'total'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        include: [{
          model: Category,
          attributes: ['name', 'icon', 'color']
        }],
        group: ['category_id', 'Category.id'],
        order: [[sequelize.literal('total'), 'DESC']],
        limit: 10
      });

      return {
        totalIncome,
        totalExpenses,
        net,
        transactionCount,
        averageTransaction: transactionCount > 0 ? totalExpenses / transactionCount : 0,
        savingsRate: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100).toFixed(2) : 0,
        topCategories: byCategory
      };
    }, 600); // Cache for 10 minutes
  }

  // Check budget alerts
  async checkBudgetAlerts(userId, transaction) {
    if (transaction.transaction_type !== 'expense') return;

    const budgets = await Budget.findAll({
      where: {
        user_id: userId,
        is_active: true,
        category_id: transaction.category_id,
        start_date: { [Op.lte]: transaction.transaction_date },
        end_date: { [Op.gte]: transaction.transaction_date }
      }
    });

    for (const budget of budgets) {
      const percentage = (budget.current_spent / budget.amount_limit) * 100;

      if (percentage >= budget.alert_threshold && budget.alert_enabled) {
        // Create notification
        await Notification.create({
          user_id: userId,
          notification_type: 'budget_alert',
          title: 'Budget Alert',
          message: `You've used ${percentage.toFixed(0)}% of your ${budget.budget_name} budget`,
          data: {
            budget_id: budget.id,
            percentage: percentage.toFixed(2),
            spent: budget.current_spent,
            limit: budget.amount_limit
          }
        });

        // Emit WebSocket event
        EventBus.emit('budget.alert', {
          userId,
          budget,
          percentage
        });
      }
    }
  }

  // Invalidate cache
  async invalidateCache(userId, accountId) {
    await RedisCache.invalidatePattern(`transactions:${userId}:*`);
    await RedisCache.invalidatePattern(`stats:${userId}:*`);
    await RedisCache.invalidatePattern(`dashboard:${userId}:*`);
    await RedisCache.del(`account:balance:${accountId}`);
  }

  // Batch import transactions (CSV/API)
  async batchImport(userId, transactions) {
    const results = {
      success: [],
      failed: []
    };

    for (const txData of transactions) {
      try {
        const tx = await this.create(userId, txData);
        results.success.push(tx);
      } catch (error) {
        results.failed.push({
          data: txData,
          error: error.message
        });
      }
    }

    return results;
  }
}

module.exports = new TransactionService();
```

### 7.2 Budget Service Implementation

```javascript
// services/budget/BudgetService.js
const { Budget, Transaction, Category } = require('../models');
const { Op } = require('sequelize');
const RedisCache = require('../cache/RedisCache');

class BudgetService {
  async create(userId, budgetData) {
    const budget = await Budget.create({
      user_id: userId,
      ...budgetData,
      current_spent: 0
    });

    // Calculate current spent for existing period
    await this.updateBudgetSpent(budget);

    return budget;
  }

  async updateBudgetSpent(budget) {
    const spent = await Transaction.sum('amount', {
      where: {
        user_id: budget.user_id,
        category_id: budget.category_id,
        transaction_type: 'expense',
        transaction_date: {
          [Op.gte]: budget.start_date,
          [Op.lte]: budget.end_date
        }
      }
    }) || 0;

    await budget.update({ current_spent: spent });
    return spent;
  }

  async getBudgetStatus(userId, budgetId) {
    const budget = await Budget.findOne({
      where: { id: budgetId, user_id: userId },
      include: [{ model: Category }]
    });

    if (!budget) {
      throw new Error('Budget not found');
    }

    const percentage = (budget.current_spent / budget.amount_limit) * 100;
    const remaining = budget.amount_limit - budget.current_spent;
    const daysTotal = Math.ceil((budget.end_date - budget.start_date) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.ceil((budget.end_date - new Date()) / (1000 * 60 * 60 * 24));
    const dailyAverage = budget.current_spent / (daysTotal - daysRemaining || 1);
    const projectedTotal = dailyAverage * daysTotal;

    return {
      budget,
      status: {
        percentage: percentage.toFixed(2),
        remaining,
        isOverBudget: budget.current_spent > budget.amount_limit,
        daysRemaining,
        dailyAverage: dailyAverage.toFixed(2),
        projectedTotal: projectedTotal.toFixed(2),
        projectedOverage: Math.max(0, projectedTotal - budget.amount_limit),
        healthStatus: percentage < 70 ? 'healthy' : percentage < 90 ? 'warning' : 'critical'
      }
    };
  }

  async getSummary(userId) {
    const cacheKey = `budget:summary:${userId}`;

    return await RedisCache.getOrSet(cacheKey, async () => {
      const budgets = await Budget.findAll({
        where: { user_id: userId, is_active: true },
        include: [{ model: Category }]
      });

      const summary = {
        totalBudgets: budgets.length,
        totalAllocated: 0,
        totalSpent: 0,
        budgetsOnTrack: 0,
        budgetsAtRisk: 0,
        budgetsOverBudget: 0,
        details: []
      };

      for (const budget of budgets) {
        await this.updateBudgetSpent(budget);

        const percentage = (budget.current_spent / budget.amount_limit) * 100;
        summary.totalAllocated += parseFloat(budget.amount_limit);
        summary.totalSpent += parseFloat(budget.current_spent);

        if (percentage < 80) summary.budgetsOnTrack++;
        else if (percentage < 100) summary.budgetsAtRisk++;
        else summary.budgetsOverBudget++;

        summary.details.push({
          id: budget.id,
          name: budget.budget_name,
          category: budget.Category.name,
          limit: budget.amount_limit,
          spent: budget.current_spent,
          percentage: percentage.toFixed(2),
          status: percentage < 80 ? 'on_track' : percentage < 100 ? 'at_risk' : 'over_budget'
        });
      }

      return summary;
    }, 300);
  }
}

module.exports = new BudgetService();
```

### 7.3 Investment Service Implementation

```javascript
// services/investment/InvestmentService.js
const axios = require('axios');
const { InvestmentPortfolio, InvestmentHolding, InvestmentTransaction } = require('../models');

class InvestmentService {
  constructor() {
    // Use Alpha Vantage, Yahoo Finance, or other market data API
    this.marketDataAPI = process.env.MARKET_DATA_API_URL;
    this.apiKey = process.env.MARKET_DATA_API_KEY;
  }

  async createPortfolio(userId, portfolioData) {
    return await InvestmentPortfolio.create({
      user_id: userId,
      ...portfolioData
    });
  }

  async addHolding(portfolioId, holdingData) {
    const holding = await InvestmentHolding.create({
      portfolio_id: portfolioId,
      ...holdingData
    });

    await this.updateHoldingPrice(holding);
    await this.updatePortfolioValue(portfolioId);

    return holding;
  }

  async updateHoldingPrice(holding) {
    try {
      const currentPrice = await this.fetchCurrentPrice(holding.symbol);

      const currentValue = holding.quantity * currentPrice;
      const totalCost = holding.quantity * holding.average_cost;
      const totalGainLoss = currentValue - totalCost;
      const gainLossPercentage = (totalGainLoss / totalCost) * 100;

      await holding.update({
        current_price: currentPrice,
        current_value: currentValue,
        total_gain_loss: totalGainLoss,
        gain_loss_percentage: gainLossPercentage,
        last_price_update: new Date()
      });

      return holding;
    } catch (error) {
      console.error(`Error updating price for ${holding.symbol}:`, error);
      throw error;
    }
  }

  async fetchCurrentPrice(symbol) {
    try {
      // Example using Alpha Vantage
      const response = await axios.get(this.marketDataAPI, {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol: symbol,
          apikey: this.apiKey
        }
      });

      const quote = response.data['Global Quote'];
      return parseFloat(quote['05. price']);
    } catch (error) {
      console.error('Market data fetch error:', error);
      throw new Error('Unable to fetch market data');
    }
  }

  async syncAllPrices(portfolioId) {
    const holdings = await InvestmentHolding.findAll({
      where: { portfolio_id: portfolioId }
    });

    for (const holding of holdings) {
      await this.updateHoldingPrice(holding);
    }

    await this.updatePortfolioValue(portfolioId);

    return { updated: holdings.length };
  }

  async updatePortfolioValue(portfolioId) {
    const holdings = await InvestmentHolding.findAll({
      where: { portfolio_id: portfolioId }
    });

    const totalValue = holdings.reduce((sum, h) => sum + parseFloat(h.current_value || 0), 0);
    const totalCost = holdings.reduce((sum, h) => sum + (h.quantity * h.average_cost), 0);
    const totalReturn = totalValue - totalCost;
    const totalReturnPercentage = (totalReturn / totalCost) * 100;

    await InvestmentPortfolio.update({
      total_value: totalValue,
      total_cost_basis: totalCost,
      total_return: totalReturn,
      total_return_percentage: totalReturnPercentage
    }, {
      where: { id: portfolioId }
    });
  }

  async getPortfolioPerformance(portfolioId, period = '1M') {
    // Calculate performance metrics
    const portfolio = await InvestmentPortfolio.findByPk(portfolioId, {
      include: [{ model: InvestmentHolding }]
    });

    if (!portfolio) {
      throw new Error('Portfolio not found');
    }

    // Calculate allocation
    const allocation = portfolio.InvestmentHoldings.map(holding => ({
      symbol: holding.symbol,
      assetType: holding.asset_type,
      value: parseFloat(holding.current_value),
      percentage: (parseFloat(holding.current_value) / parseFloat(portfolio.total_value)) * 100
    }));

    // Group by asset type
    const allocationByType = allocation.reduce((acc, item) => {
      if (!acc[item.assetType]) {
        acc[item.assetType] = { value: 0, percentage: 0 };
      }
      acc[item.assetType].value += item.value;
      acc[item.assetType].percentage += item.percentage;
      return acc;
    }, {});

    return {
      portfolio: {
        id: portfolio.id,
        name: portfolio.portfolio_name,
        totalValue: portfolio.total_value,
        totalReturn: portfolio.total_return,
        totalReturnPercentage: portfolio.total_return_percentage
      },
      allocation,
      allocationByType,
      topGainers: portfolio.InvestmentHoldings
        .sort((a, b) => b.gain_loss_percentage - a.gain_loss_percentage)
        .slice(0, 5),
      topLosers: portfolio.InvestmentHoldings
        .sort((a, b) => a.gain_loss_percentage - b.gain_loss_percentage)
        .slice(0, 5)
    };
  }

  async recordTransaction(holdingId, transactionData) {
    const transaction = await InvestmentTransaction.create({
      holding_id: holdingId,
      ...transactionData
    });

    // Update holding based on transaction type
    const holding = await InvestmentHolding.findByPk(holdingId);

    if (transactionData.transaction_type === 'buy') {
      const newQuantity = parseFloat(holding.quantity) + transactionData.quantity;
      const totalCost = (holding.quantity * holding.average_cost) +
                       (transactionData.quantity * transactionData.price_per_unit);
      const newAverageCost = totalCost / newQuantity;

      await holding.update({
        quantity: newQuantity,
        average_cost: newAverageCost
      });
    } else if (transactionData.transaction_type === 'sell') {
      await holding.update({
        quantity: parseFloat(holding.quantity) - transactionData.quantity
      });
    }

    await this.updateHoldingPrice(holding);
    await this.updatePortfolioValue(holding.portfolio_id);

    return transaction;
  }
}

module.exports = new InvestmentService();
```

---

## 8. WEBSOCKET REAL-TIME UPDATES

### 8.1 WebSocket Server Setup

```javascript
// services/websocket/WebSocketServer.js
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const EventBus = require('../events/EventBus');

class WebSocketServer {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.clients = new Map(); // userId -> WebSocket connection

    this.setupServer();
    this.setupEventListeners();
  }

  setupServer() {
    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });
  }

  handleConnection(ws, req) {
    // Authenticate connection via query param token
    const urlParams = new URLSearchParams(req.url.split('?')[1]);
    const token = urlParams.get('token');

    if (!token) {
      ws.close(1008, 'Token required');
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      const userId = decoded.userId;

      // Store connection
      this.clients.set(userId, ws);

      console.log(`WebSocket connected: User ${userId}`);

      // Send welcome message
      this.sendToUser(userId, {
        type: 'connection',
        message: 'Connected to FREEDUMB real-time updates'
      });

      // Handle messages from client
      ws.on('message', (data) => {
        this.handleMessage(userId, data);
      });

      // Handle disconnection
      ws.on('close', () => {
        this.clients.delete(userId);
        console.log(`WebSocket disconnected: User ${userId}`);
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error(`WebSocket error for user ${userId}:`, error);
      });

      // Ping/Pong for keep-alive
      ws.isAlive = true;
      ws.on('pong', () => {
        ws.isAlive = true;
      });

    } catch (error) {
      console.error('WebSocket auth error:', error);
      ws.close(1008, 'Invalid token');
    }
  }

  handleMessage(userId, data) {
    try {
      const message = JSON.parse(data);

      switch (message.type) {
        case 'ping':
          this.sendToUser(userId, { type: 'pong' });
          break;

        case 'subscribe':
          // Handle subscription to specific events
          console.log(`User ${userId} subscribed to ${message.channel}`);
          break;

        default:
          console.log(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error('Message handling error:', error);
    }
  }

  sendToUser(userId, data) {
    const client = this.clients.get(userId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  }

  broadcast(data) {
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  }

  setupEventListeners() {
    // Transaction events
    EventBus.on('transaction.created', (data) => {
      this.sendToUser(data.userId, {
        type: 'transaction.created',
        data: data.transaction
      });
    });

    EventBus.on('transaction.updated', (data) => {
      this.sendToUser(data.userId, {
        type: 'transaction.updated',
        data: data.transaction
      });
    });

    // Budget alerts
    EventBus.on('budget.alert', (data) => {
      this.sendToUser(data.userId, {
        type: 'budget.alert',
        data: {
          budget: data.budget,
          percentage: data.percentage
        }
      });
    });

    // Account balance updates
    EventBus.on('account.balance.updated', (data) => {
      this.sendToUser(data.userId, {
        type: 'account.balance.updated',
        data: data.account
      });
    });

    // Investment price updates
    EventBus.on('investment.price.updated', (data) => {
      this.sendToUser(data.userId, {
        type: 'investment.price.updated',
        data: data.holding
      });
    });

    // Notifications
    EventBus.on('notification.created', (data) => {
      this.sendToUser(data.userId, {
        type: 'notification',
        data: data.notification
      });
    });
  }

  // Keep-alive ping interval
  startKeepAlive() {
    setInterval(() => {
      this.clients.forEach((ws, userId) => {
        if (ws.isAlive === false) {
          this.clients.delete(userId);
          return ws.terminate();
        }

        ws.isAlive = false;
        ws.ping();
      });
    }, 30000); // Every 30 seconds
  }
}

module.exports = WebSocketServer;
```

### 8.2 Event Bus Implementation

```javascript
// services/events/EventBus.js
const EventEmitter = require('events');

class EventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50); // Increase for multiple subscribers
  }

  // Custom emit with error handling
  emitSafe(event, data) {
    try {
      this.emit(event, data);
    } catch (error) {
      console.error(`Error emitting event ${event}:`, error);
    }
  }

  // Subscribe with automatic cleanup
  subscribe(event, handler) {
    this.on(event, handler);

    // Return unsubscribe function
    return () => this.off(event, handler);
  }
}

module.exports = new EventBus();
```

---

## 9. SCHEDULED JOBS & BACKGROUND TASKS

### 9.1 Job Queue with Bull

```javascript
// services/jobs/JobQueue.js
const Queue = require('bull');
const Redis = require('ioredis');

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD
};

// Create queues
const transactionQueue = new Queue('transaction-processing', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  }
});

const recurringQueue = new Queue('recurring-transactions', {
  redis: redisConfig
});

const notificationQueue = new Queue('notifications', {
  redis: redisConfig
});

const investmentQueue = new Queue('investment-updates', {
  redis: redisConfig
});

const reportQueue = new Queue('report-generation', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 2,
    timeout: 300000 // 5 minutes
  }
});

module.exports = {
  transactionQueue,
  recurringQueue,
  notificationQueue,
  investmentQueue,
  reportQueue
};
```

### 9.2 Job Processors

```javascript
// workers/RecurringTransactionWorker.js
const { recurringQueue } = require('../services/jobs/JobQueue');
const RecurringRule = require('../models/RecurringRule');
const TransactionService = require('../services/TransactionService');
const { Op } = require('sequelize');

// Process recurring transactions daily
recurringQueue.process(async (job) => {
  console.log('Processing recurring transactions...');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find rules due today
  const dueRules = await RecurringRule.findAll({
    where: {
      is_active: true,
      next_occurrence: {
        [Op.lte]: today
      }
    }
  });

  const results = [];

  for (const rule of dueRules) {
    try {
      if (rule.auto_create) {
        // Auto-create transaction
        await TransactionService.create(rule.user_id, {
          account_id: rule.account_id,
          category_id: rule.category_id,
          transaction_type: rule.transaction_type,
          amount: rule.amount,
          transaction_date: rule.next_occurrence,
          description: rule.description,
          merchant_name: rule.merchant_name,
          is_recurring: true,
          recurring_rule_id: rule.id
        });

        results.push({ ruleId: rule.id, status: 'created' });
      } else {
        // Create reminder
        await PaymentReminder.create({
          user_id: rule.user_id,
          recurring_rule_id: rule.id,
          reminder_name: rule.rule_name,
          due_date: rule.next_occurrence,
          amount: rule.amount,
          reminder_days_before: rule.reminder_days_before
        });

        results.push({ ruleId: rule.id, status: 'reminder_created' });
      }

      // Calculate next occurrence
      const nextDate = this.calculateNextOccurrence(rule);
      await rule.update({ next_occurrence: nextDate });

    } catch (error) {
      console.error(`Error processing rule ${rule.id}:`, error);
      results.push({ ruleId: rule.id, status: 'failed', error: error.message });
    }
  }

  return results;
});

// Calculate next occurrence based on frequency
function calculateNextOccurrence(rule) {
  const current = new Date(rule.next_occurrence);
  let next;

  switch (rule.frequency) {
    case 'daily':
      next = new Date(current.setDate(current.getDate() + 1));
      break;
    case 'weekly':
      next = new Date(current.setDate(current.getDate() + 7));
      break;
    case 'biweekly':
      next = new Date(current.setDate(current.getDate() + 14));
      break;
    case 'monthly':
      next = new Date(current.setMonth(current.getMonth() + 1));
      break;
    case 'quarterly':
      next = new Date(current.setMonth(current.getMonth() + 3));
      break;
    case 'yearly':
      next = new Date(current.setFullYear(current.getFullYear() + 1));
      break;
    default:
      next = current;
  }

  // Check if end_date has been reached
  if (rule.end_date && next > rule.end_date) {
    return null; // Rule should be deactivated
  }

  return next;
}

// Schedule job to run daily at 00:30
recurringQueue.add(
  {},
  {
    repeat: {
      cron: '30 0 * * *', // Daily at 00:30
      tz: 'America/New_York'
    }
  }
);

console.log('Recurring transaction worker started');
```

```javascript
// workers/InvestmentPriceWorker.js
const { investmentQueue } = require('../services/jobs/JobQueue');
const InvestmentService = require('../services/InvestmentService');
const { InvestmentPortfolio } = require('../models');

// Update investment prices every 15 minutes during market hours
investmentQueue.process('update-prices', async (job) => {
  console.log('Updating investment prices...');

  const portfolios = await InvestmentPortfolio.findAll({
    where: { is_active: true }
  });

  const results = [];

  for (const portfolio of portfolios) {
    try {
      const result = await InvestmentService.syncAllPrices(portfolio.id);
      results.push({ portfolioId: portfolio.id, ...result });
    } catch (error) {
      console.error(`Error updating portfolio ${portfolio.id}:`, error);
      results.push({ portfolioId: portfolio.id, error: error.message });
    }
  }

  return results;
});

// Schedule during market hours (9:30 AM - 4:00 PM EST, weekdays)
investmentQueue.add(
  'update-prices',
  {},
  {
    repeat: {
      cron: '*/15 9-16 * * 1-5', // Every 15 min, 9 AM - 4 PM, Mon-Fri
      tz: 'America/New_York'
    }
  }
);

console.log('Investment price worker started');
```

```javascript
// workers/NotificationWorker.js
const { notificationQueue } = require('../services/jobs/JobQueue');
const { PaymentReminder } = require('../models');
const EmailService = require('../services/EmailService');
const PushNotificationService = require('../services/PushNotificationService');
const { Op } = require('sequelize');

// Send payment reminders
notificationQueue.process('payment-reminders', async (job) => {
  console.log('Processing payment reminders...');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const reminders = await PaymentReminder.findAll({
    where: {
      status: 'pending',
      due_date: {
        [Op.gte]: today,
        [Op.lte]: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
      }
    },
    include: ['User', 'RecurringRule']
  });

  for (const reminder of reminders) {
    const daysUntilDue = Math.ceil((reminder.due_date - today) / (1000 * 60 * 60 * 24));

    if (reminder.reminder_days_before.includes(daysUntilDue)) {
      // Send email
      await EmailService.sendPaymentReminder(reminder.User.email, {
        name: reminder.reminder_name,
        amount: reminder.amount,
        dueDate: reminder.due_date,
        daysUntilDue
      });

      // Send push notification
      await PushNotificationService.send(reminder.user_id, {
        title: 'Payment Reminder',
        body: `${reminder.reminder_name} is due in ${daysUntilDue} day(s) - $${reminder.amount}`,
        data: { reminder_id: reminder.id }
      });

      // Create in-app notification
      await Notification.create({
        user_id: reminder.user_id,
        notification_type: 'payment_reminder',
        title: 'Payment Due Soon',
        message: `${reminder.reminder_name} is due on ${reminder.due_date.toLocaleDateString()}`,
        data: { reminder_id: reminder.id, amount: reminder.amount }
      });
    }
  }

  return { processed: reminders.length };
});

// Schedule to run daily at 9:00 AM
notificationQueue.add(
  'payment-reminders',
  {},
  {
    repeat: {
      cron: '0 9 * * *',
      tz: 'America/New_York'
    }
  }
);

console.log('Notification worker started');
```

---

*Continuará con deployment, monitoring y conclusión...*
