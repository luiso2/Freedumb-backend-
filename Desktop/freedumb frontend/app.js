// FREEDUMB Frontend - Dynamic Widget Application
// Connects to ChatGPT via Backend API

// Configuration
const CONFIG = {
    API_BASE_URL: 'https://your-railway-app.up.railway.app/api', // ← Cambiar por tu URL de Railway
    // API_BASE_URL: 'http://localhost:3000/api', // Para desarrollo local
    ANIMATION_DURATION: 1000,
    REFRESH_INTERVAL: 30000, // 30 segundos
};

// Global State
let userData = null;
let charts = {};
let refreshTimer = null;

// Utility Functions
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
};

const formatDate = (dateString) => {
    return new Intl.DateTimeFormat('es-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }).format(new Date(dateString));
};

const getCategoryIcon = (category) => {
    const icons = {
        'food': '🍔',
        'Food & Dining': '🍔',
        'transport': '🚗',
        'Transport': '🚗',
        'shopping': '🛍️',
        'Shopping': '🛍️',
        'entertainment': '🎬',
        'Entertainment': '🎬',
        'bills': '📄',
        'Bills & Utilities': '📄',
        'healthcare': '🏥',
        'Healthcare': '🏥',
        'salary': '💼',
        'Income': '💼',
        'investment': '📈',
        'Investment': '📈',
        'other': '💰',
        'Other': '💰'
    };
    return icons[category] || '💰';
};

// API Functions
const apiCall = async (endpoint, options = {}) => {
    try {
        const url = `${CONFIG.API_BASE_URL}${endpoint}`;
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token') || localStorage.getItem('auth_token');

        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : '',
                ...options.headers,
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

// Data Fetching Functions
const fetchUserData = async () => {
    try {
        const params = new URLSearchParams(window.location.search);
        const userId = params.get('user') || params.get('userId');
        const period = params.get('period') || 'month';
        const category = params.get('category');

        // Fetch user profile
        const user = await apiCall('/users/profile');

        // Fetch transactions
        const transactions = await apiCall(`/transactions?period=${period}${category ? `&category=${category}` : ''}`);

        // Fetch budgets
        const budgets = await apiCall('/budgets');

        // Fetch AI insights
        const insights = await apiCall(`/ai/insights?period=${period}`);

        return {
            user,
            transactions: transactions.transactions || [],
            budgets: budgets.budgets || [],
            insights: insights.insights || {},
            stats: calculateStats(transactions.transactions || []),
        };
    } catch (error) {
        console.error('Error fetching data:', error);
        showError('Error al cargar los datos. Verifica tu conexión.');
        throw error;
    }
};

const calculateStats = (transactions) => {
    const stats = {
        totalIncome: 0,
        totalExpenses: 0,
        balance: 0,
        categoryBreakdown: {},
        monthlyTrend: {},
        recentTransactions: [],
    };

    transactions.forEach(t => {
        if (t.type === 'income') {
            stats.totalIncome += parseFloat(t.amount);
        } else {
            stats.totalExpenses += parseFloat(t.amount);

            // Category breakdown
            if (!stats.categoryBreakdown[t.category]) {
                stats.categoryBreakdown[t.category] = 0;
            }
            stats.categoryBreakdown[t.category] += parseFloat(t.amount);
        }

        // Monthly trend
        const month = t.date.substring(0, 7);
        if (!stats.monthlyTrend[month]) {
            stats.monthlyTrend[month] = { income: 0, expenses: 0 };
        }
        if (t.type === 'income') {
            stats.monthlyTrend[month].income += parseFloat(t.amount);
        } else {
            stats.monthlyTrend[month].expenses += parseFloat(t.amount);
        }
    });

    stats.balance = stats.totalIncome - stats.totalExpenses;
    stats.recentTransactions = transactions
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 10);

    return stats;
};

// UI Rendering Functions
const renderSummaryCards = (stats) => {
    // Total Income
    document.getElementById('totalIncome').textContent = formatCurrency(stats.totalIncome);
    document.getElementById('incomeTrend').textContent = '+12%'; // TODO: Calculate real trend

    // Total Expenses
    document.getElementById('totalExpenses').textContent = formatCurrency(stats.totalExpenses);
    document.getElementById('expenseTrend').textContent = '-8%'; // TODO: Calculate real trend

    // Balance
    const balanceEl = document.getElementById('balance');
    balanceEl.textContent = formatCurrency(stats.balance);
    balanceEl.style.color = stats.balance >= 0 ? 'var(--success-color)' : 'var(--danger-color)';

    // Savings Goal (placeholder)
    document.getElementById('savingsGoal').textContent = formatCurrency(5000);
    const savingsProgress = (stats.balance / 5000) * 100;
    document.getElementById('savingsProgress').style.width = `${Math.min(savingsProgress, 100)}%`;

    // Animate numbers
    animateNumber('totalIncome', stats.totalIncome);
    animateNumber('totalExpenses', stats.totalExpenses);
    animateNumber('balance', stats.balance);
};

const renderCategoryChart = (categoryData) => {
    const ctx = document.getElementById('categoryChart');

    if (charts.category) {
        charts.category.destroy();
    }

    const labels = Object.keys(categoryData);
    const data = Object.values(categoryData);
    const colors = [
        '#667eea', '#764ba2', '#f093fb', '#4facfe',
        '#43e97b', '#fa709a', '#feca57', '#ff6b6b'
    ];

    charts.category = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 0,
                hoverOffset: 10,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#ffffff',
                        padding: 15,
                        font: { size: 12 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const label = context.label || '';
                            const value = formatCurrency(context.parsed);
                            return `${label}: ${value}`;
                        }
                    }
                }
            },
            animation: {
                animateRotate: true,
                animateScale: true,
                duration: CONFIG.ANIMATION_DURATION,
            }
        }
    });
};

