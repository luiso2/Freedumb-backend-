# 📚 FREEDUMB API - Guía Completa de Endpoints

## 🔗 Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: `https://new-production-cd21.up.railway.app/api/v1`

---

## 🔐 Autenticación

Todos los endpoints (excepto `/auth/*`) requieren autenticación mediante Bearer Token.

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

---

## 📋 Endpoints Disponibles

### 1️⃣ **AUTHENTICATION**

#### `POST /auth/register`
Registrar nuevo usuario

**Request:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "SecurePass123!",
  "name": "Juan Pérez"
}
```

**Response:** (201 Created)
```json
{
  "user": {
    "id": "uuid-here",
    "email": "usuario@ejemplo.com",
    "name": "Juan Pérez"
  },
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### `POST /auth/login`
Iniciar sesión

**Request:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "SecurePass123!"
}
```

**Response:** (200 OK)
```json
{
  "user": {...},
  "token": "access-token",
  "refreshToken": "refresh-token"
}
```

#### `POST /auth/refresh`
Renovar access token

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

### 2️⃣ **TRANSACTIONS**

#### `GET /transactions`
Listar todas las transacciones

**Query Parameters:**
- `startDate` (date): Fecha inicio (YYYY-MM-DD)
- `endDate` (date): Fecha fin (YYYY-MM-DD)
- `type` (string): "income" | "expense"
- `category` (string): Categoría específica
- `page` (number): Página (default: 1)
- `limit` (number): Resultados por página (default: 50)

**Example:**
```bash
GET /transactions?type=expense&category=Food&page=1&limit=20
```

**Response:**
```json
{
  "transactions": [
    {
      "id": "uuid",
      "amount": 150.50,
      "type": "expense",
      "category": "Food & Dining",
      "merchant": "Starbucks",
      "date": "2024-10-24",
      "confidence": 0.95
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "pages": 8
  }
}
```

#### `POST /transactions`
Crear nueva transacción

**Request:**
```json
{
  "amount": 150.50,
  "type": "expense",
  "category": "Food & Dining",
  "description": "Almuerzo en restaurante",
  "merchant": "Olive Garden",
  "paymentMethod": "credit_card",
  "cardName": "Visa Gold",
  "date": "2024-10-24",
  "isTaxDeductible": false,
  "notes": "Comida de negocios"
}
```

**Response:** (201 Created)
```json
{
  "id": "new-uuid",
  "amount": 150.50,
  ...
}
```

#### `GET /transactions/:id`
Obtener transacción específica

**Response:**
```json
{
  "id": "uuid",
  "amount": 150.50,
  ...
}
```

#### `PUT /transactions/:id`
Actualizar transacción

#### `DELETE /transactions/:id`
Eliminar transacción

**Response:** (204 No Content)

#### `POST /transactions/nlp` ⭐ NLP Feature
Crear transacción desde lenguaje natural

**Request:**
```json
{
  "input": "Gasté $50 en Starbucks ayer con mi Visa"
}
```

**Response:**
```json
{
  "transaction": {
    "id": "new-uuid",
    "amount": 50.00,
    "type": "expense",
    "category": "Food & Dining",
    "merchant": "Starbucks",
    "paymentMethod": "credit_card",
    "cardName": "Visa",
    "date": "2024-10-23"
  },
  "parsed": {
    "confidence": 0.95,
    "originalInput": "Gasté $50 en Starbucks ayer con mi Visa"
  }
}
```

---

### 3️⃣ **AI FEATURES** 🤖

#### `POST /ai/categorize` ⭐
Categorizar transacción con GPT-4

**Request:**
```json
{
  "description": "Compra en supermercado",
  "amount": 85.50,
  "merchant": "Walmart"
}
```

**Response:**
```json
{
  "category": "Food & Dining",
  "subCategory": "Groceries",
  "confidence": 0.92,
  "isTaxDeductible": false,
  "reasoning": "Compra típica de supermercado para alimentos"
}
```

#### `POST /ai/chat` ⭐
Conversar con asistente financiero IA

**Request:**
```json
{
  "message": "¿Cómo puedo ahorrar más dinero?",
  "context": []
}
```

**Response:**
```json
{
  "response": "Basándome en tu historial, te recomiendo...",
  "suggestions": [
    "Reduce gastos en categoría 'Entertainment' ($200/mes)",
    "Aumenta tu tasa de ahorro al 25%"
  ]
}
```

#### `GET /ai/insights` ⭐
Obtener insights financieros generados por IA

**Response:**
```json
{
  "insights": {
    "spendingPatterns": [...],
    "savingsOpportunities": [...],
    "budgetRecommendations": [...],
    "warnings": [...]
  },
  "generatedAt": "2024-10-24T10:00:00Z",
  "transactionCount": 245
}
```

---

### 4️⃣ **BUDGETS**

#### `GET /budgets`
Listar todos los presupuestos

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Monthly Food Budget",
    "category": "Food & Dining",
    "limit": 500.00,
    "spent": 320.50,
    "period": "monthly",
    "alertThreshold": 80,
    "isActive": true
  }
]
```

#### `POST /budgets`
Crear nuevo presupuesto

**Request:**
```json
{
  "name": "Monthly Food Budget",
  "category": "Food & Dining",
  "limit": 500.00,
  "period": "monthly",
  "alertThreshold": 80
}
```

#### `GET /budgets/:id`
Obtener presupuesto específico

#### `PUT /budgets/:id`
Actualizar presupuesto

#### `DELETE /budgets/:id`
Eliminar presupuesto

---

### 5️⃣ **INVESTMENTS**

#### `GET /investments`
Listar portafolio de inversiones

**Response:**
```json
[
  {
    "id": "uuid",
    "symbol": "AAPL",
    "name": "Apple Inc.",
    "type": "stock",
    "quantity": 10.5,
    "purchasePrice": 150.00,
    "currentPrice": 175.50,
    "purchaseDate": "2024-01-15",
    "totalValue": 1842.75,
    "totalGainLoss": 267.75,
    "gainLossPercentage": 17.85
  }
]
```

#### `POST /investments`
Agregar nueva inversión

**Request:**
```json
{
  "symbol": "TSLA",
  "name": "Tesla Inc.",
  "type": "stock",
  "quantity": 5.0,
  "purchasePrice": 250.00,
  "currentPrice": 265.00,
  "purchaseDate": "2024-10-20"
}
```

#### `GET /investments/:id`
Obtener inversión específica

#### `PUT /investments/:id`
Actualizar inversión

#### `DELETE /investments/:id`
Eliminar inversión

---

### 6️⃣ **ANALYTICS** 📊

#### `GET /analytics/summary`
Resumen financiero general

**Query Parameters:**
- `startDate` (optional): Fecha inicio
- `endDate` (optional): Fecha fin

**Response:**
```json
{
  "income": 5000.00,
  "expenses": 3500.00,
  "savings": 1500.00,
  "netWorth": 15000.00,
  "transactionCount": 156,
  "topCategories": [
    {"category": "Food & Dining", "amount": 800.00},
    {"category": "Transportation", "amount": 450.00},
    {"category": "Entertainment", "amount": 320.00}
  ]
}
```

#### `GET /analytics/cashflow`
Análisis de flujo de caja por mes

**Query Parameters:**
- `months` (number): Número de meses históricos (default: 6)

**Response:**
```json
{
  "cashflow": [
    {
      "month": "2024-05",
      "income": 5000.00,
      "expenses": 3200.00,
      "net": 1800.00
    },
    {
      "month": "2024-06",
      "income": 5200.00,
      "expenses": 3400.00,
      "net": 1800.00
    }
  ]
}
```

#### `GET /analytics/predictions` ⭐ AI Predictions
Predicciones financieras con IA

**Query Parameters:**
- `months` (number): Meses a predecir (1-12, default: 3)

**Response:**
```json
{
  "predictions": [
    {
      "month": "2024-11",
      "predictedIncome": 5100.00,
      "predictedExpenses": 3500.00,
      "predictedNet": 1600.00,
      "confidence": 0.87,
      "keyAssumptions": [
        "Salario recurrente mensual",
        "Aumento estacional en gastos (holidays)",
        "Patrón de ahorro constante"
      ]
    }
  ]
}
```

---

### 7️⃣ **USER PROFILE**

#### `GET /users/profile`
Obtener perfil del usuario autenticado

**Response:**
```json
{
  "id": "uuid",
  "email": "usuario@ejemplo.com",
  "name": "Juan Pérez",
  "monthlyIncome": 5000.00,
  "savingsGoal": 10000.00,
  "riskTolerance": "moderate",
  "createdAt": "2024-01-01T00:00:00Z",
  "lastLogin": "2024-10-24T09:00:00Z"
}
```

#### `PUT /users/profile`
Actualizar perfil del usuario

**Request:**
```json
{
  "name": "Juan Pérez",
  "monthlyIncome": 5500.00,
  "savingsGoal": 12000.00,
  "riskTolerance": "high"
}
```

---

### 8️⃣ **SYSTEM**

#### `GET /health`
Health check (no requiere autenticación)

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-10-24T10:00:00Z",
  "uptime": 86400,
  "environment": "production",
  "version": "1.0.0"
}
```

---

## 🚀 Ejemplos de Uso

### Con cURL

```bash
# Obtener token
TOKEN="Bearer eyJhbGciOiJIUzI1NiIs..."

