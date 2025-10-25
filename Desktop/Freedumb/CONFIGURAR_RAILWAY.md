# 🚀 Configurar Variables de Entorno en Railway

## ⚠️ PROBLEMA ACTUAL

El backend está fallando porque **la URI de MongoDB está incompleta**.

**Error:** `MONGODB_URI=mongodb://mongo:...@tramway.proxy.rlwy.net:45841`
**Correcto:** `MONGODB_URI=mongodb://mongo:...@tramway.proxy.rlwy.net:45841/freedumb`

Le falta `/freedumb` al final (nombre de la base de datos).

---

## 🔧 SOLUCIÓN - Configurar en Railway

### Paso 1: Ve a Railway

1. Abre: https://railway.app/dashboard
2. Selecciona tu proyecto del backend
3. Click en el servicio del backend
4. Ve a la pestaña **"Variables"**

### Paso 2: Agrega/Actualiza estas variables

```env
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://frontend-production-95a0.up.railway.app
MONGODB_URI=mongodb://mongo:GqAApaVYaEnFDkYxJVERSsxYpAmKdMeo@tramway.proxy.rlwy.net:45841/freedumb
JWT_SECRET=24534a4ec8349e8ea295132b4f93a809f7216157a3a696b6d344b9fc91faf80f97a7016f4f50a9048c4d2f519b37191095502e52e71f24950e64744118a5ff03
JWT_REFRESH_SECRET=0ae49569b93d382a68c9bbff366e13368df4aa433279a223406cac13d636618b2c287b5d72a8113eae79cdd0669a9772948ec961d39143967a3d2a384ff2c0bb
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d
```

### Paso 3: IMPORTANTE - MongoDB URI

**La variable más importante es `MONGODB_URI`.**

Asegúrate de copiar EXACTAMENTE esto (con `/freedumb` al final):

```
mongodb://mongo:GqAApaVYaEnFDkYxJVERSsxYpAmKdMeo@tramway.proxy.rlwy.net:45841/freedumb
```

🎯 Nota: El `/freedumb` al final es el nombre de la base de datos. Sin esto, MongoDB no sabe dónde guardar los usuarios.

### Paso 4: Guarda y Redeploy

1. Click en **"Save Changes"** o **"Update Variables"**
2. Railway automáticamente re-desplegará el backend
3. Espera 2-3 minutos

### Paso 5: Verifica que Funcione

```bash
# Test health check
curl https://new-production-cd21.up.railway.app/health

# Test registro
curl -X POST https://new-production-cd21.up.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

Deberías ver una respuesta con `"message": "User registered successfully"` y un token.

---

## 📋 Variables Opcionales (Agregar después)

### OpenAI (para insights de IA)
```env
OPENAI_API_KEY=sk-proj-tu-api-key-real
OPENAI_MODEL=gpt-4-turbo-preview
```

### Encryption (ya incluido arriba)
```env
ENCRYPTION_KEY=5df44cfb5df58ed27b3cce0db152cc4a0466bc160f4c2312856d2402adc88929
ENCRYPTION_IV=6c9b2b1a14c2bf20
```

---

## 🐛 Si Sigue Fallando

### Opción 1: Verificar Conexión MongoDB

En Railway, ve a la pestaña **"Logs"** del servicio backend y busca:

✅ **Bueno:**
```
✅ MongoDB connected successfully
📊 Database: freedumb
```

❌ **Malo:**
```
❌ MongoDB connection error
```

Si ves error de conexión, verifica que:
1. El servicio MongoDB en Railway esté corriendo
2. La URI esté correcta (con `/freedumb`)
3. Las credenciales no hayan cambiado

### Opción 2: Obtener Nueva URI de MongoDB

Si la URI cambió:

1. Ve a tu servicio **MongoDB** en Railway
2. Click en la pestaña **"Variables"**
3. Busca la variable `MONGO_URL` o similar
4. Copia el valor
5. **Agrégale `/freedumb` al final**
6. Pégalo en la variable `MONGODB_URI` del backend

---

## ✅ Checklist

- [ ] MONGODB_URI tiene `/freedumb` al final
- [ ] JWT_SECRET y JWT_REFRESH_SECRET están configurados
- [ ] FRONTEND_URL apunta a tu frontend en Railway
- [ ] Guardaste los cambios en Railway
- [ ] Esperaste 2-3 minutos para el redeploy
- [ ] Probaste el endpoint /health
- [ ] Probaste registrar un usuario

---

## 🎯 Resultado Esperado

Después de configurar correctamente:

```bash
curl -X POST https://new-production-cd21.up.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'
```

Respuesta esperada:
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid-generado",
    "email": "test@example.com",
    "name": "Test User"
  },
  "accessToken": "eyJhbGciOiJI...",
  "refreshToken": "eyJhbGciOiJI..."
}
```

---

## 📞 URLs Importantes

- **Railway Dashboard:** https://railway.app/dashboard
- **Backend Health:** https://new-production-cd21.up.railway.app/health
- **Frontend:** https://frontend-production-95a0.up.railway.app
