# Variables de Entorno para Railway

Configura las siguientes variables de entorno en tu proyecto de Railway:

## Variables Requeridas

### MongoDB
```
MONGODB_URI=mongodb://mongo:vBRkNBqrAMpGaZyacmSmTbDAwKwlaVNO@caboose.proxy.rlwy.net:50648
```

### API Security
```
API_KEY=a11f82a9e99991af3e04c87268513cd48ba812e5227896001cf08e4259393703
```

### JWT Configuration
```
JWT_SECRET=06b5e8831c07c1df542fdd3c5d80d57c27d3bdfe58b0d93824eabea7c947439cc01424ea73a83bea101ce651ac54420b8672e1a87d2048feed8bbc78723a68f6
```

### Google OAuth
```
GOOGLE_CLIENT_ID=TU_GOOGLE_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=TU_GOOGLE_CLIENT_SECRET
```
**Nota:** Obtén estas credenciales de https://console.cloud.google.com/apis/credentials

### Frontend Configuration
```
FRONTEND_URL=https://TU-DOMINIO-FRONTEND.vercel.app
```

### OAuth Provider (ChatGPT Actions)
```
OAUTH_CALLBACK_URL=https://TU-DOMINIO-RAILWAY.up.railway.app/oauth/callback
ACTION_CLIENT_ID=chatgpt-finance-agent
ACTION_CLIENT_SECRET=chatgpt-finance-agent-secret-key-2025
ACTION_REDIRECT_URI=https://chat.openai.com/aip/g-oauth/callback
```

**IMPORTANTE:**
- Reemplaza `TU-DOMINIO-RAILWAY` con el dominio real que te asigne Railway
- Reemplaza `TU-DOMINIO-FRONTEND` con la URL de tu frontend (Vercel, Netlify, etc.)

## Configuración en Railway

1. Ve a tu proyecto en Railway
2. Selecciona tu servicio
3. Ve a la pestaña "Variables"
4. Agrega cada variable con su valor correspondiente
5. Railway reiniciará automáticamente tu servicio

## Verificación

Una vez configuradas las variables, tu backend estará disponible en:
```
https://TU-DOMINIO-RAILWAY.up.railway.app
```

Endpoints disponibles:
- `GET /` - Health check
- `GET /oauth/authorize` - Inicia OAuth flow
- `GET /oauth/callback` - Callback de Google
- `POST /oauth/token` - Intercambio de tokens
- `POST /transactions` - Crear transacción (requiere Bearer token)
- `GET /transactions` - Listar transacciones (requiere Bearer token)

## Actualizar Google OAuth Callbacks

Después del deploy, debes actualizar en Google Cloud Console:
1. Ve a https://console.cloud.google.com/apis/credentials
2. Selecciona tu OAuth 2.0 Client ID
3. En "Authorized redirect URIs", agrega AMBAS URLs:
   ```
   https://TU-DOMINIO-RAILWAY.up.railway.app/auth/google/callback
   https://TU-DOMINIO-RAILWAY.up.railway.app/oauth/callback
   ```
   - La primera es para autenticación del frontend web/mobile
   - La segunda es para ChatGPT Actions

4. En "Authorized JavaScript origins", agrega:
   ```
   https://TU-DOMINIO-RAILWAY.up.railway.app
   ```
5. Guarda los cambios
6. Actualiza las variables en Railway con las URLs correctas

## Rutas Disponibles

### Para Frontend Web/Mobile
- `GET /auth/google` - Inicia OAuth flow para el frontend
- `GET /auth/google/callback` - Callback de Google (redirige al frontend con token)

### Para ChatGPT Actions
- `GET /oauth/authorize` - Inicia OAuth flow para ChatGPT
- `GET /oauth/callback` - Callback de Google para ChatGPT
- `POST /oauth/token` - Intercambio de authorization code por token

### API Protegida
- `POST /transactions` - Crear transacción (requiere Bearer token)
- `GET /transactions` - Listar transacciones (requiere Bearer token)