const renderTrendChart = (monthlyData) => {
    const ctx = document.getElementById('trendChart');

    if (charts.trend) {
        charts.trend.destroy();
    }

    const months = Object.keys(monthlyData).sort();
    const incomeData = months.map(m => monthlyData[m].income);
    const expenseData = months.map(m => monthlyData[m].expenses);

    charts.trend = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months.map(m => {
                const [year, month] = m.split('-');
                return new Date(year, month - 1).toLocaleDateString('es-US', { month: 'short' });
            }),
            datasets: [
                {
                    label: 'Ingresos',
                    data: incomeData,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true,
                    tension: 0.4,
                },
                {
                    label: 'Gastos',
                    data: expenseData,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    fill: true,
                    tension: 0.4,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    labels: { color: '#ffffff' }
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#a0aec0',
                        callback: (value) => formatCurrency(value)
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    }
                },
                x: {
                    ticks: { color: '#a0aec0' },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    }
                }
            },
            animation: {
                duration: CONFIG.ANIMATION_DURATION,
            }
        }
    });
};

const renderTransactions = (transactions) => {
    const container = document.getElementById('transactionsList');
    container.innerHTML = '';

    if (transactions.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">No hay transacciones recientes</p>';
        return;
    }

    transactions.forEach((t, index) => {
        const item = document.createElement('div');
        item.className = 'transaction-item';
        item.style.animationDelay = `${index * 0.1}s`;
        item.style.transform = 'translateX(-30px)';

        const icon = getCategoryIcon(t.category);
        const amountClass = t.type === 'income' ? 'income' : 'expense';
        const amountPrefix = t.type === 'income' ? '+' : '-';

        item.innerHTML = `
            <div class="transaction-info">
                <div class="transaction-icon">${icon}</div>
                <div class="transaction-details">
                    <h4>${t.description || t.merchant || t.category}</h4>
                    <p>${formatDate(t.date)} • ${t.category}</p>
                </div>
            </div>
            <div class="transaction-amount ${amountClass}">
                ${amountPrefix}${formatCurrency(Math.abs(t.amount))}
            </div>
        `;

        container.appendChild(item);
    });
};

const renderInsights = (insights) => {
    const container = document.getElementById('insightsContainer');
    container.innerHTML = '';

    if (!insights || Object.keys(insights).length === 0) {
        container.innerHTML = `
            <div class="insight-card">
                <div class="insight-icon">🤖</div>
                <p class="insight-text">No hay insights disponibles en este momento.</p>
            </div>
        `;
        return;
    }

    const insightsList = [
        { icon: '💡', text: insights.spendingPatterns?.analysis || 'Analizando patrones de gasto...' },
        { icon: '💰', text: insights.savingsOpportunities?.[0] || 'Buscando oportunidades de ahorro...' },
        { icon: '⚠️', text: insights.warnings?.[0] || 'Todo se ve bien' },
        { icon: '📊', text: insights.recommendations?.[0] || 'Generando recomendaciones...' },
    ];

    insightsList.forEach((insight, index) => {
        const card = document.createElement('div');
        card.className = 'insight-card';
        card.style.animationDelay = `${index * 0.15}s`;
        card.style.transform = 'translateY(20px)';

        card.innerHTML = `
            <div class="insight-icon">${insight.icon}</div>
            <p class="insight-text">${insight.text}</p>
        `;

        container.appendChild(card);
    });
};

