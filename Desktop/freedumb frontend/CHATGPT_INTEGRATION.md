# 🤖 Integración FREEDUMB con ChatGPT

## 📋 Visión General

Este sistema permite que ChatGPT actúe como interfaz para FREEDUMB, donde los usuarios pueden:

1. **Guardar transacciones** hablando naturalmente
2. **Ver sus datos** a través de widgets interactivos generados dinámicamente
3. **Recibir insights** financieros personalizados
4. **Gestionar presupuestos** mediante conversación

---

## 🔄 Flujo de Funcionamiento

```
┌─────────────────────────────────────────────────────────────┐
│  PASO 1: Usuario habla con ChatGPT                          │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│  Usuario: "Gasté $50 en Uber ayer"                          │
│                                                              │
│  ChatGPT → POST /api/transactions/nlp                       │
│  {                                                           │
│    "input": "Gasté $50 en Uber ayer"                        │
│  }                                                           │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│  PASO 2: Backend procesa con GPT-4                          │
│                                                              │
│  - Parsea el lenguaje natural                               │
│  - Extrae: $50, categoría: Transport, fecha: ayer          │
│  - Guarda en PostgreSQL                                     │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│  PASO 3: ChatGPT responde                                   │
│                                                              │
│  "✅ Guardado! Gasté $50 en Uber (Transporte)"             │
└─────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────┐
│  PASO 4: Usuario pide ver sus datos                         │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│  Usuario: "Muéstrame mis gastos del mes"                    │
│                                                              │
│  ChatGPT → POST /api/widget/generate                        │
│  {                                                           │
│    "widgetType": "dashboard",                               │
│    "period": "month"                                        │
│  }                                                           │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│  PASO 5: Backend genera URL con token                       │
│                                                              │
│  Response:                                                   │
│  {                                                           │
│    "widgetUrl": "https://freedumb.app/widget?               │
│                  user=123&period=month&token=xyz"           │
│  }                                                           │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│  PASO 6: ChatGPT muestra el link                            │
│                                                              │
│  "Aquí están tus gastos del mes:                            │
│   [Ver Dashboard Interactivo](https://freedumb.app/...)     │
│                                                              │
│   📊 Resumen rápido:                                        │
│   - Gastos totales: $1,234                                  │
│   - Mayor categoría: Comida ($456)                          │
│   - Comparado con mes pasado: +12%"                         │
└─────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────┐
│  PASO 7: Usuario hace click en el link                      │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│  Widget Frontend se carga:                                  │
│                                                              │
│  1. Extrae token y user del URL                             │
│  2. Hace llamadas al backend:                               │
│     - GET /api/transactions?period=month                    │
│     - GET /api/budgets                                      │
│     - GET /api/ai/insights                                  │
│  3. Renderiza:                                              │
│     - Gráficos animados (Chart.js)                          │
│     - Cards con stats                                       │
│     - Lista de transacciones                                │
│     - Insights de IA                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Configuración en ChatGPT

### Paso 1: Crear GPT Personalizado

1. Ve a https://chat.openai.com/gpts
2. Click "Create a GPT"
3. Configura:

**Nombre:** FREEDUMB Financial Assistant

**Descripción:**
```
Asistente financiero personal que te ayuda a gestionar tus finanzas.
Puedo guardar tus gastos/ingresos cuando me los digas en lenguaje natural,
mostrarte tus datos con visualizaciones interactivas, y darte consejos
personalizados basados en tus patrones de gasto.
```

**Instructions:**
```
Eres Eliza, el asistente financiero de FREEDUMB. Tu trabajo es ayudar
a los usuarios a gestionar sus finanzas de manera conversacional.

CAPACIDADES:
1. Guardar transacciones cuando el usuario te las diga naturalmente
   Ejemplo: "Gasté $50 en Starbucks" → Llamas a saveTransactionFromNaturalLanguage

2. Mostrar datos financieros con widgets interactivos
   Cuando el usuario pida "muestra mis gastos", generas un widget URL

3. Dar insights y consejos financieros personalizados
   Basándote en los datos reales del usuario

FLUJO DE TRABAJO:
- Usuario dice transacción → La guardas → Confirmas
- Usuario pide ver datos → Generas widget → Muestras link + resumen
- Usuario pide consejo → Consultas insights → Das recomendaciones específicas

