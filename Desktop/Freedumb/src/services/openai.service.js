/**
 * OpenAI Service for FREEDUMB
 * Handles all AI-powered features including transaction categorization,
 * natural language processing, and financial insights
 */

const { OpenAI } = require('openai');
const logger = require('../utils/logger');

class OpenAIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    this.model = process.env.OPENAI_MODEL || 'gpt-4-turbo-preview';
    this.maxTokens = parseInt(process.env.OPENAI_MAX_TOKENS, 10) || 2000;
    this.temperature = parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7;
  }

  /**
   * Process natural language transaction input
   * @param {string} input - User's natural language input
   * @returns {Object} Parsed transaction data
   */
  async processTransactionNLP(input) {
    try {
      const systemPrompt = `You are a financial assistant AI for FREEDUMB app.
        Parse the following natural language input into structured transaction data.
        Extract: amount, type (income/expense), category, payment method, merchant/business name,
        date, and whether it's personal or business related.

        Return as JSON with these fields:
        - amount: number
        - type: "income" or "expense"
        - category: string (e.g., "food", "transport", "salary", "investment")
        - paymentMethod: string (e.g., "cash", "credit_card", "bank_transfer")
        - cardName: string (if credit card mentioned)
        - businessType: "personal" or "business"
        - businessName: string (if applicable)
        - merchant: string (where money was spent/received)
        - date: ISO date string
        - description: original input
        - confidence: 0-1 score of parsing confidence
        - isTaxDeductible: boolean`;

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: input }
        ],
        temperature: 0.3, // Lower temperature for more consistent parsing
        max_tokens: 500,
        response_format: { type: 'json_object' }
      });

      const parsed = JSON.parse(response.choices[0].message.content);

      logger.info('Transaction parsed successfully', { input, parsed });
      return parsed;
    } catch (error) {
      logger.error('Error parsing transaction with OpenAI', error);
      throw new Error('Failed to parse transaction');
    }
  }

  /**
   * Generate financial insights based on user's transaction history
   * @param {Array} transactions - User's transactions
   * @param {Object} userData - User profile data
   * @returns {Object} AI-generated insights
   */
  async generateFinancialInsights(transactions, userData) {
    try {
      const transactionSummary = this.summarizeTransactions(transactions);

      const prompt = `Based on the following financial data, provide personalized insights and recommendations:

        User Profile:
        - Monthly income: $${userData.monthlyIncome || 0}
        - Savings goal: $${userData.savingsGoal || 0}
        - Risk tolerance: ${userData.riskTolerance || 'moderate'}

        Transaction Summary:
        ${JSON.stringify(transactionSummary, null, 2)}

        Provide:
        1. Spending pattern analysis
        2. Savings opportunities (specific amounts and categories)
        3. Budget recommendations
        4. Investment suggestions based on surplus
        5. Warning about any concerning patterns
        6. Tax optimization tips

        Format as structured JSON with sections for each insight type.`;

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert financial advisor AI. Provide actionable, '
              + 'specific financial advice based on data.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: this.temperature,
        max_tokens: this.maxTokens,
        response_format: { type: 'json_object' }
      });

      const insights = JSON.parse(response.choices[0].message.content);

      return {
        insights,
        generatedAt: new Date().toISOString(),
        transactionCount: transactions.length
      };
    } catch (error) {
      logger.error('Error generating financial insights', error);
      throw new Error('Failed to generate insights');
    }
  }

  /**
   * Categorize a transaction automatically
   * @param {Object} transaction - Transaction to categorize
   * @returns {Object} Category and confidence
   */
  async categorizeTransaction(transaction) {
    try {
      const prompt = `Categorize this transaction:
        Amount: $${transaction.amount}
        Description: ${transaction.description}
        Merchant: ${transaction.merchant || 'Unknown'}
        Date: ${transaction.date}

        Choose from these categories:
        - Food & Dining
        - Transport
        - Shopping
        - Entertainment
        - Bills & Utilities
        - Healthcare
        - Education
        - Investment
        - Income
        - Rent/Mortgage
        - Insurance
        - Travel
        - Personal Care
        - Gifts & Donations
        - Business Expense
        - Other

        Also determine if this is tax deductible.
        Return as JSON: { category, subCategory, isTaxDeductible, confidence }`;

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: 'You are a transaction categorization expert.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 200,
        response_format: { type: 'json_object' }
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      logger.error('Error categorizing transaction', error);
      return {
        category: 'Other',
        subCategory: null,
        isTaxDeductible: false,
        confidence: 0
      };
    }
  }

  /**
   * Chat with financial AI assistant
   * @param {string} message - User's message
   * @param {Array} context - Previous messages for context
   * @param {Object} financialData - User's financial data for context
   * @returns {string} AI response
   */
  async chatWithAssistant(message, context = [], financialData = {}) {
    try {
      const systemPrompt = `You are Eliza, FREEDUMB's friendly and knowledgeable financial AI assistant.
        You help users manage their finances, answer questions, and provide personalized advice.
        Be conversational, helpful, and encouraging. Use emojis occasionally to be friendly.

        Current user financial status:
        - Balance: $${financialData.balance || 0}
        - Monthly income: $${financialData.monthlyIncome || 0}
        - Monthly expenses: $${financialData.monthlyExpenses || 0}
        - Savings rate: ${financialData.savingsRate || 0}%
        - Active goals: ${financialData.activeGoals || 0}

        Provide specific, actionable advice when appropriate.`;

      const messages = [
        { role: 'system', content: systemPrompt },
        ...context.slice(-10), // Keep last 10 messages for context
        { role: 'user', content: message }
      ];

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages,
        temperature: this.temperature,
        max_tokens: 500
      });

      return response.choices[0].message.content;
    } catch (error) {
      logger.error('Error in chat with assistant', error);
      throw new Error('Failed to process chat message');
    }
  }

  /**
   * Generate budget recommendations
   * @param {Array} transactions - Historical transactions
   * @param {Object} currentBudget - Current budget if any
   * @returns {Object} Recommended budget
   */
  async generateBudgetRecommendations(transactions, currentBudget = {}) {
    try {
      const spending = this.analyzeSpending(transactions);

      const prompt = `Based on this spending analysis, recommend an optimized budget:

        Current spending by category:
        ${JSON.stringify(spending, null, 2)}

        Current budget (if any):
        ${JSON.stringify(currentBudget, null, 2)}

        Generate a recommended budget that:
        1. Is realistic based on historical spending
        2. Includes savings of at least 20% if possible
        3. Identifies areas to reduce spending
        4. Sets specific limits per category
        5. Includes emergency fund allocation

        Return as JSON with categories and recommended amounts.`;

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a budget planning expert. Create realistic, achievable budgets.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.5,
        max_tokens: 800,
        response_format: { type: 'json_object' }
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      logger.error('Error generating budget recommendations', error);
      throw new Error('Failed to generate budget');
    }
  }

  /**
   * Predict future cash flow
   * @param {Array} transactions - Historical transactions
   * @param {number} months - Number of months to predict
   * @returns {Array} Monthly predictions
   */
  async predictCashFlow(transactions, months = 3) {
    try {
      const historicalData = this.prepareHistoricalData(transactions);

      const prompt = `Based on this transaction history, predict cash flow for the next ${months} months:

        Historical data:
        ${JSON.stringify(historicalData, null, 2)}

        Consider:
        1. Seasonal patterns
        2. Recurring transactions
        3. Trends in spending/income
        4. One-time vs recurring items

        Return predictions as JSON array with:
        - month: YYYY-MM
        - predictedIncome: number
        - predictedExpenses: number
        - confidence: 0-1
        - factors: array of influencing factors`;

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a financial forecasting expert. Make data-driven predictions.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.4,
        max_tokens: 600,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(response.choices[0].message.content);
      return result.predictions || [];
    } catch (error) {
      logger.error('Error predicting cash flow', error);
      throw new Error('Failed to predict cash flow');
    }
  }

  /**
   * Generate tax optimization suggestions
   * @param {Array} transactions - Transactions for the tax year
   * @param {Object} userProfile - User tax profile
   * @returns {Object} Tax optimization suggestions
   */
  async generateTaxSuggestions(transactions, userProfile) {
    try {
      const deductibleTransactions = transactions.filter(t => t.isTaxDeductible);
      const summary = this.summarizeTransactions(deductibleTransactions);

      const prompt = `Provide tax optimization suggestions based on:

        User Profile:
        - Filing status: ${userProfile.filingStatus || 'single'}
        - Income bracket: ${userProfile.incomeBracket || 'unknown'}
        - Self-employed: ${userProfile.selfEmployed || false}

        Deductible transactions summary:
        ${JSON.stringify(summary, null, 2)}

        Provide:
        1. Estimated tax savings
        2. Missing deduction opportunities
        3. Documentation requirements
        4. Year-end tax moves
        5. Quarterly payment recommendations (if self-employed)

        Return as structured JSON.`;

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a tax optimization expert. Provide legal tax-saving strategies.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 800,
        response_format: { type: 'json_object' }
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      logger.error('Error generating tax suggestions', error);
      throw new Error('Failed to generate tax suggestions');
    }
  }

  // Helper methods
  summarizeTransactions(transactions) {
    const summary = {
      total: transactions.length,
      totalIncome: 0,
      totalExpenses: 0,
      categories: {},
      dateRange: {
        start: null,
        end: null
      }
    };

    transactions.forEach(t => {
      if (t.type === 'income') {
        summary.totalIncome += t.amount;
      } else {
        summary.totalExpenses += t.amount;
        summary.categories[t.category] = (summary.categories[t.category] || 0) + t.amount;
      }

      const date = new Date(t.date);
      if (!summary.dateRange.start || date < new Date(summary.dateRange.start)) {
        summary.dateRange.start = t.date;
      }
      if (!summary.dateRange.end || date > new Date(summary.dateRange.end)) {
        summary.dateRange.end = t.date;
      }
    });

    return summary;
  }

  analyzeSpending(transactions) {
    const spending = {};
    const expenses = transactions.filter(t => t.type === 'expense');

    expenses.forEach(t => {
      if (!spending[t.category]) {
        spending[t.category] = {
          total: 0,
          count: 0,
          average: 0,
          transactions: []
        };
      }

      spending[t.category].total += t.amount;
      spending[t.category].count += 1;
      spending[t.category].transactions.push(t);
    });

    // Calculate averages
    Object.keys(spending).forEach(category => {
      spending[category].average = spending[category].total / spending[category].count;
    });

    return spending;
  }

  prepareHistoricalData(transactions) {
    const monthlyData = {};

    transactions.forEach(t => {
      const month = t.date.substring(0, 7); // YYYY-MM
      if (!monthlyData[month]) {
        monthlyData[month] = {
          income: 0,
          expenses: 0,
          transactions: 0
        };
      }

      if (t.type === 'income') {
        monthlyData[month].income += t.amount;
      } else {
        monthlyData[month].expenses += t.amount;
      }
      monthlyData[month].transactions += 1;
    });

    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({ month, ...data }));
  }
}

module.exports = new OpenAIService();
