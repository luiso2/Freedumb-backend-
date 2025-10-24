# 🔐 Token de Prueba - FREEDUMB Backend

## Token Bearer Generado

```
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJiOWRmM2RkZS0zNjQ4LTQ2ZWEtYjg3My03YTY1ZWVkZTI0OWEiLCJpYXQiOjE3NjEzMjA4MzcsImV4cCI6MTc2MTQwNzIzN30.A4s9TVYVYrJUpLw3eH1p1JYkG3GLHBF8aFIsbiilcUg
```

## Información del Token

- **User ID**: b9df3dde-3648-46ea-b873-7a65eede249a
- **Válido hasta**: Octubre 25, 2025 - 8:47 AM
- **Duración**: 24 horas
- **Algoritmo**: HS256

## 🚀 Ejemplos de Uso

### cURL - Listar Transacciones
```bash
curl -X GET http://localhost:3000/api/transactions \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJiOWRmM2RkZS0zNjQ4LTQ2ZWEtYjg3My03YTY1ZWVkZTI0OWEiLCJpYXQiOjE3NjEzMjA4MzcsImV4cCI6MTc2MTQwNzIzN30.A4s9TVYVYrJUpLw3eH1p1JYkG3GLHBF8aFIsbiilcUg"
```

### cURL - Crear Transacción
```bash
curl -X POST http://localhost:3000/api/transactions \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJiOWRmM2RkZS0zNjQ4LTQ2ZWEtYjg3My03YTY1ZWVkZTI0OWEiLCJpYXQiOjE3NjEzMjA4MzcsImV4cCI6MTc2MTQwNzIzN30.A4s9TVYVYrJUpLw3eH1p1JYkG3GLHBF8aFIsbiilcUg" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 50.00,
    "type": "expense",
    "category": "Food & Dining",
    "description": "Lunch at restaurant",
    "date": "2024-10-24"
  }'
```

### cURL - NLP Transaction (con IA)
```bash
curl -X POST http://localhost:3000/api/ai/parse-transaction \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJiOWRmM2RkZS0zNjQ4LTQ2ZWEtYjg3My03YTY1ZWVkZTI0OWEiLCJpYXQiOjE3NjEzMjA4MzcsImV4cCI6MTc2MTQwNzIzN30.A4s9TVYVYrJUpLw3eH1p1JYkG3GLHBF8aFIsbiilcUg" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Gasté 45 dólares en Starbucks ayer con mi tarjeta Visa"
  }'
```

### JavaScript (Fetch)
```javascript
fetch('http://localhost:3000/api/transactions', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJiOWRmM2RkZS0zNjQ4LTQ2ZWEtYjg3My03YTY1ZWVkZTI0OWEiLCJpYXQiOjE3NjEzMjA4MzcsImV4cCI6MTc2MTQwNzIzN30.A4s9TVYVYrJUpLw3eH1p1JYkG3GLHBF8aFIsbiilcUg',
    'Content-Type': 'application/json'
  }
})
.then(res => res.json())
.then(data => console.log(data));
```

### Axios
```javascript
const axios = require('axios');

axios.get('http://localhost:3000/api/transactions', {
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJiOWRmM2RkZS0zNjQ4LTQ2ZWEtYjg3My03YTY1ZWVkZTI0OWEiLCJpYXQiOjE3NjEzMjA4MzcsImV4cCI6MTc2MTQwNzIzN30.A4s9TVYVYrJUpLw3eH1p1JYkG3GLHBF8aFIsbiilcUg'
  }
})
.then(response => console.log(response.data))
.catch(error => console.error(error));
```

## 📋 Postman / Insomnia

1. **Authorization Tab**:
   - Type: Bearer Token
   - Token: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJiOWRmM2RkZS0zNjQ4LTQ2ZWEtYjg3My03YTY1ZWVkZTI0OWEiLCJpYXQiOjE3NjEzMjA4MzcsImV4cCI6MTc2MTQwNzIzN30.A4s9TVYVYrJUpLw3eH1p1JYkG3GLHBF8aFIsbiilcUg`

2. **O en Headers**:
   - Key: `Authorization`
   - Value: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJiOWRmM2RkZS0zNjQ4LTQ2ZWEtYjg3My03YTY1ZWVkZTI0OWEiLCJpYXQiOjE3NjEzMjA4MzcsImV4cCI6MTc2MTQwNzIzN30.A4s9TVYVYrJUpLw3eH1p1JYkG3GLHBF8aFIsbiilcUg`

## 🔄 Generar Nuevo Token

```bash
# Método 1: Script completo
node scripts/generate-token.js

# Método 2: Script rápido
./scripts/quick-token.sh

# Método 3: Con User ID específico
node scripts/generate-token.js tu-user-id-aqui
```

## 🛠️ Endpoints Disponibles

### Transacciones
- `GET /api/transactions` - Listar transacciones
- `GET /api/transactions/:id` - Ver transacción específica
- `POST /api/transactions` - Crear transacción
- `PUT /api/transactions/:id` - Actualizar transacción
- `DELETE /api/transactions/:id` - Eliminar transacción

### AI / NLP
- `POST /api/ai/parse-transaction` - Parsear texto a transacción
- `POST /api/ai/chat` - Chat con asistente financiero
- `GET /api/ai/insights` - Obtener insights financieros

### Presupuestos
- `GET /api/budgets` - Listar presupuestos
- `POST /api/budgets` - Crear presupuesto
- `GET /api/budgets/:id` - Ver presupuesto
- `PUT /api/budgets/:id` - Actualizar presupuesto
- `DELETE /api/budgets/:id` - Eliminar presupuesto

### Analytics
- `GET /api/analytics/dashboard` - Dashboard principal
- `GET /api/analytics/spending-trends` - Tendencias de gasto
- `GET /api/analytics/cashflow` - Flujo de caja

### Inversiones
- `GET /api/investments` - Listar inversiones
- `POST /api/investments` - Crear inversión
- `GET /api/investments/:id` - Ver inversión

### Notificaciones
- `GET /api/notifications` - Listar notificaciones
- `PATCH /api/notifications/:id/read` - Marcar como leída

## ⚠️ Importante

- Este token es **solo para desarrollo/testing**
- Caduca en **24 horas**
- El User ID generado es aleatorio (no existe en la BD aún)
- Para producción, obtén tokens reales vía `/api/auth/login`

## 🔍 Verificar Token

Visita https://jwt.io y pega el token (sin "Bearer") para ver el payload decodificado.
