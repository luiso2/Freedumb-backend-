# 🚂 Guía de Despliegue en Railway

Esta guía te ayudará a desplegar tu Finance Agent Backend en Railway paso a paso.

## Prerequisitos

- Cuenta en [Railway.app](https://railway.app)
- Proyecto creado en Railway
- MongoDB configurado (puedes usar el add-on de Railway o la URL existente)

## Opción 1: Deploy desde GitHub (Recomendado)

### Paso 1: Subir código a GitHub

```bash
# Inicializar git si aún no lo has hecho
git init

# Agregar archivos
git add .

# Crear commit
git commit -m "Initial commit: Finance Agent Backend"

# Agregar remote (reemplaza con tu repo)
git remote add origin https://github.com/tu-usuario/freedumb-finance.git

# Push a GitHub
git push -u origin master
```

### Paso 2: Conectar Railway con GitHub

1. Ve a [Railway Dashboard](https://railway.app/dashboard)
2. Click en "+ New Project"
3. Selecciona "Deploy from GitHub repo"
4. Autoriza Railway a acceder a tu GitHub
5. Selecciona el repositorio `freedumb-finance`
6. Railway detectará automáticamente que es un proyecto Node.js

### Paso 3: Configurar Variables de Entorno

En Railway Dashboard, ve a tu proyecto:

1. Click en la pestaña "Variables"
2. Agregar las siguientes variables:

```
MONGODB_URI=mongodb://mongo:vBRkNBqrAMpGaZyacmSmTbDAwKwlaVNO@caboose.proxy.rlwy.net:50648
API_KEY=genera-una-clave-segura-aqui
PORT=3000
```

**Importante**:
- El `PORT` es asignado automáticamente por Railway, pero puedes dejarlo en 3000
- Cambia `API_KEY` por una clave segura generada (usa un generador de passwords)

### Paso 4: Deploy Automático

Railway desplegará automáticamente tu aplicación. Verás el progreso en los logs.

### Paso 5: Obtener URL Pública

1. En Railway, ve a la pestaña "Settings"
2. Busca "Networking" o "Domains"
3. Click en "Generate Domain"
4. Railway te dará una URL como: `https://freedumb-finance-production.up.railway.app`

**Guarda esta URL**, la necesitarás para ChatGPT Actions.

---

## Opción 2: Deploy con Railway CLI

### Paso 1: Instalar Railway CLI

```bash
npm install -g @railway/cli
```

### Paso 2: Login

```bash
railway login
```

Esto abrirá tu navegador para autenticarte.

### Paso 3: Inicializar Proyecto

```bash
railway init
```

Selecciona "Create new project" o selecciona un proyecto existente.

### Paso 4: Configurar Variables

```bash
railway variables set MONGODB_URI="mongodb://mongo:vBRkNBqrAMpGaZyacmSmTbDAwKwlaVNO@caboose.proxy.rlwy.net:50648"
railway variables set API_KEY="tu-clave-segura"
```

### Paso 5: Deploy

```bash
railway up
```

### Paso 6: Ver Logs

```bash
railway logs
```

### Paso 7: Abrir en Navegador

```bash
railway open
```

---

## Verificar Deployment

### 1. Test de Health Check

```bash
curl https://tu-app.railway.app/
```

Deberías ver:
```json
{
  "status": "ok",
  "message": "✅ Finance Agent API activa",
  "timestamp": "2025-10-25T12:00:00.000Z"
}
```

### 2. Test con API Key

```bash
curl https://tu-app.railway.app/summary \
  -H "x-api-key: tu-api-key"
```

Deberías ver:
```json
{
  "totalGastos": 0,
  "totalIngresos": 0,
  "balance": 0
}
```

---

## Configurar MongoDB (si usas Railway MongoDB Add-on)

Si prefieres usar el add-on de MongoDB de Railway en lugar de la URL existente:

### Paso 1: Agregar MongoDB

1. En Railway Dashboard, click en "+ New"
2. Selecciona "Database" → "Add MongoDB"
3. Railway creará una instancia de MongoDB

### Paso 2: Conectar al Backend

Railway automáticamente inyectará las variables:
- `MONGO_URL`
- `MONGODB_URI` (o similar)

Actualiza `server.js` si es necesario para usar estas variables.

---

## Troubleshooting

### Error: "Application failed to respond"

**Causa**: El servidor no se está iniciando correctamente.

**Solución**:
1. Revisa los logs: `railway logs`
2. Verifica que `MONGODB_URI` esté correctamente configurada
3. Asegúrate de que el servidor escucha en el puerto correcto:
   ```javascript
   const PORT = process.env.PORT || 3000;
   ```

### Error: "Cannot connect to MongoDB"

**Causa**: La URL de MongoDB es incorrecta o la base de datos no está accesible.

**Solución**:
1. Verifica que `MONGODB_URI` esté correctamente configurada
2. Prueba la conexión localmente primero
3. Revisa que la IP de Railway esté permitida en MongoDB (si usas MongoDB Atlas)

### Error: "API Key inválida"

**Causa**: La API Key no está configurada o no coincide.

**Solución**:
1. Verifica que `API_KEY` esté configurada en Railway Variables
2. Usa la misma key en tus requests
3. Verifica que el header sea exactamente `x-api-key`

---

## Monitoreo y Logs

### Ver Logs en Tiempo Real

```bash
railway logs --tail
```

### Ver Métricas

En Railway Dashboard:
1. Ve a tu proyecto
2. Click en "Metrics"
3. Verás CPU, Memory, Network

---

## Actualizar Deployment

### Con GitHub

Simplemente haz push a tu repositorio:
```bash
git add .
git commit -m "Update: nueva funcionalidad"
git push
```

Railway desplegará automáticamente los cambios.

### Con CLI

```bash
railway up
```

---

## Rollback (Volver a Versión Anterior)

En Railway Dashboard:
1. Ve a "Deployments"
2. Selecciona un deployment anterior
3. Click en "Redeploy"

---

## Costos

Railway ofrece:
- **$5 gratis al mes** (Hobby Plan)
- Después, paga por uso (aprox $0.000231/GB-hour)

**Estimado para este proyecto**:
- Servidor Node.js: ~$5-10/mes
- MongoDB (si usas add-on): ~$5/mes

**Total**: ~$10-15/mes

Si usas tu propia MongoDB (URL externa), solo pagas por el servidor Node.js.

---

## Variables de Entorno Finales

```env
# Railway Variables
MONGODB_URI=mongodb://mongo:vBRkNBqrAMpGaZyacmSmTbDAwKwlaVNO@caboose.proxy.rlwy.net:50648
API_KEY=tu-clave-super-segura-generada
PORT=3000
```

---

## ✅ Checklist de Deployment

- [ ] Código subido a GitHub (o listo para `railway up`)
- [ ] Variables de entorno configuradas en Railway
- [ ] MongoDB accesible y funcionando
- [ ] Health check funcionando (`GET /`)
- [ ] API Key configurada y probada
- [ ] URL pública obtenida
- [ ] Logs verificados sin errores
- [ ] Endpoints probados con Postman/curl

---

**¡Listo!** Tu Finance Agent Backend está desplegado en Railway.

Siguiente paso: [Configurar ChatGPT Actions →](./CHATGPT_SETUP.md)
