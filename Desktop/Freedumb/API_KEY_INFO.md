# 🔑 API Key del Proyecto - Finance Agent Backend

## ✅ Nueva API Key Generada

**Fecha**: 2025-10-25
**Método**: Generación criptográfica segura (SHA-256, 64 caracteres hex)

---

## 🔐 API Key

```
a11f82a9e99991af3e04c87268513cd48ba812e5227896001cf08e4259393703
```

**Características**:
- ✅ 64 caracteres hexadecimales
- ✅ Generada criptográficamente con Node.js crypto
- ✅ Altamente segura para producción
- ✅ Acceso completo a TODOS los endpoints del proyecto

---

## 📋 Endpoints Accesibles

Esta API Key da acceso a todos los endpoints del backend:

### 1. POST /transactions
Crear nueva transacción (gasto o ingreso)

### 2. GET /transactions
Listar transacciones con filtros opcionales

### 3. GET /summary
Obtener resumen financiero (totales y balance)

### 4. DELETE /transactions/:id
Eliminar una transacción por ID

**Nota**: El endpoint `GET /` (health check) NO requiere API Key

---

## 🔧 Dónde se Guardó

### Archivo .env (Local)
```env
# ===== API Security =====
# API Key segura generada criptográficamente (64 caracteres hex)
# Esta key tiene acceso a TODOS los endpoints del proyecto
API_KEY=a11f82a9e99991af3e04c87268513cd48ba812e5227896001cf08e4259393703
```

**Ubicación**: `/Users/josemichaelhernandezvargas/Desktop/Freedumb/.env`

---

## 📝 Cómo Usar la API Key

### 1. En Requests HTTP (curl)

```bash
curl -X GET http://localhost:3000/summary \
  -H "x-api-key: a11f82a9e99991af3e04c87268513cd48ba812e5227896001cf08e4259393703"
```

### 2. En JavaScript (fetch)

```javascript
fetch('http://localhost:3000/summary', {
  headers: {
    'x-api-key': 'a11f82a9e99991af3e04c87268513cd48ba812e5227896001cf08e4259393703'
  }
})
```

### 3. En ChatGPT Actions

Cuando configures el Custom GPT:

**Authentication**:
- Type: `API Key`
- Auth Type: `Custom`
- Header Name: `x-api-key`
- API Key Value: `a11f82a9e99991af3e04c87268513cd48ba812e5227896001cf08e4259393703`

### 4. En Railway (Producción)

```bash
railway variables set API_KEY="a11f82a9e99991af3e04c87268513cd48ba812e5227896001cf08e4259393703"
```

---

## 🧪 Probar la API Key

### Test 1: Obtener Resumen
```bash
curl -X GET http://localhost:3000/summary \
  -H "x-api-key: a11f82a9e99991af3e04c87268513cd48ba812e5227896001cf08e4259393703"
```

**Respuesta esperada**:
```json
{
  "totalGastos": 0,
  "totalIngresos": 0,
  "balance": 0
}
```

### Test 2: Crear Transacción
```bash
curl -X POST http://localhost:3000/transactions \
  -H "x-api-key: a11f82a9e99991af3e04c87268513cd48ba812e5227896001cf08e4259393703" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "gasto",
    "amount": 100,
    "description": "Test con nueva API Key",
    "category": "test"
  }'
```

### Test 3: Listar Transacciones
```bash
curl -X GET http://localhost:3000/transactions \
  -H "x-api-key: a11f82a9e99991af3e04c87268513cd48ba812e5227896001cf08e4259393703"
```

---

## 🔒 Seguridad

### ✅ Buenas Prácticas

1. **NO compartir públicamente**: Esta key es privada, no la subas a repositorios públicos
2. **NO commitear en Git**: El archivo `.env` está en `.gitignore`
3. **Usar en servidor**: Solo usa esta key en backend, nunca en frontend público
4. **Rotar periódicamente**: Cambia la key cada 3-6 meses

### ⚠️ Qué NO hacer

- ❌ NO incluir en código frontend/JavaScript público
- ❌ NO compartir en chat, email o mensajes
- ❌ NO publicar en GitHub/GitLab/etc.
- ❌ NO usar la misma key en múltiples proyectos

---

## 🔄 Cómo Regenerar la API Key

Si necesitas crear una nueva API Key en el futuro:

### Opción 1: Node.js
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Opción 2: OpenSSL
```bash
openssl rand -hex 32
```

Luego actualiza en `.env`:
```bash
API_KEY=tu-nueva-key-aqui
```

Y reinicia el servidor:
```bash
npm start
```

---

## 📊 Configuración en Railway

Cuando despliegues en Railway, configura esta variable:

```bash
# Conecta a Railway
railway login

# Configura la API Key
railway variables set API_KEY="a11f82a9e99991af3e04c87268513cd48ba812e5227896001cf08e4259393703"

# Verifica
railway variables
```

---

## ⚡ Reiniciar el Servidor

Para que el servidor tome la nueva API Key, reinícialo:

```bash
# Detener servidor actual
pkill -9 node

# Iniciar con nueva configuración
npm start
```

---

## 📝 Resumen

✅ **API Key generada**: `a11f82a9e99991af3e04c87268513cd48ba812e5227896001cf08e4259393703`
✅ **Guardada en**: `.env`
✅ **Acceso a**: Todos los endpoints del proyecto
✅ **Seguridad**: Generación criptográfica SHA-256
✅ **Longitud**: 64 caracteres hexadecimales
✅ **Lista para**: Desarrollo local y producción

---

## 🚨 IMPORTANTE

**Reinicia el servidor** para que tome la nueva API Key:

```bash
npm start
```

Luego prueba con:
```bash
curl http://localhost:3000/summary \
  -H "x-api-key: a11f82a9e99991af3e04c87268513cd48ba812e5227896001cf08e4259393703"
```

---

**Generado**: 2025-10-25
**Método**: Node.js crypto.randomBytes(32)
**Formato**: Hexadecimal (64 chars)

---

**⚠️ GUARDA ESTE ARCHIVO EN UN LUGAR SEGURO**

Esta API Key es necesaria para:
- Hacer requests al backend
- Configurar ChatGPT Actions
- Deploy en Railway
