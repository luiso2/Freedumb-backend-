# Freedumb Finance Backend API

Backend API para agente financiero con ChatGPT Actions. Sistema completo de gestión de transacciones financieras con MongoDB y despliegue en Railway.

## 🚀 Características

- ✅ API RESTful completa con Express.js
- ✅ MongoDB como base de datos
- ✅ Autenticación con API Key
- ✅ Listo para ChatGPT Actions con OpenAPI Schema
- ✅ Despliegue en Railway
- ✅ CORS habilitado para frontend
- ✅ Validaciones robustas

## 📋 Endpoints

### `GET /`
Healthcheck - Verifica que la API está funcionando

### `POST /transactions`
Registrar nueva transacción (gasto o ingreso)
```json
{
  "type": "gasto",
  "amount": 45.50,
  "card": "Visa 002",
  "description": "Gasolina",
  "category": "transporte"
}
```

### `GET /transactions`
Listar transacciones con filtros opcionales
- Query params: `type`, `category`, `limit`
- Retorna lista ordenada por fecha descendente

### `GET /summary`
Obtener resumen financiero
- Retorna: `totalGastos`, `totalIngresos`, `balance`

### `DELETE /transactions/:id`
Eliminar transacción por ID

## 🛠️ Instalación Local

1. **Instalar dependencias**
```bash
npm install
```

2. **Configurar variables de entorno**
Edita el archivo `.env` con tus credenciales:
```env
MONGODB_URI=mongodb://mongo:vBRkNBqrAMpGaZyacmSmTbDAwKwlaVNO@caboose.proxy.rlwy.net:50648
API_KEY=tu-api-key-segura
PORT=3000
```

3. **Iniciar servidor**
```bash
npm start
```

El servidor estará disponible en `http://localhost:3000`

## 🚂 Despliegue en Railway

### Opción 1: CLI de Railway

1. **Instalar Railway CLI**
```bash
npm install -g @railway/cli
```

2. **Login en Railway**
```bash
railway login
```

3. **Inicializar proyecto**
```bash
railway init
```

4. **Configurar variables de entorno**
```bash
railway variables set MONGODB_URI="mongodb://mongo:vBRkNBqrAMpGaZyacmSmTbDAwKwlaVNO@caboose.proxy.rlwy.net:50648"
railway variables set API_KEY="tu-api-key-segura"
```

5. **Desplegar**
```bash
railway up
```

### Opción 2: GitHub Integration

1. Sube el código a GitHub
2. En Railway, conecta tu repositorio
3. Railway detectará automáticamente Node.js
4. Configura las variables de entorno en Railway Dashboard:
   - `MONGODB_URI`
   - `API_KEY`
5. Railway desplegará automáticamente

## 🤖 Configurar ChatGPT Actions

1. **Obtener URL del deployment**
   - Después del deploy en Railway, copia tu URL (ej: `https://freedumb-finance.railway.app`)

2. **Actualizar openapi.yaml**
   - Reemplaza `https://your-app-name.railway.app` con tu URL real

3. **En ChatGPT, crear Custom GPT**
   - Ve a "Create a GPT"
   - En "Actions", click "Create new action"
   - Pega el contenido de `openapi.yaml`

4. **Configurar Authentication**
   - Type: `API Key`
   - Auth Type: `Custom`
   - Header Name: `x-api-key`
   - Value: Tu `API_KEY` del .env

5. **Probar el agente**
```
Usuario: "Registra un gasto de $50 en gasolina"
GPT: Usa POST /transactions

Usuario: "¿Cuál es mi balance actual?"
GPT: Usa GET /summary
```

## 📝 Ejemplos de uso con curl

### Registrar gasto
```bash
curl -X POST https://tu-app.railway.app/transactions \
  -H "x-api-key: tu-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "gasto",
    "amount": 45.50,
    "card": "Visa 002",
    "description": "Gasolina",
    "category": "transporte"
  }'
```

### Registrar ingreso
```bash
curl -X POST https://tu-app.railway.app/transactions \
  -H "x-api-key: tu-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "ingreso",
    "amount": 2500,
    "description": "Salario mensual",
    "category": "salario"
  }'
```

### Listar transacciones
```bash
curl -X GET "https://tu-app.railway.app/transactions?limit=10" \
  -H "x-api-key: tu-api-key"
```

### Obtener resumen
```bash
curl -X GET https://tu-app.railway.app/summary \
  -H "x-api-key: tu-api-key"
```

### Eliminar transacción
```bash
curl -X DELETE https://tu-app.railway.app/transactions/507f1f77bcf86cd799439011 \
  -H "x-api-key: tu-api-key"
```

## 🔒 Seguridad

- **API Key**: Todos los endpoints (excepto `/`) requieren `x-api-key` header
- **Validaciones**: Tipos de datos, montos positivos, enums validados
- **CORS**: Configurado para permitir frontends
- **MongoDB**: Conexión segura con credenciales

## 📊 Modelo de Datos

```javascript
{
  _id: ObjectId,
  type: "gasto" | "ingreso",
  amount: Number (>= 0),
  card: String | null,
  description: String | null,
  category: String | null,
  date: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## 🐛 Troubleshooting

### Error: "API Key inválida"
- Verifica que el header `x-api-key` esté presente
- Asegúrate de usar la misma key que está en `.env`

### Error de conexión a MongoDB
- Verifica que `MONGODB_URI` esté correctamente configurada
- Revisa que la base de datos en Railway esté activa

### Puerto en uso localmente
- Cambia `PORT` en `.env` a otro valor (ej: 3001)

## 📦 Estructura del Proyecto

```
Freedumb/
├── server.js           # Servidor principal con todos los endpoints
├── package.json        # Dependencias y scripts
├── .env               # Variables de entorno (NO subir a git)
├── .gitignore         # Archivos ignorados por git
├── openapi.yaml       # Schema para ChatGPT Actions
└── README.md          # Documentación
```

## 🔗 Links Útiles

- [Railway Documentation](https://docs.railway.app)
- [ChatGPT Actions Guide](https://platform.openai.com/docs/actions)
- [MongoDB Documentation](https://docs.mongodb.com)
- [Express.js](https://expressjs.com)

## 📄 Licencia

MIT

---

**Hecho con ❤️ para agentes financieros inteligentes**
