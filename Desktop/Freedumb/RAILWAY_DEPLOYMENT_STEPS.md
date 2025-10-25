# Cómo Desplegar el Backend a Railway y Solucionar el Error 404

## Problema Actual

ChatGPT está intentando acceder a: `/oauth/authorize` pero recibe un error 404 "Not Found".

Esto significa que el backend en Railway **NO está actualizado** con los últimos cambios de OAuth que hicimos.

## Solución: Desplegar a Railway

### Opción 1: Deploy Automático desde GitHub (Recomendado)

1. **Verifica que Railway esté conectado con GitHub:**
   - Ve a https://railway.app
   - Inicia sesión
   - Selecciona tu proyecto "Freedumb"
   - Ve a "Settings" → "Service"
   - Verifica que esté conectado a tu repositorio de GitHub

2. **Triggerea un nuevo deploy:**
   - Ve a la pestaña "Deployments"
   - Haz clic en "Deploy Now" o "Redeploy"
   - Railway detectará los últimos cambios en GitHub y hará el deploy

3. **Espera a que el deploy termine:**
   - Verás el progreso en la consola
   - Debe mostrar: ✅ Deployment successful
   - El servidor debe estar en estado "Active"

### Opción 2: Deploy Manual con Railway CLI

```bash
# 1. Asegúrate de estar en el directorio correcto
cd /Users/josemichaelhernandezvargas/Desktop/Freedumb

# 2. Verifica el estado de Railway
railway status

# 3. Haz el deploy
railway up

# 4. Verifica los logs
railway logs
```

### Opción 3: Force Push (Si nada más funciona)

```bash
# 1. Crea un commit vacío para forzar el deploy
git commit --allow-empty -m "Force Railway redeploy"

# 2. Push a GitHub
git push origin master

# 3. Railway debería detectarlo automáticamente
```

## Verificar el Deploy

### 1. Verifica que el servidor esté corriendo

Abre esta URL en tu navegador (reemplaza con tu dominio de Railway):
```
https://TU-DOMINIO-RAILWAY.up.railway.app/
```

Deberías ver:
```
✅ Backend OAuth Provider + Finance API activo
```

### 2. Prueba la ruta OAuth

Abre esta URL:
```
https://TU-DOMINIO-RAILWAY.up.railway.app/oauth/authorize?client_id=test&redirect_uri=test&state=test
```

Debería redirigirte a Google OAuth.

## Variables de Entorno en Railway

Asegúrate de que Railway tenga estas variables configuradas:

1. Ve a tu proyecto en Railway
2. Ve a "Variables"
3. Agrega/Verifica estas variables:

```
MONGODB_URI=tu-mongodb-uri-de-railway
API_KEY=tu-api-key-generada
JWT_SECRET=tu-jwt-secret-generado
GOOGLE_CLIENT_ID=tu-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-google-client-secret
OAUTH_CALLBACK_URL=https://TU-DOMINIO-RAILWAY.up.railway.app/oauth/callback
FRONTEND_URL=https://TU-DOMINIO-FRONTEND.vercel.app
ACTION_CLIENT_ID=chatgpt-finance-agent
ACTION_CLIENT_SECRET=chatgpt-finance-agent-secret-key-2025
ACTION_REDIRECT_URI=https://chat.openai.com/aip/g-oauth/callback
```

**IMPORTANTE:** Reemplaza `TU-DOMINIO-RAILWAY` con tu dominio real de Railway.

## Actualizar Google Cloud Console

Después del deploy, actualiza las URLs autorizadas en Google Cloud Console:

1. Ve a https://console.cloud.google.com/apis/credentials
2. Selecciona tu OAuth 2.0 Client ID
3. En "Authorized redirect URIs", agrega:
   ```
   https://TU-DOMINIO-RAILWAY.up.railway.app/oauth/callback
   https://TU-DOMINIO-RAILWAY.up.railway.app/auth/google/callback
   ```
4. En "Authorized JavaScript origins":
   ```
   https://TU-DOMINIO-RAILWAY.up.railway.app
   ```
5. Guarda los cambios

## Configurar ChatGPT Custom GPT

Una vez que el backend esté desplegado:

1. **Abre ChatGPT GPT Builder**
2. **Ve a "Configure" → "Authentication"**
3. **Selecciona "OAuth"**
4. **Configura estos valores:**

   ```
   Authorization URL: https://TU-DOMINIO-RAILWAY.up.railway.app/oauth/authorize
   Token URL: https://TU-DOMINIO-RAILWAY.up.railway.app/oauth/token
   Client ID: chatgpt-finance-agent
   Client Secret: chatgpt-finance-agent-secret-key-2025
   Scope: openid email profile
   Token Exchange Method: Default (POST request)
   ```

5. **Guarda y Prueba la Autenticación**

## Troubleshooting

### Error 404 - Not Found

**Causa:** El backend no está actualizado en Railway
**Solución:** Sigue los pasos de arriba para desplegar

### Error 500 - Internal Server Error

**Causa:** Variables de entorno mal configuradas
**Solución:** Revisa que todas las variables estén correctamente en Railway

### Error "client_id inválido"

**Causa:** `ACTION_CLIENT_ID` no coincide
**Solución:** Verifica que en Railway y en ChatGPT uses el mismo Client ID

### Error "redirect_uri no permitido"

**Causa:** La URL de ChatGPT no está en `ACTION_REDIRECT_URI`
**Solución:** Usa exactamente: `https://chat.openai.com/aip/g-oauth/callback`

### MongoDB Connection Error

**Causa:** `MONGODB_URI` incorrecta
**Solución:** Copia la URI exacta del archivo `.env` local

## Verificar Logs en Railway

Para ver qué está pasando:

```bash
railway logs --follow
```

O en el dashboard:
1. Ve a "Deployments"
2. Haz clic en el deployment activo
3. Ve a "View Logs"

Deberías ver:
```
🚀 Server on :XXXX
✅ MongoDB conectado
```

## Comandos Útiles

```bash
# Ver status de Railway
railway status

# Ver logs en tiempo real
railway logs --follow

# Hacer deploy
railway up

# Ver variables de entorno
railway variables

# Abrir dashboard
railway open
```

## Pasos Rápidos (TL;DR)

1. Ve a https://railway.app
2. Selecciona proyecto "Freedumb"
3. Haz clic en "Deploy Now"
4. Espera a que termine
5. Copia tu URL de Railway
6. Actualiza Google Cloud Console con la URL
7. Actualiza ChatGPT GPT con la URL
8. Prueba la autenticación