# Listar transacciones
curl -H "Authorization: $TOKEN" \
     http://localhost:3000/api/transactions

# Crear transacción
curl -X POST http://localhost:3000/api/transactions \
  -H "Authorization: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 75.50,
    "type": "expense",
    "category": "Food & Dining",
    "description": "Almuerzo",
    "date": "2024-10-24"
  }'

# NLP - Crear desde texto
curl -X POST http://localhost:3000/api/transactions/nlp \
  -H "Authorization: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"input": "Pagué $50 en Walmart con mi Visa"}'

# Chat con IA
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Authorization: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "¿Cómo puedo reducir mis gastos?"}'

# Obtener predicciones
curl -H "Authorization: $TOKEN" \
     "http://localhost:3000/api/analytics/predictions?months=3"
```

### Con JavaScript (Axios)

```javascript
const axios = require('axios');

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIs...'
  }
});

// Listar transacciones
const transactions = await api.get('/transactions');

// Crear transacción
const newTransaction = await api.post('/transactions', {
  amount: 75.50,
  type: 'expense',
  category: 'Food & Dining',
  description: 'Almuerzo',
  date: '2024-10-24'
});

// Chat con IA
const aiResponse = await api.post('/ai/chat', {
  message: '¿Cómo puedo ahorrar más?'
});

