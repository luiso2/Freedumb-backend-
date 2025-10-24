# 🔐 FREEDUMB Token Generator Scripts

Scripts para generar tokens JWT Bearer para testing del API.

## 📋 Scripts Disponibles

### 1. `generate-token.js` (Recomendado)
Script completo con output colorido y ejemplos de uso.

```bash
# Generar token con UUID aleatorio
node scripts/generate-token.js

# Generar token para un user ID específico
node scripts/generate-token.js 123e4567-e89b-12d3-a456-426614174000
```

### 2. `quick-token.sh` (Rápido)
Script bash simple que solo imprime el token.

```bash
# Generar y copiar token
./scripts/quick-token.sh

# Generar token para user ID específico
./scripts/quick-token.sh my-user-id-123
```

## 🚀 Uso Rápido

### Con cURL:
```bash
TOKEN=$(node scripts/generate-token.js | grep "Bearer" | tail -1)
curl -H "Authorization: $TOKEN" \
     http://localhost:3000/api/transactions
```

### Con Postman:
1. Ejecuta: `node scripts/generate-token.js`
2. Copia el Bearer token completo
3. En Postman:
   - Tab: Authorization
   - Type: Bearer Token
   - Pega el token

### Con Insomnia:
1. Ejecuta: `node scripts/generate-token.js`
2. Copia el Bearer token completo
3. En Insomnia:
   - Header: `Authorization`
   - Value: Pega el Bearer token completo

## 🔍 Información del Token

Los tokens generados tienen las siguientes características:

- **Algoritmo**: HS256 (HMAC SHA-256)
- **Duración**: 24 horas (para testing)
- **Secret**: Usa el JWT_SECRET del archivo .env
- **Payload**: `{ userId: "uuid-aqui" }`

## 🛠️ Personalización

Para cambiar la duración del token, edita `generate-token.js`:

```javascript
// Cambiar de 24h a otro valor
const accessToken = generateToken(userId, '1h'); // 1 hora
const accessToken = generateToken(userId, '30m'); // 30 minutos
const accessToken = generateToken(userId, '7d'); // 7 días
```

## ⚠️ Importante

- Estos tokens son **solo para desarrollo/testing**
- En producción, los tokens deben generarse vía `/api/auth/login`
- **NO compartas** tokens reales en producción
- Los tokens usan el JWT_SECRET del `.env`

## 📝 Endpoints Protegidos

Estos tokens te permiten acceder a:

- `GET /api/transactions` - Listar transacciones
- `POST /api/transactions` - Crear transacción
- `GET /api/budgets` - Listar presupuestos
- `GET /api/investments` - Listar inversiones
- `GET /api/analytics/dashboard` - Dashboard
- `POST /api/ai/parse-transaction` - NLP parsing
- `GET /api/notifications` - Notificaciones

## 🔄 Refresh Tokens

El script también genera un Refresh Token (válido por 7 días) que puedes usar con:

```bash
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "tu-refresh-token-aqui"
}
```

## 💡 Tips

1. **Guardar token en variable de entorno**:
   ```bash
   export FREEDUMB_TOKEN="Bearer eyJhbGc..."
   curl -H "Authorization: $FREEDUMB_TOKEN" http://localhost:3000/api/transactions
   ```

2. **Alias para generar tokens rápido**:
   ```bash
   # Agregar a ~/.zshrc o ~/.bashrc
   alias ftoken='node ~/Desktop/freedumb/scripts/generate-token.js'
   ```

3. **Verificar token en jwt.io**:
   - Copia el token (sin "Bearer")
   - Visita: https://jwt.io
   - Pega el token para ver el payload decodificado