const renderBudgets = (budgets) => {
    const container = document.getElementById('budgetsList');
    container.innerHTML = '';

    if (budgets.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">No hay presupuestos configurados</p>';
        return;
    }

    budgets.forEach((budget, index) => {
        const spent = budget.spent || 0;
        const limit = budget.amount_limit || budget.limit || 1;
        const percentage = (spent / limit) * 100;
        const isOverBudget = percentage > 100;
        const isWarning = percentage > 80;

        const item = document.createElement('div');
        item.className = 'budget-item';
        item.style.animationDelay = `${index * 0.1}s`;
        item.style.transform = 'scale(0.9)';

        item.innerHTML = `
            <div class="budget-header">
                <span class="budget-category">${getCategoryIcon(budget.category)} ${budget.budget_name || budget.category}</span>
                <span class="budget-status" style="color: ${isOverBudget ? 'var(--danger-color)' : isWarning ? 'var(--warning-color)' : 'var(--success-color)'}">
                    ${formatCurrency(spent)} / ${formatCurrency(limit)}
                </span>
            </div>
            <div class="budget-progress">
                <div class="budget-progress-fill ${isWarning ? 'danger' : ''}" style="width: ${Math.min(percentage, 100)}%"></div>
            </div>
            <p style="margin-top: 8px; font-size: 12px; color: var(--text-secondary);">
                ${percentage.toFixed(0)}% utilizado
            </p>
        `;

        container.appendChild(item);
    });
};

// Animation Functions
const animateNumber = (elementId, targetValue) => {
    const element = document.getElementById(elementId);
    if (!element) return;

    anime({
        targets: { value: 0 },
        value: targetValue,
        duration: CONFIG.ANIMATION_DURATION,
        easing: 'easeOutExpo',
        update: function(anim) {
            element.textContent = formatCurrency(anim.animatables[0].target.value);
        }
    });
};

// Main Initialization
const initializeApp = async () => {
    try {
        // Show loading screen
        document.getElementById('loading-screen').classList.remove('hidden');
        document.getElementById('main-container').classList.add('hidden');

        // Fetch data
        userData = await fetchUserData();

        // Update UI
        document.getElementById('userName').textContent = userData.user?.name || 'Usuario';
        renderSummaryCards(userData.stats);
        renderCategoryChart(userData.stats.categoryBreakdown);
        renderTrendChart(userData.stats.monthlyTrend);
        renderTransactions(userData.stats.recentTransactions);
        renderInsights(userData.insights);
        renderBudgets(userData.budgets);

        // Update timestamp
        document.getElementById('timestamp').textContent = new Date().toLocaleString('es-US');

        // Hide loading, show content
        setTimeout(() => {
            document.getElementById('loading-screen').classList.add('hidden');
            document.getElementById('main-container').classList.remove('hidden');
        }, 1000);

        // Start auto-refresh
        startAutoRefresh();

    } catch (error) {
        console.error('Initialization error:', error);
        showError('Error al inicializar la aplicación. Por favor recarga la página.');
    }
};

// Refresh Functions
const refreshData = async () => {
    try {
        userData = await fetchUserData();

        renderSummaryCards(userData.stats);
        renderCategoryChart(userData.stats.categoryBreakdown);
        renderTrendChart(userData.stats.monthlyTrend);
        renderTransactions(userData.stats.recentTransactions);
        renderInsights(userData.insights);
        renderBudgets(userData.budgets);

        document.getElementById('timestamp').textContent = new Date().toLocaleString('es-US');

        // Show success feedback
        showNotification('Datos actualizados correctamente');
    } catch (error) {
        console.error('Refresh error:', error);
        showError('Error al actualizar los datos');
    }
};

const startAutoRefresh = () => {
    if (refreshTimer) {
        clearInterval(refreshTimer);
    }
    refreshTimer = setInterval(refreshData, CONFIG.REFRESH_INTERVAL);
};

// Error Handling
const showError = (message) => {
    document.getElementById('error-message').textContent = message;
    document.getElementById('error-modal').classList.remove('hidden');
};

const closeErrorModal = () => {
    document.getElementById('error-modal').classList.add('hidden');
};

const showNotification = (message) => {
    // Simple notification (you can enhance this)
    console.log('Notification:', message);
};

// URL Parameter Handling for ChatGPT
const handleURLParameters = () => {
    const params = new URLSearchParams(window.location.search);

    // Example: ?user=123&period=month&category=food&token=xyz
    console.log('URL Parameters:', {
        user: params.get('user'),
        period: params.get('period'),
        category: params.get('category'),
        token: params.get('token')
    });
};

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    handleURLParameters();
    initializeApp();
});

// Handle page visibility (pause refresh when tab is hidden)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        if (refreshTimer) clearInterval(refreshTimer);
    } else {
        startAutoRefresh();
    }
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        formatCurrency,
        formatDate,
        getCategoryIcon,
        calculateStats,
    };
}