// Obtener resumen financiero
const summary = await api.get('/analytics/summary');
```

---

## 🔑 Códigos de Estado HTTP

- **200 OK**: Solicitud exitosa
- **201 Created**: Recurso creado exitosamente
- **204 No Content**: Eliminación exitosa
- **400 Bad Request**: Datos de entrada inválidos
- **401 Unauthorized**: Token inválido o expirado
- **404 Not Found**: Recurso no encontrado
- **409 Conflict**: Conflicto (ej: usuario ya existe)
- **500 Internal Server Error**: Error del servidor

---

## 📊 Rate Limiting

- **General**: 100 requests/minuto
- **Auth**: 5 requests/15 minutos

---

## ⚡ Features con IA (GPT-4)

1. **NLP Transaction Creation** (`/transactions/nlp`)
   - Parsea texto natural a transacción estructurada

2. **Auto-Categorization** (`/ai/categorize`)
   - Categoriza transacciones automáticamente con 90%+ precisión

3. **Financial Chat** (`/ai/chat`)
   - Asistente financiero conversacional

4. **AI Insights** (`/ai/insights`)
   - Genera insights personalizados sobre hábitos financieros

5. **Cashflow Predictions** (`/analytics/predictions`)
   - Predice flujo de caja futuro con análisis de tendencias

---

## 🔐 Seguridad

- JWT Tokens con expiración
- HTTPS en producción
- Rate limiting
- Input validation
- SQL injection prevention
- XSS protection

---

**Documentación Completa**: Ver `openapi.yaml` para especificación completa
**Version**: 1.0.0
**Last Updated**: Oct 24, 2024