IMPORTANTE:
- Siempre confirma después de guardar una transacción
- Cuando generes widgets, incluye un resumen textual también
- Sé amigable, usa emojis, y da consejos accionables
- Si el usuario no está autenticado, pídele que haga login primero
```

### Paso 2: Añadir Actions (API Schema)

1. En la sección "Actions", click "Create new action"
2. Import from URL o pega el schema YAML
3. Schema URL: `https://your-railway-app.up.railway.app/chatgpt-openapi-schema.yaml`

O copia el contenido de `chatgpt-openapi-schema.yaml`

### Paso 3: Configurar Autenticación

**Authentication Type:** API Key

**API Key:** Se obtiene del endpoint `/auth/chatgpt-token`

**Header Name:** `Authorization`
**Header Value:** `Bearer {API_KEY}`

---

## 🎯 Endpoints Clave para ChatGPT

### 1. Guardar Transacción (NLP)

```http
POST /api/transactions/nlp
Authorization: Bearer {token}
Content-Type: application/json

{
  "input": "Pagué $120 en el supermercado con mi tarjeta de débito"
}
```

**Respuesta:**
```json
{
  "transaction": {
    "id": "uuid",
    "amount": 120,
    "type": "expense",
    "category": "Food & Dining",
    "merchant": "Supermercado",
    "payment_method": "debit_card",
    "date": "2024-10-23"
  },
  "parsed": {
    "confidence": 0.95,
    "originalInput": "Pagué $120..."
  }
}
```

### 2. Generar Widget URL

```http
POST /api/widget/generate
Authorization: Bearer {token}
Content-Type: application/json

{
  "widgetType": "dashboard",
  "period": "month"
}
```

**Respuesta:**
```json
{
  "widgetUrl": "https://freedumb.app/widget?user=123&period=month&token=xyz123",
  "embedCode": "<iframe src='...' width='100%' height='600'></iframe>",
  "expiresAt": "2024-10-24T12:00:00Z"
}
```

### 3. Obtener Resumen Rápido

```http
GET /api/analytics/summary?period=month
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "totalIncome": 5000,
  "totalExpenses": 3200,
  "balance": 1800,
  "categoryBreakdown": {
    "Food & Dining": 800,
    "Transport": 400,
    "Entertainment": 300
  },
  "savingsRate": 36,
  "widgetUrl": "https://..."
}
```

---

## 💬 Ejemplos de Conversación

### Ejemplo 1: Guardar Gasto

```
Usuario: "Gasté $45.50 en Uber para ir al trabajo"

ChatGPT:
✅ Guardado!
- Monto: $45.50
- Categoría: Transporte (Uber)
- Fecha: Hoy
- Método: No especificado

¿Quieres que lo marque como gasto de negocio para fines fiscales?
```

### Ejemplo 2: Ver Dashboard

```
Usuario: "Muéstrame cómo van mis gastos este mes"

ChatGPT:
📊 Aquí está tu dashboard financiero de Octubre:

[Ver Dashboard Interactivo Completo](https://freedumb.app/widget/...)

📈 Resumen rápido:
• Gastos totales: $3,245
• Ingresos: $5,000
• Balance: +$1,755

🔝 Top 3 categorías:
1. Comida: $856 (26%)
2. Transporte: $623 (19%)
3. Entretenimiento: $445 (14%)

💡 Insight: Gastas 15% más en comida que el mes pasado.
¿Quieres que te sugiera cómo reducir gastos?
```

### Ejemplo 3: Insights y Consejos

```
Usuario: "¿Cómo puedo ahorrar más?"

ChatGPT:
Basándome en tus datos, aquí hay 3 formas específicas de ahorrar:

💰 Oportunidades de ahorro identificadas:

1. **Comida y Restaurantes** 📉
   - Gastas $856/mes (26% de tus gastos)
   - Reduciendo delivery a solo fines de semana: -$200/mes
   - Ahorro anual: $2,400

2. **Suscripciones** 📱
   - Tienes 5 suscripciones activas ($87/mes)
   - 2 no las has usado en 2 meses
   - Cancelando: -$35/mes = $420/año

3. **Transporte** 🚗
   - Uber: $280/mes en promedio
   - Considerar transporte público: -$150/mes
   - Ahorro anual: $1,800

Total potencial de ahorro: $4,620/año

¿Quieres que cree presupuestos automáticos para estas categorías?
```

---

