# Configuración OAuth para ChatGPT Custom GPT

## ✅ Arquitectura Correcta Implementada

Este backend ahora funciona como un **proxy transparente** para Google OAuth, similar a merktop-ai-ok.

### Flujo OAuth:
```
1. ChatGPT → /auth/oauth/authorize
2. Backend valida GOOGLE_CLIENT_ID y redirect_uri
3. Backend redirige a Google OAuth
4. Usuario autoriza en Google
5. Google → ChatGPT con authorization code
6. ChatGPT → /auth/oauth/token con code
7. Backend intercambia code con Google
8. Backend genera JWT para ChatGPT
9. ChatGPT usa JWT para acceder a /api/v1/transactions
```

---

## 🔧 Configuración de ChatGPT GPT Builder

### 1. OAuth Settings

```
Authorization URL: https://backend-production-d153.up.railway.app/auth/oauth/authorize
Token URL: https://backend-production-d153.up.railway.app/auth/oauth/token
Client ID: YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com
Client Secret: YOUR_GOOGLE_CLIENT_SECRET
Scope: openid email profile
Token Exchange Method: Default (POST request)
```

**IMPORTANTE**: Debes usar tus credenciales de GOOGLE, NO credenciales inventadas.

---

## 📋 Variables de Entorno Requeridas en Railway

```bash
# MongoDB
MONGODB_URI=mongodb://mongo:vBRkNBqrAMpGaZyacmSmTbDAwKwlaVNO@caboose.proxy.rlwy.net:50648

# API Security
API_KEY=a11f82a9e99991af3e04c87268513cd48ba812e5227896001cf08e4259393703
JWT_SECRET=06b5e8831c07c1df542fdd3c5d80d57c27d3bdfe58b0d93824eabea7c947439cc01424ea73a83bea101ce651ac54420b8672e1a87d2048feed8bbc78723a68f6

# Google OAuth
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
```

---

## 🚀 Endpoints Disponibles

### OAuth Endpoints (Públicos)
- `GET /auth/oauth/authorize` - Inicia flujo OAuth
- `POST /auth/oauth/token` - Intercambia código por token

### API Endpoints (Requieren Bearer JWT)
- `POST /api/v1/transactions` - Crear transacción
- `GET /api/v1/transactions` - Obtener transacciones

### Health Check
- `GET /` - Verifica que el servidor esté activo

---

## 🔑 Autenticación en API

Las rutas de API requieren el JWT generado por OAuth:

```bash
curl -X GET https://backend-production-d153.up.railway.app/api/v1/transactions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## ✅ Validaciones Implementadas

### /auth/oauth/authorize
- Valida `client_id` contra `GOOGLE_CLIENT_ID`
- Valida `redirect_uri` contra lista de URIs de ChatGPT permitidas
- Redirige a Google con `redirect_uri` de ChatGPT

### /auth/oauth/token
- Valida credenciales de GOOGLE (no credenciales inventadas)
- Intercambia `code` con Google
- Obtiene perfil de usuario
- Genera JWT con expiración de 1 hora
- Genera refresh token con expiración de 7 días

---

## 📝 Google Cloud Console - URIs Autorizadas

Asegúrate de agregar en Google Cloud Console:

**Authorized redirect URIs:**
```
https://chat.openai.com/aip/g-acb82384ffd79c2fc2a4454695282554c7439caf/oauth/callback
https://chatgpt.com/aip/g-acb82384ffd79c2fc2a4454695282554c7439caf/oauth/callback
```

**Nota**: El GPT ID puede cambiar. Verifica en el error 400 qué redirect_uri usa ChatGPT y agrégalo a la lista.

---

## 🐛 Troubleshooting

### Error 400: "Invalid client_id"
**Causa**: ChatGPT está enviando un client_id diferente al GOOGLE_CLIENT_ID
**Solución**: Verifica que uses el GOOGLE_CLIENT_ID correcto en ChatGPT Builder

### Error 400: "Invalid redirect_uri"
**Causa**: La redirect_uri de ChatGPT no está en la lista de URIs permitidas
**Solución**: Agrega la URI a `validRedirectUris` en `/auth/oauth/authorize` en server.js

### Error 401: "Invalid client credentials"
**Causa**: client_secret incorrecto en ChatGPT Builder
**Solución**: Verifica que uses el GOOGLE_CLIENT_SECRET correcto

### Error 400: "Invalid authorization code"
**Causa**: El código de autorización expiró o es inválido
**Solución**: Intenta autenticarte de nuevo

---

## ✨ Diferencias con Implementación Anterior

### ❌ ANTES (Incorrecto):
- Usaba credenciales inventadas (ACTION_CLIENT_ID/SECRET)
- Backend actuaba como OAuth Provider intermedio
- Requería callback intermedio en backend
- ChatGPT no podía autenticar correctamente

### ✅ AHORA (Correcto):
- Usa credenciales de GOOGLE directamente
- Backend actúa como proxy transparente
- Google redirige directamente a ChatGPT
- Arquitectura idéntica a merktop-ai-ok (funciona)

---

## 📞 Soporte

Si hay problemas, verifica los logs en Railway:
```bash
railway logs --follow
```

Busca mensajes como:
- `OAuth authorize request - client_id: ...`
- `OAuth token request - grant_type: ...`
- `OAuth token generated for user: ...`
