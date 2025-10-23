# FREEDUMB - Arquitectura Backend Completa
## Sistema de Gestión Financiera Personal con IA

---

## 1. ARQUITECTURA DE MICROSERVICIOS

### 1.1 Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                          API GATEWAY                             │
│                    (Kong / Nginx + Node.js)                      │
│              Rate Limiting, Auth, Load Balancing                 │
└───────────────────────────┬─────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐  ┌──────▼──────┐  ┌────────▼────────┐
│  Auth Service  │  │ Transaction │  │  Budget Service │
│   (Port 3001)  │  │   Service   │  │   (Port 3003)   │
│   JWT + OAuth  │  │ (Port 3002) │  │  Goals & Limits │
└───────┬────────┘  └──────┬──────┘  └────────┬────────┘
        │                  │                   │
        │         ┌────────┼────────┐          │
        │         │        │        │          │
┌───────▼─────┐  ┌▼────────▼───┐  ┌▼──────────▼─────┐
│ AI Service  │  │ Investment   │  │ Analytics       │
│(Port 3004)  │  │   Service    │  │   Service       │
│GPT-4 + NLP  │  │ (Port 3005)  │  │ (Port 3006)     │
└─────────────┘  └──────────────┘  └─────────────────┘
        │                  │                   │
┌───────▼──────────────────▼───────────────────▼──────┐
│              SHARED DATA LAYER                       │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │ PostgreSQL   │  │    Redis     │  │  MongoDB  │ │
│  │ (Financial)  │  │   (Cache)    │  │ (Logs/AI) │ │
│  └──────────────┘  └──────────────┘  └───────────┘ │
└──────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐  ┌──────▼──────┐  ┌────────▼────────┐
│ Message Queue  │  │ WebSocket   │  │ Scheduled Jobs  │
│  (RabbitMQ)    │  │   Server    │  │   (Bull/Cron)   │
│Event-Driven    │  │ Real-time   │  │  Reminders      │
└────────────────┘  └─────────────┘  └─────────────────┘
```

### 1.2 Componentes Principales

#### **API Gateway** (Kong o Nginx + Express)
- Enrutamiento inteligente de solicitudes
- Rate limiting: 100 req/min por usuario
- Autenticación centralizada
- Compresión GZIP
- CORS y seguridad headers

#### **Microservicios Core**
1. **Auth Service**: Autenticación, autorización, gestión de usuarios
2. **Transaction Service**: CRUD transacciones, categorización
3. **Budget Service**: Presupuestos, metas, límites de gasto
4. **AI Service**: Procesamiento NLP, ChatGPT, categorización automática
5. **Investment Service**: Portfolio tracking, análisis de inversiones
6. **Analytics Service**: Reportes, predicciones, análisis financiero

---

## 2. ESQUEMA DE BASE DE DATOS

### 2.1 PostgreSQL - Base de Datos Principal

```sql
-- ============================================
-- USERS & AUTHENTICATION
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'en',
    profile_image_url TEXT,
    is_email_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP
);

CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    currency_code VARCHAR(3) DEFAULT 'USD',
    country_code VARCHAR(2),
    tax_bracket DECIMAL(5,2), -- e.g., 22.00 for 22%
    business_owner BOOLEAN DEFAULT FALSE,
    fiscal_year_start DATE,
    notification_preferences JSONB,
    ai_preferences JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP
);

-- ============================================
-- ACCOUNTS & CATEGORIES
-- ============================================
CREATE TABLE account_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL, -- checking, savings, credit_card, investment, cash, loan
    description TEXT
);

CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    account_type_id INTEGER REFERENCES account_types(id),
    account_name VARCHAR(100) NOT NULL,
    account_number_last4 VARCHAR(4),
    institution_name VARCHAR(100),
    currency_code VARCHAR(3) DEFAULT 'USD',
    current_balance DECIMAL(15,2) DEFAULT 0.00,
    available_balance DECIMAL(15,2),
    credit_limit DECIMAL(15,2),
    interest_rate DECIMAL(5,2),
    is_business_account BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    external_account_id VARCHAR(255), -- For Plaid/bank API integration
    last_sync_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE transaction_categories (
    id SERIAL PRIMARY KEY,
    parent_id INTEGER REFERENCES transaction_categories(id),
    name VARCHAR(100) NOT NULL,
    category_type VARCHAR(20) NOT NULL, -- income, expense
    icon VARCHAR(50),
    color VARCHAR(7), -- HEX color
    is_tax_deductible BOOLEAN DEFAULT FALSE,
    is_system_category BOOLEAN DEFAULT TRUE,
    user_id UUID REFERENCES users(id), -- NULL for system categories
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TRANSACTIONS
-- ============================================
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    category_id INTEGER REFERENCES transaction_categories(id),
    transaction_type VARCHAR(20) NOT NULL, -- income, expense, transfer
    amount DECIMAL(15,2) NOT NULL,
    currency_code VARCHAR(3) DEFAULT 'USD',
    transaction_date DATE NOT NULL,
    description TEXT,
    merchant_name VARCHAR(255),
    location JSONB, -- {city, state, country, lat, lng}
    notes TEXT,
    receipt_url TEXT,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurring_rule_id UUID REFERENCES recurring_rules(id),
    is_business_expense BOOLEAN DEFAULT FALSE,
    tax_deduction_amount DECIMAL(15,2),
    tags TEXT[], -- Array of tags
    ai_categorized BOOLEAN DEFAULT FALSE,
    ai_confidence_score DECIMAL(3,2), -- 0.00 to 1.00
    external_transaction_id VARCHAR(255),
    status VARCHAR(20) DEFAULT 'completed', -- pending, completed, failed, cancelled
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE recurring_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES accounts(id),
    category_id INTEGER REFERENCES transaction_categories(id),
    rule_name VARCHAR(100) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    transaction_type VARCHAR(20) NOT NULL,
    frequency VARCHAR(20) NOT NULL, -- daily, weekly, biweekly, monthly, quarterly, yearly
    start_date DATE NOT NULL,
    end_date DATE,
    next_occurrence DATE NOT NULL,
    merchant_name VARCHAR(255),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    reminder_days_before INTEGER DEFAULT 3,
    auto_create BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- BUDGETS & GOALS
-- ============================================
CREATE TABLE budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    budget_name VARCHAR(100) NOT NULL,
    category_id INTEGER REFERENCES transaction_categories(id),
    budget_type VARCHAR(20) DEFAULT 'monthly', -- weekly, monthly, quarterly, yearly, custom
    amount_limit DECIMAL(15,2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    current_spent DECIMAL(15,2) DEFAULT 0.00,
    rollover_unused BOOLEAN DEFAULT FALSE,
    alert_threshold DECIMAL(5,2) DEFAULT 80.00, -- Alert at 80%
    alert_enabled BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE savings_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    goal_name VARCHAR(100) NOT NULL,
    target_amount DECIMAL(15,2) NOT NULL,
    current_amount DECIMAL(15,2) DEFAULT 0.00,
    target_date DATE,
    monthly_contribution DECIMAL(15,2),
    account_id UUID REFERENCES accounts(id),
    priority INTEGER DEFAULT 1, -- 1 highest, 5 lowest
    status VARCHAR(20) DEFAULT 'active', -- active, completed, cancelled
    image_url TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INVESTMENTS
-- ============================================
CREATE TABLE investment_portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    portfolio_name VARCHAR(100) NOT NULL,
    description TEXT,
    total_value DECIMAL(15,2) DEFAULT 0.00,
    total_cost_basis DECIMAL(15,2) DEFAULT 0.00,
    total_return DECIMAL(15,2) DEFAULT 0.00,
    total_return_percentage DECIMAL(8,4) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE investment_holdings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID REFERENCES investment_portfolios(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL, -- Stock ticker
    asset_type VARCHAR(50), -- stock, etf, crypto, bond, mutual_fund
    quantity DECIMAL(18,8) NOT NULL,
    average_cost DECIMAL(15,2) NOT NULL,
    current_price DECIMAL(15,2),
    current_value DECIMAL(15,2),
    total_gain_loss DECIMAL(15,2),
    gain_loss_percentage DECIMAL(8,4),
    last_price_update TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE investment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    holding_id UUID REFERENCES investment_holdings(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL, -- buy, sell, dividend, split
    quantity DECIMAL(18,8) NOT NULL,
    price_per_unit DECIMAL(15,2) NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    fees DECIMAL(15,2) DEFAULT 0.00,
    transaction_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- AI & ANALYTICS
-- ============================================
CREATE TABLE ai_categorization_training (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    merchant_pattern VARCHAR(255),
    description_pattern TEXT,
    category_id INTEGER REFERENCES transaction_categories(id),
    confidence_score DECIMAL(3,2),
    times_used INTEGER DEFAULT 1,
    last_used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(100),
    message_role VARCHAR(20) NOT NULL, -- user, assistant, system
    message_content TEXT NOT NULL,
    tokens_used INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE financial_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    insight_type VARCHAR(50), -- spending_alert, savings_opportunity, budget_warning
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'info', -- info, warning, critical
    action_items JSONB,
    related_category_id INTEGER REFERENCES transaction_categories(id),
    is_read BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- NOTIFICATIONS & REMINDERS
-- ============================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payment_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    recurring_rule_id UUID REFERENCES recurring_rules(id),
    reminder_name VARCHAR(100) NOT NULL,
    due_date DATE NOT NULL,
    amount DECIMAL(15,2),
    reminder_days_before INTEGER[] DEFAULT ARRAY[3, 1], -- Remind 3 days and 1 day before
    status VARCHAR(20) DEFAULT 'pending', -- pending, sent, completed, cancelled
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TAX & REPORTING
-- ============================================
CREATE TABLE tax_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tax_year INTEGER NOT NULL,
    document_type VARCHAR(50), -- 1099, W2, receipt, invoice
    file_url TEXT NOT NULL,
    file_name VARCHAR(255),
    file_size INTEGER,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE expense_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    report_name VARCHAR(100) NOT NULL,
    report_type VARCHAR(50), -- monthly_summary, tax_deductions, business_expenses
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_amount DECIMAL(15,2),
    transaction_count INTEGER,
    file_url TEXT,
    generated_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_transactions_user_date ON transactions(user_id, transaction_date DESC);
CREATE INDEX idx_transactions_account ON transactions(account_id);
CREATE INDEX idx_transactions_category ON transactions(category_id);
CREATE INDEX idx_transactions_merchant ON transactions(merchant_name);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_budgets_user_active ON budgets(user_id, is_active);
CREATE INDEX idx_accounts_user ON accounts(user_id);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read);
CREATE INDEX idx_ai_conversations_user_session ON ai_conversations(user_id, session_id);

-- ============================================
-- TRIGGERS FOR AUTO-UPDATING
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON budgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 2.2 Justificación: PostgreSQL vs MongoDB

**PostgreSQL elegido como DB principal porque:**
- Transacciones ACID críticas para datos financieros
- Relaciones complejas entre usuarios, cuentas, transacciones
- Consultas analíticas complejas con JOINs
- Soporte nativo para JSONB para flexibilidad
- Integridad referencial garantizada

**MongoDB como DB secundaria para:**
- Logs de AI/ChatGPT (alta escritura, baja consistencia)
- Sesiones de usuario temporales
- Cache de análisis pre-computados
- Almacenamiento de eventos no estructurados

---

## 3. DEFINICIÓN DE API RESTful

### 3.1 Estructura de Endpoints

#### **Base URL**: `https://api.freedumb.app/v1`

#### **Convenciones:**
- GET: Lectura de recursos
- POST: Creación de recursos
- PUT: Actualización completa
- PATCH: Actualización parcial
- DELETE: Eliminación

#### **Respuesta estándar:**
```json
{
  "success": true,
  "data": {},
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  },
  "error": null
}
```

### 3.2 Endpoints por Servicio

#### **Authentication Service (Port 3001)**

```
POST   /auth/register              - Registro de usuario
POST   /auth/login                 - Login con email/password
POST   /auth/refresh               - Renovar access token
POST   /auth/logout                - Logout (revoke tokens)
POST   /auth/forgot-password       - Solicitar reset de password
POST   /auth/reset-password        - Resetear password con token
GET    /auth/verify-email/:token   - Verificar email
POST   /auth/resend-verification   - Reenviar email de verificación
```

#### **User Service (Port 3001)**

```
GET    /users/me                   - Obtener perfil actual
PATCH  /users/me                   - Actualizar perfil
PATCH  /users/me/password          - Cambiar password
GET    /users/me/preferences       - Obtener preferencias
PATCH  /users/me/preferences       - Actualizar preferencias
DELETE /users/me                   - Eliminar cuenta
```

#### **Accounts Service (Port 3002)**

```
GET    /accounts                   - Listar todas las cuentas
POST   /accounts                   - Crear nueva cuenta
GET    /accounts/:id               - Obtener cuenta específica
PUT    /accounts/:id               - Actualizar cuenta
DELETE /accounts/:id               - Eliminar cuenta
GET    /accounts/:id/balance       - Obtener balance actual
POST   /accounts/:id/sync          - Sincronizar con banco (Plaid)
GET    /accounts/summary           - Resumen de todas las cuentas
```

#### **Transactions Service (Port 3002)**

```
GET    /transactions               - Listar transacciones
  Query params:
    ?start_date=2024-01-01
    &end_date=2024-12-31
    &account_id=uuid
    &category_id=1
    &type=expense
    &min_amount=100
    &max_amount=1000
    &page=1
    &limit=50
    &sort=transaction_date
    &order=desc

POST   /transactions               - Crear transacción
POST   /transactions/batch         - Crear múltiples transacciones
GET    /transactions/:id           - Obtener transacción específica
PUT    /transactions/:id           - Actualizar transacción
PATCH  /transactions/:id/category  - Cambiar categoría
DELETE /transactions/:id           - Eliminar transacción
POST   /transactions/:id/receipt   - Upload receipt
GET    /transactions/stats         - Estadísticas generales
GET    /transactions/by-category   - Agrupar por categoría
GET    /transactions/by-merchant   - Agrupar por comercio
POST   /transactions/search        - Búsqueda avanzada con filtros
```

#### **Categories Service (Port 3002)**

```
GET    /categories                 - Listar categorías
POST   /categories                 - Crear categoría personalizada
GET    /categories/:id             - Obtener categoría
PUT    /categories/:id             - Actualizar categoría
DELETE /categories/:id             - Eliminar categoría
GET    /categories/tree            - Obtener árbol de categorías
```

#### **Budgets Service (Port 3003)**

```
GET    /budgets                    - Listar presupuestos
POST   /budgets                    - Crear presupuesto
GET    /budgets/:id                - Obtener presupuesto
PUT    /budgets/:id                - Actualizar presupuesto
DELETE /budgets/:id                - Eliminar presupuesto
GET    /budgets/:id/status         - Estado actual del presupuesto
GET    /budgets/summary            - Resumen de todos los presupuestos
POST   /budgets/:id/alerts         - Configurar alertas
```

#### **Savings Goals Service (Port 3003)**

```
GET    /goals                      - Listar metas de ahorro
POST   /goals                      - Crear meta
GET    /goals/:id                  - Obtener meta
PUT    /goals/:id                  - Actualizar meta
DELETE /goals/:id                  - Eliminar meta
POST   /goals/:id/contribute       - Registrar contribución
GET    /goals/:id/progress         - Progreso de la meta
GET    /goals/recommendations      - Sugerencias de ahorro IA
```

#### **Investments Service (Port 3005)**

```
GET    /portfolios                 - Listar portfolios
POST   /portfolios                 - Crear portfolio
GET    /portfolios/:id             - Obtener portfolio
PUT    /portfolios/:id             - Actualizar portfolio
DELETE /portfolios/:id             - Eliminar portfolio
GET    /portfolios/:id/holdings    - Holdings del portfolio
POST   /portfolios/:id/holdings    - Agregar holding
PUT    /holdings/:id               - Actualizar holding
DELETE /holdings/:id               - Eliminar holding
POST   /holdings/:id/transactions  - Registrar compra/venta
GET    /portfolios/:id/performance - Rendimiento del portfolio
GET    /portfolios/:id/allocation  - Distribución de activos
POST   /portfolios/:id/sync-prices - Actualizar precios en tiempo real
```

#### **AI Assistant Service (Port 3004)**

```
POST   /ai/chat                    - Conversación con ChatGPT
POST   /ai/categorize              - Categorizar transacción con IA
POST   /ai/analyze-spending        - Análisis de gastos con IA
POST   /ai/financial-advice        - Consejos financieros personalizados
POST   /ai/predict-cashflow        - Predicción de flujo de efectivo
POST   /ai/parse-transaction       - Parsear texto a transacción (NLP)
  Body: {"text": "Gasté $50 en Starbucks ayer"}
  Response: {
    "amount": 50,
    "merchant": "Starbucks",
    "category_id": 12,
    "transaction_date": "2024-10-19",
    "confidence": 0.95
  }
GET    /ai/insights                - Insights financieros personalizados
POST   /ai/generate-report         - Generar reporte con análisis IA
```

#### **Analytics Service (Port 3006)**

```
GET    /analytics/dashboard        - Dashboard principal
GET    /analytics/spending-trends  - Tendencias de gasto
  Query: ?period=last_6_months&group_by=month
GET    /analytics/income-vs-expense - Comparativa ingresos vs gastos
GET    /analytics/category-breakdown - Desglose por categoría
GET    /analytics/monthly-comparison - Comparación mes a mes
GET    /analytics/net-worth         - Patrimonio neto histórico
GET    /analytics/cashflow          - Análisis de flujo de efectivo
GET    /analytics/tax-deductions    - Deducciones fiscales estimadas
POST   /analytics/custom-report     - Crear reporte personalizado
POST   /analytics/export            - Exportar datos (PDF/CSV/Excel)
  Body: {
    "format": "pdf",
    "report_type": "monthly_summary",
    "start_date": "2024-01-01",
    "end_date": "2024-12-31"
  }
```

#### **Recurring Transactions Service (Port 3002)**

```
GET    /recurring                  - Listar reglas recurrentes
POST   /recurring                  - Crear regla recurrente
GET    /recurring/:id              - Obtener regla
PUT    /recurring/:id              - Actualizar regla
DELETE /recurring/:id              - Eliminar regla
POST   /recurring/:id/pause        - Pausar regla
POST   /recurring/:id/resume       - Reanudar regla
GET    /recurring/upcoming         - Próximas transacciones recurrentes
```

#### **Notifications Service (Port 3007)**

```
GET    /notifications              - Listar notificaciones
GET    /notifications/:id          - Obtener notificación
PATCH  /notifications/:id/read     - Marcar como leída
PATCH  /notifications/read-all     - Marcar todas como leídas
DELETE /notifications/:id          - Eliminar notificación
GET    /notifications/unread-count - Contador de no leídas
POST   /notifications/preferences  - Configurar preferencias
```

#### **Reports & Tax Service (Port 3006)**

```
POST   /reports/generate           - Generar reporte
GET    /reports                    - Listar reportes generados
GET    /reports/:id                - Descargar reporte
DELETE /reports/:id                - Eliminar reporte
GET    /tax/summary/:year          - Resumen fiscal del año
GET    /tax/deductions/:year       - Deducciones fiscales
POST   /tax/documents              - Upload documento fiscal
GET    /tax/documents              - Listar documentos fiscales
```

---

## 4. ESTRATEGIA DE CACHÉ Y OPTIMIZACIÓN

### 4.1 Redis Cache Strategy

```javascript
// Cache layers y TTL
const CACHE_STRATEGY = {
  // Hot data - alta frecuencia de lectura
  USER_PROFILE: { ttl: 3600, key: 'user:profile:{userId}' },
  ACCOUNT_BALANCE: { ttl: 300, key: 'account:balance:{accountId}' },
  DASHBOARD_DATA: { ttl: 300, key: 'dashboard:{userId}:{date}' },

  // Warm data - consultas frecuentes pero menos críticas
  MONTHLY_STATS: { ttl: 1800, key: 'stats:monthly:{userId}:{month}' },
  CATEGORY_SUMMARY: { ttl: 1800, key: 'category:summary:{userId}:{period}' },

  // Cold data - datos pre-computados
  ANNUAL_REPORT: { ttl: 86400, key: 'report:annual:{userId}:{year}' },
  TAX_SUMMARY: { ttl: 86400, key: 'tax:summary:{userId}:{year}' },

  // Session data
  USER_SESSION: { ttl: 7200, key: 'session:{sessionId}' },
  AI_CONVERSATION: { ttl: 3600, key: 'ai:session:{sessionId}' },

  // Rate limiting
  RATE_LIMIT: { ttl: 60, key: 'ratelimit:{ip}:{endpoint}' }
};
```

### 4.2 Implementación de Cache

```javascript
// services/cache/RedisCache.js
const Redis = require('ioredis');

class RedisCache {
  constructor() {
    this.client = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times) => Math.min(times * 50, 2000),
      maxRetriesPerRequest: 3
    });
  }

  async get(key) {
    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Redis GET error:', error);
      return null;
    }
  }

  async set(key, value, ttl = 3600) {
    try {
      await this.client.setex(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Redis SET error:', error);
      return false;
    }
  }

  async del(key) {
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Redis DEL error:', error);
      return false;
    }
  }

  async invalidatePattern(pattern) {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
      return true;
    } catch (error) {
      console.error('Redis invalidate pattern error:', error);
      return false;
    }
  }

  // Cache-aside pattern
  async getOrSet(key, fetchFunction, ttl = 3600) {
    let data = await this.get(key);

    if (!data) {
      data = await fetchFunction();
      if (data) {
        await this.set(key, data, ttl);
      }
    }

    return data;
  }
}

module.exports = new RedisCache();
```

### 4.3 Database Query Optimization

```javascript
// services/database/QueryOptimizer.js
class QueryOptimizer {
  // Use connection pooling
  static getPoolConfig() {
    return {
      max: 20, // Maximum number of connections
      min: 5,  // Minimum number of connections
      acquire: 30000,
      idle: 10000,
      evict: 1000
    };
  }

  // Batch operations
  static async batchInsert(model, records, batchSize = 1000) {
    const chunks = [];
    for (let i = 0; i < records.length; i += batchSize) {
      chunks.push(records.slice(i, i + batchSize));
    }

    const results = [];
    for (const chunk of chunks) {
      const result = await model.bulkCreate(chunk, {
        ignoreDuplicates: true,
        returning: true
      });
      results.push(...result);
    }

    return results;
  }

  // Pagination helper
  static getPaginationParams(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    return {
      limit: Math.min(limit, 100), // Max 100 per page
      offset: offset
    };
  }

  // Common query patterns with eager loading
  static async getTransactionsOptimized(userId, filters = {}) {
    const { page = 1, limit = 50 } = filters;
    const { offset, limit: finalLimit } = this.getPaginationParams(page, limit);

    return await Transaction.findAndCountAll({
      where: {
        user_id: userId,
        ...this.buildDateFilter(filters),
        ...this.buildAmountFilter(filters)
      },
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
      attributes: {
        exclude: ['updated_at'] // Exclude rarely used fields
      },
      offset,
      limit: finalLimit,
      order: [['transaction_date', 'DESC'], ['created_at', 'DESC']]
    });
  }

  static buildDateFilter(filters) {
    const where = {};
    if (filters.start_date || filters.end_date) {
      where.transaction_date = {};
      if (filters.start_date) where.transaction_date[Op.gte] = filters.start_date;
      if (filters.end_date) where.transaction_date[Op.lte] = filters.end_date;
    }
    return where;
  }

  static buildAmountFilter(filters) {
    const where = {};
    if (filters.min_amount || filters.max_amount) {
      where.amount = {};
      if (filters.min_amount) where.amount[Op.gte] = filters.min_amount;
      if (filters.max_amount) where.amount[Op.lte] = filters.max_amount;
    }
    return where;
  }
}

module.exports = QueryOptimizer;
```

### 4.4 API Response Optimization

```javascript
// middleware/compressionMiddleware.js
const compression = require('compression');
const zlib = require('zlib');

module.exports = compression({
  level: 6, // Balance between compression ratio and speed
  threshold: 1024, // Only compress responses > 1KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  zlib: {
    // Custom zlib options
    level: zlib.constants.Z_BEST_SPEED
  }
});
```

---

## 5. SEGURIDAD Y AUTENTICACIÓN

### 5.1 JWT Authentication Strategy

```javascript
// services/auth/JWTService.js
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class JWTService {
  constructor() {
    this.accessTokenSecret = process.env.JWT_ACCESS_SECRET;
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET;
    this.accessTokenExpiry = '15m';
    this.refreshTokenExpiry = '7d';
  }

  generateAccessToken(user) {
    const payload = {
      userId: user.id,
      email: user.email,
      type: 'access'
    };

    return jwt.sign(payload, this.accessTokenSecret, {
      expiresIn: this.accessTokenExpiry,
      issuer: 'freedumb-api',
      audience: 'freedumb-client'
    });
  }

  generateRefreshToken(user) {
    const payload = {
      userId: user.id,
      type: 'refresh',
      tokenId: crypto.randomBytes(16).toString('hex')
    };

    return jwt.sign(payload, this.refreshTokenSecret, {
      expiresIn: this.refreshTokenExpiry,
      issuer: 'freedumb-api'
    });
  }

  verifyAccessToken(token) {
    try {
      return jwt.verify(token, this.accessTokenSecret, {
        issuer: 'freedumb-api',
        audience: 'freedumb-client'
      });
    } catch (error) {
      throw new Error('Invalid or expired access token');
    }
  }

  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, this.refreshTokenSecret, {
        issuer: 'freedumb-api'
      });
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  async storeRefreshToken(userId, token) {
    const tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await RefreshToken.create({
      user_id: userId,
      token_hash: tokenHash,
      expires_at: expiresAt
    });
  }

  async revokeRefreshToken(token) {
    const tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    await RefreshToken.update(
      { revoked_at: new Date() },
      { where: { token_hash: tokenHash } }
    );
  }
}

module.exports = new JWTService();
```

### 5.2 Authentication Middleware

```javascript
// middleware/authMiddleware.js
const JWTService = require('../services/auth/JWTService');
const RedisCache = require('../services/cache/RedisCache');

const authenticate = async (req, res, next) => {
  try {
    // Extract token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'No token provided'
        }
      });
    }

    const token = authHeader.substring(7);

    // Verify token
    const decoded = JWTService.verifyAccessToken(token);

    // Check if token is blacklisted (logout scenario)
    const isBlacklisted = await RedisCache.get(`blacklist:${token}`);
    if (isBlacklisted) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_REVOKED',
          message: 'Token has been revoked'
        }
      });
    }

    // Attach user info to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired token'
      }
    });
  }
};

module.exports = { authenticate };
```

### 5.3 Security Headers & CORS

```javascript
// middleware/securityMiddleware.js
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// Helmet for security headers
const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const whitelist = process.env.CORS_WHITELIST?.split(',') || [
      'http://localhost:3000',
      'https://freedumb.app',
      'https://app.freedumb.app'
    ];

    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

const corsMiddleware = cors(corsOptions);

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Stricter limit for auth endpoints
  skipSuccessfulRequests: true
});

module.exports = {
  helmetMiddleware,
  corsMiddleware,
  apiLimiter,
  authLimiter
};
```

### 5.4 Input Validation & Sanitization

```javascript
// middleware/validationMiddleware.js
const { body, param, query, validationResult } = require('express-validator');
const xss = require('xss-clean');

// XSS sanitization
const xssMiddleware = xss();

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: errors.array()
      }
    });
  }
  next();
};

// Common validation rules
const validationRules = {
  // Transaction validation
  createTransaction: [
    body('account_id').isUUID().withMessage('Invalid account ID'),
    body('category_id').isInt({ min: 1 }).withMessage('Invalid category ID'),
    body('transaction_type').isIn(['income', 'expense', 'transfer']),
    body('amount').isDecimal({ decimal_digits: '0,2' }).isFloat({ min: 0.01 }),
    body('transaction_date').isISO8601().toDate(),
    body('description').optional().trim().isLength({ max: 500 }),
    body('merchant_name').optional().trim().isLength({ max: 255 }),
    body('notes').optional().trim().isLength({ max: 1000 }),
    handleValidationErrors
  ],

  // Budget validation
  createBudget: [
    body('budget_name').trim().isLength({ min: 1, max: 100 }),
    body('category_id').optional().isInt({ min: 1 }),
    body('budget_type').isIn(['weekly', 'monthly', 'quarterly', 'yearly', 'custom']),
    body('amount_limit').isDecimal().isFloat({ min: 0.01 }),
    body('start_date').isISO8601().toDate(),
    body('end_date').isISO8601().toDate(),
    body('alert_threshold').optional().isFloat({ min: 0, max: 100 }),
    handleValidationErrors
  ],

  // User registration
  register: [
    body('email').isEmail().normalizeEmail(),
    body('password')
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain uppercase, lowercase, number and special character'),
    body('first_name').trim().isLength({ min: 1, max: 100 }),
    body('last_name').trim().isLength({ min: 1, max: 100 }),
    handleValidationErrors
  ],

  // Pagination
  pagination: [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    handleValidationErrors
  ],

  // UUID param
  uuidParam: (paramName = 'id') => [
    param(paramName).isUUID().withMessage('Invalid ID format'),
    handleValidationErrors
  ]
};

module.exports = {
  xssMiddleware,
  validationRules,
  handleValidationErrors
};
```

### 5.5 Encryption & Password Hashing

```javascript
// services/security/EncryptionService.js
const bcrypt = require('bcrypt');
const crypto = require('crypto');

class EncryptionService {
  constructor() {
    this.saltRounds = 12;
    this.algorithm = 'aes-256-gcm';
    this.encryptionKey = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
  }

  // Password hashing
  async hashPassword(password) {
    return await bcrypt.hash(password, this.saltRounds);
  }

  async comparePassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  // Data encryption (for sensitive fields like bank account numbers)
  encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      this.algorithm,
      this.encryptionKey,
      iv
    );

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  decrypt(encryptedData) {
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.encryptionKey,
      Buffer.from(encryptedData.iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  // Generate secure random tokens
  generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }
}

module.exports = new EncryptionService();
```

---

## 6. INTEGRACIÓN CON OpenAI GPT-4

### 6.1 AI Service Architecture

```javascript
// services/ai/OpenAIService.js
const OpenAI = require('openai');
const RedisCache = require('../cache/RedisCache');

class OpenAIService {
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.model = 'gpt-4-turbo-preview';
    this.maxTokens = 2000;
  }

  // Chat conversation with context
  async chat(userId, message, conversationHistory = []) {
    try {
      // Get user context for personalization
      const userContext = await this.getUserFinancialContext(userId);

      const systemPrompt = `You are a professional financial advisor assistant for FREEDUMB app.

User Financial Context:
- Monthly Income: $${userContext.monthlyIncome}
- Monthly Expenses: $${userContext.monthlyExpenses}
- Current Savings: $${userContext.currentSavings}
- Active Budgets: ${userContext.activeBudgets}
- Top Spending Categories: ${userContext.topCategories.join(', ')}

Your role:
1. Provide personalized financial advice
2. Help interpret financial data
3. Suggest budget optimizations
4. Offer actionable recommendations
5. Always be encouraging and supportive

Respond in a friendly, professional manner. Keep responses concise (max 200 words).`;

      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
        { role: 'user', content: message }
      ];

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: messages,
        max_tokens: this.maxTokens,
        temperature: 0.7,
        presence_penalty: 0.6,
        frequency_penalty: 0.3
      });

      const assistantMessage = response.choices[0].message.content;
      const tokensUsed = response.usage.total_tokens;

      // Store conversation in database
      await this.storeConversation(userId, message, assistantMessage, tokensUsed);

      return {
        message: assistantMessage,
        tokensUsed,
        conversationId: response.id
      };
    } catch (error) {
      console.error('OpenAI chat error:', error);
      throw new Error('AI service temporarily unavailable');
    }
  }

  // Natural Language Transaction Parsing
  async parseTransactionFromText(text) {
    try {
      const prompt = `Parse this financial transaction description into structured data.

Input: "${text}"

Extract and return ONLY a JSON object with these fields:
{
  "amount": number (positive value),
  "transaction_type": "income" | "expense" | "transfer",
  "merchant_name": string or null,
  "category": string (e.g., "food", "transportation", "salary", "entertainment"),
  "transaction_date": "YYYY-MM-DD" (use today if not specified),
  "description": string (cleaned up version),
  "confidence": number (0.0 to 1.0)
}

Examples:
"Spent $45.50 at Starbucks yesterday" →
{"amount": 45.50, "transaction_type": "expense", "merchant_name": "Starbucks", "category": "food", "transaction_date": "2024-10-19", "description": "Coffee at Starbucks", "confidence": 0.95}

"Got paid $3000 salary" →
{"amount": 3000, "transaction_type": "income", "merchant_name": null, "category": "salary", "transaction_date": "2024-10-20", "description": "Salary payment", "confidence": 0.98}`;

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: 'You are a precise financial transaction parser. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 300,
        temperature: 0.3 // Lower temperature for more consistent parsing
      });

      const parsedData = JSON.parse(response.choices[0].message.content);

      return parsedData;
    } catch (error) {
      console.error('Transaction parsing error:', error);
      throw new Error('Unable to parse transaction');
    }
  }

  // Automatic transaction categorization
  async categorizeTransaction(transaction) {
    try {
      // Check cache first
      const cacheKey = `ai:categorize:${transaction.merchant_name}`;
      const cached = await RedisCache.get(cacheKey);
      if (cached) {
        return cached;
      }

      const prompt = `Categorize this financial transaction:

Merchant: ${transaction.merchant_name || 'Unknown'}
Description: ${transaction.description || 'No description'}
Amount: $${transaction.amount}

Choose the BEST category from this list:
1. Food & Dining (restaurants, groceries, coffee)
2. Transportation (gas, uber, public transit, parking)
3. Shopping (clothing, electronics, general retail)
4. Entertainment (movies, games, streaming services)
5. Bills & Utilities (electricity, water, internet, phone)
6. Healthcare (doctor, pharmacy, insurance)
7. Housing (rent, mortgage, home maintenance)
8. Education (tuition, books, courses)
9. Personal Care (gym, salon, cosmetics)
10. Travel (hotels, flights, vacation)
11. Income (salary, freelance, investment returns)
12. Business Expenses (office supplies, client meetings)
13. Other

Respond with ONLY a JSON object:
{
  "category_id": number (1-13),
  "category_name": string,
  "confidence": number (0.0-1.0),
  "is_tax_deductible": boolean,
  "reasoning": string (brief explanation)
}`;

      const response = await this.client.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are a financial categorization expert. Always return valid JSON.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 200,
        temperature: 0.2
      });

      const result = JSON.parse(response.choices[0].message.content);

      // Cache the result for this merchant
      if (transaction.merchant_name) {
        await RedisCache.set(cacheKey, result, 86400 * 30); // Cache for 30 days
      }

      return result;
    } catch (error) {
      console.error('Categorization error:', error);
      return {
        category_id: 13,
        category_name: 'Other',
        confidence: 0.0,
        is_tax_deductible: false,
        reasoning: 'Unable to categorize'
      };
    }
  }

  // Financial insights generation
  async generateInsights(userId) {
    try {
      const userContext = await this.getUserFinancialContext(userId);
      const spendingTrends = await this.getSpendingTrends(userId);

      const prompt = `Analyze this user's financial data and provide 3-5 actionable insights:

Financial Summary:
- Monthly Income: $${userContext.monthlyIncome}
- Monthly Expenses: $${userContext.monthlyExpenses}
- Savings Rate: ${userContext.savingsRate}%
- Current Savings: $${userContext.currentSavings}

Spending Trends (last 3 months):
${JSON.stringify(spendingTrends, null, 2)}

Top Spending Categories:
${userContext.topCategories.map((cat, i) => `${i + 1}. ${cat.name}: $${cat.amount}`).join('\n')}

Active Budgets:
${userContext.budgets.map(b => `- ${b.name}: $${b.spent}/$${b.limit} (${b.percentage}% used)`).join('\n')}

Provide insights as a JSON array:
[
  {
    "type": "spending_alert" | "savings_opportunity" | "budget_warning" | "positive_trend",
    "severity": "info" | "warning" | "critical",
    "title": "Brief title (max 50 chars)",
    "description": "Detailed explanation (max 150 chars)",
    "action_items": ["actionable step 1", "actionable step 2"]
  }
]

Focus on:
1. Budget overruns or warnings
2. Unusual spending patterns
3. Savings opportunities
4. Positive behaviors to encourage`;

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: 'You are a financial analyst providing data-driven insights.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1500,
        temperature: 0.6
      });

      const insights = JSON.parse(response.choices[0].message.content);

      // Store insights in database
      await this.storeInsights(userId, insights);

      return insights;
    } catch (error) {
      console.error('Insights generation error:', error);
      throw new Error('Unable to generate insights');
    }
  }

  // Cashflow prediction
  async predictCashflow(userId, months = 3) {
    try {
      const historicalData = await this.getHistoricalTransactions(userId, 12);

      const prompt = `Based on this user's 12-month financial history, predict their cashflow for the next ${months} months.

Historical Monthly Data (last 12 months):
${JSON.stringify(historicalData, null, 2)}

Calculate and return predictions as JSON:
{
  "predictions": [
    {
      "month": "2024-11",
      "predicted_income": number,
      "predicted_expenses": number,
      "predicted_net": number,
      "confidence": number (0.0-1.0),
      "key_assumptions": ["assumption 1", "assumption 2"]
    }
  ],
  "trends": {
    "income_trend": "increasing" | "stable" | "decreasing",
    "expense_trend": "increasing" | "stable" | "decreasing",
    "volatility": "low" | "medium" | "high"
  },
  "recommendations": ["recommendation 1", "recommendation 2"]
}

Consider:
1. Seasonal patterns
2. Recurring transactions
3. Recent trends
4. Typical monthly variations`;

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: 'You are a financial forecasting expert using historical data.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 2000,
        temperature: 0.4
      });

      const prediction = JSON.parse(response.choices[0].message.content);

      return prediction;
    } catch (error) {
      console.error('Cashflow prediction error:', error);
      throw new Error('Unable to predict cashflow');
    }
  }

  // Helper methods
  async getUserFinancialContext(userId) {
    // Implementation to fetch user financial summary
    // This would query your database for recent data
    const cacheKey = `ai:context:${userId}`;
    return await RedisCache.getOrSet(cacheKey, async () => {
      // Database queries here
      return {
        monthlyIncome: 5000,
        monthlyExpenses: 3500,
        currentSavings: 15000,
        savingsRate: 30,
        activeBudgets: 5,
        topCategories: [
          { name: 'Food & Dining', amount: 800 },
          { name: 'Housing', amount: 1500 },
          { name: 'Transportation', amount: 400 }
        ],
        budgets: []
      };
    }, 300);
  }

  async getSpendingTrends(userId) {
    // Fetch spending trends from database
    return [];
  }

  async getHistoricalTransactions(userId, months) {
    // Fetch historical transaction data
    return [];
  }

  async storeConversation(userId, userMessage, assistantMessage, tokensUsed) {
    // Store in ai_conversations table
    await AIConversation.create({
      user_id: userId,
      session_id: Date.now().toString(),
      message_role: 'user',
      message_content: userMessage,
      tokens_used: tokensUsed
    });

    await AIConversation.create({
      user_id: userId,
      session_id: Date.now().toString(),
      message_role: 'assistant',
      message_content: assistantMessage,
      tokens_used: tokensUsed
    });
  }

  async storeInsights(userId, insights) {
    // Store in financial_insights table
    for (const insight of insights) {
      await FinancialInsight.create({
        user_id: userId,
        insight_type: insight.type,
        title: insight.title,
        description: insight.description,
        severity: insight.severity,
        action_items: insight.action_items
      });
    }
  }
}

module.exports = new OpenAIService();
```

### 6.2 AI Controller Implementation

```javascript
// controllers/AIController.js
const OpenAIService = require('../services/ai/OpenAIService');
const TransactionService = require('../services/TransactionService');

class AIController {
  // POST /ai/chat
  async chat(req, res) {
    try {
      const { message, conversation_history = [] } = req.body;
      const { userId } = req.user;

      if (!message || message.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_MESSAGE',
            message: 'Message cannot be empty'
          }
        });
      }

      const response = await OpenAIService.chat(
        userId,
        message,
        conversation_history
      );

      return res.json({
        success: true,
        data: response
      });
    } catch (error) {
      console.error('AI chat error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'AI_ERROR',
          message: error.message
        }
      });
    }
  }

  // POST /ai/parse-transaction
  async parseTransaction(req, res) {
    try {
      const { text } = req.body;
      const { userId } = req.user;

      if (!text) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Text is required'
          }
        });
      }

      const parsedData = await OpenAIService.parseTransactionFromText(text);

      // Optionally auto-create transaction if confidence is high
      if (parsedData.confidence >= 0.85) {
        const transaction = await TransactionService.create(userId, {
          ...parsedData,
          ai_categorized: true,
          ai_confidence_score: parsedData.confidence
        });

        return res.json({
          success: true,
          data: {
            parsed: parsedData,
            transaction: transaction,
            auto_created: true
          }
        });
      }

      return res.json({
        success: true,
        data: {
          parsed: parsedData,
          auto_created: false
        }
      });
    } catch (error) {
      console.error('Parse transaction error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'PARSE_ERROR',
          message: error.message
        }
      });
    }
  }

  // POST /ai/categorize
  async categorizeTransaction(req, res) {
    try {
      const { transaction_id } = req.body;
      const { userId } = req.user;

      const transaction = await TransactionService.findById(userId, transaction_id);
      if (!transaction) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Transaction not found'
          }
        });
      }

      const categorization = await OpenAIService.categorizeTransaction(transaction);

      // Update transaction with AI category
      if (categorization.confidence >= 0.7) {
        await TransactionService.update(userId, transaction_id, {
          category_id: categorization.category_id,
          ai_categorized: true,
          ai_confidence_score: categorization.confidence
        });
      }

      return res.json({
        success: true,
        data: categorization
      });
    } catch (error) {
      console.error('Categorization error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'CATEGORIZATION_ERROR',
          message: error.message
        }
      });
    }
  }

  // GET /ai/insights
  async getInsights(req, res) {
    try {
      const { userId } = req.user;

      const insights = await OpenAIService.generateInsights(userId);

      return res.json({
        success: true,
        data: insights
      });
    } catch (error) {
      console.error('Insights error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INSIGHTS_ERROR',
          message: error.message
        }
      });
    }
  }

  // POST /ai/predict-cashflow
  async predictCashflow(req, res) {
    try {
      const { months = 3 } = req.body;
      const { userId } = req.user;

      if (months < 1 || months > 12) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_MONTHS',
            message: 'Months must be between 1 and 12'
          }
        });
      }

      const prediction = await OpenAIService.predictCashflow(userId, months);

      return res.json({
        success: true,
        data: prediction
      });
    } catch (error) {
      console.error('Prediction error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'PREDICTION_ERROR',
          message: error.message
        }
      });
    }
  }
}

module.exports = new AIController();
```

---

*Continuará en el siguiente archivo...*