## 🔧 Implementación Backend - Endpoint de Widget

Añade este endpoint a tu backend:

```javascript
// src/routes/widget.routes.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

router.post('/generate', async (req, res) => {
  try {
    const { widgetType, period, category, params } = req.body;
    const userId = req.userId; // Del middleware authenticate

    // Generar token temporal para el widget (expira en 1 hora)
    const widgetToken = jwt.sign(
      { userId, widgetType, period },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Construir URL del widget
    const baseUrl = process.env.FRONTEND_URL || 'https://freedumb.app';
    const widgetUrl = new URL(`${baseUrl}/widget`);

    widgetUrl.searchParams.set('user', userId);
    widgetUrl.searchParams.set('type', widgetType);
    widgetUrl.searchParams.set('period', period || 'month');
    widgetUrl.searchParams.set('token', widgetToken);

    if (category) {
      widgetUrl.searchParams.set('category', category);
    }

    // Código de embed
    const embedCode = `<iframe src="${widgetUrl.toString()}" width="100%" height="600" frameborder="0"></iframe>`;

    res.json({
      widgetUrl: widgetUrl.toString(),
      embedCode,
      expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hora
      widgetType,
      period
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate widget URL' });
  }
});

module.exports = router;
```

Luego en `server.js`:

```javascript
const widgetRoutes = require('./routes/widget.routes');
app.use('/api/widget', authenticate, widgetRoutes);
```

---

## 📊 Tipos de Widgets Disponibles

### 1. Dashboard Completo
```
URL: /widget?type=dashboard&period=month&token=xyz
Muestra: Stats, gráficos, transacciones, budgets, insights
```

### 2. Solo Transacciones
```
URL: /widget?type=transactions&period=week&token=xyz
Muestra: Lista filtrada de transacciones con animaciones
```

### 3. Presupuestos
```
URL: /widget?type=budgets&token=xyz
Muestra: Estado de todos los presupuestos con barras de progreso
```

### 4. Insights IA
```
URL: /widget?type=insights&period=month&token=xyz
Muestra: Análisis y recomendaciones de IA
```

### 5. Categoría Específica
```
URL: /widget?type=category&category=food&period=month&token=xyz
Muestra: Deep dive en una categoría específica
```

---

## 🚀 Deployment

### 1. Backend en Railway

Ya está configurado. Solo asegúrate de tener:

```env
FRONTEND_URL=https://freedumb.app
OPENAI_API_KEY=tu-clave-aqui
JWT_SECRET=tu-secret-aqui
```

### 2. Frontend en Vercel/Netlify

```bash
# Subir a Vercel
cd "freedumb frontend"
vercel --prod

# O a Netlify
netlify deploy --prod --dir .
```

### 3. Configurar CORS

En tu backend `server.js`:

```javascript
app.use(cors({
  origin: [
    'https://freedumb.app',
    'https://chat.openai.com',
    'http://localhost:3001'
  ],
  credentials: true
}));
```

---

## 🔐 Seguridad

### Tokens de Widget

- **Expiración:** 1 hora
- **Scope limitado:** Solo lectura de datos del usuario
- **One-time use:** Opcional, regenerar después de uso

### Rate Limiting para ChatGPT

```javascript
const chatgptLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 30, // 30 requests por minuto
  message: 'Too many requests from ChatGPT',
});

app.use('/api/', chatgptLimiter);
```

---

## 📈 Métricas y Monitoreo

Trackear:
- Número de transacciones vía ChatGPT
- Widgets generados
- Tasa de conversión (conversación → widget click)
- Tiempo promedio de parsing NLP
- Errores de parsing

---

## 🎨 Personalización del Widget

Los usuarios pueden personalizar los widgets via URL params:

```
?theme=dark              # Tema oscuro/claro
?currency=USD           # Moneda
&lang=es                # Idioma
&showInsights=true      # Mostrar/ocultar insights
&animated=true          # Animaciones on/off
```

---

## 📝 Próximos Pasos

1. ✅ Frontend widget creado
2. ✅ OpenAPI schema listo
3. ⏳ Añadir endpoint `/widget/generate` al backend
4. ⏳ Subir frontend a Vercel/Netlify
5. ⏳ Configurar GPT personalizado en ChatGPT
6. ⏳ Testing end-to-end

---

**¡Tu sistema ChatGPT + FREEDUMB está listo para usar!** 🎉
