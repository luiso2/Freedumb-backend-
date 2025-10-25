# 🚀 Guía Rápida de Deployment a Railway

## ✅ Cambios Realizados

Se ha actualizado la configuración de CORS en el backend para permitir requests desde:
- `https://frontend-production-95a0.up.railway.app` (tu frontend)
- `http://localhost:3000` y `http://localhost:3001` (desarrollo local)
- `http://localhost:5500` (Live Server)

## 📦 Deployment del Backend a Railway

### Opción 1: Via GitHub (Recomendado)

```bash
# 1. Ve al directorio del backend
cd "/Users/josemichaelhernandezvargas/Desktop/Freedumb"

# 2. Verifica que Git esté inicializado
git status

# 3. Si NO está inicializado, ejecuta:
git init
git add .
git commit -m "Initial commit: Backend with CORS configured"

# 4. Ve a GitHub y crea un nuevo repositorio llamado "freedumb-backend"

# 5. Conecta tu repositorio local con GitHub
git remote add origin https://github.com/TU_USUARIO/freedumb-backend.git
git branch -M main
git push -u origin main

# 6. Ve a Railway (https://railway.app)
#    - Click en "New Project"
#    - Selecciona "Deploy from GitHub repo"
#    - Elige tu repositorio "freedumb-backend"
#    - Railway detectará automáticamente que es un proyecto Node.js
```

### Opción 2: Via Railway CLI

```bash
# 1. Instala Railway CLI
npm install -g @railway/cli

# 2. Inicia sesión
railway login

# 3. Ve al directorio del backend
cd "/Users/josemichaelhernandezvargas/Desktop/Freedumb"

# 4. Inicializa proyecto Railway
railway init

# 5. Despliega
railway up

# 6. Obtén la URL del backend
railway domain
```

## ⚙️ Variables de Entorno en Railway

Ve a tu proyecto en Railway → **Variables** y agrega:

### Obligatorias:
```env
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://frontend-production-95a0.up.railway.app
```

### JWT (usa claves seguras):
```env
JWT_SECRET=genera-una-clave-super-segura-de-256-bits-aqui
JWT_REFRESH_SECRET=otra-clave-super-segura-diferente
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d
```

### OpenAI (si tienes API key):
```env
OPENAI_API_KEY=sk-proj-TU-API-KEY-AQUI
OPENAI_MODEL=gpt-4-turbo-preview
```

## 🗄️ Bases de Datos en Railway

El backend necesita 3 bases de datos. En Railway:

### 1. PostgreSQL
- Click en "+ New" → "Database" → "PostgreSQL"
- Railway creará automáticamente la variable `DATABASE_URL`

### 2. Redis
- Click en "+ New" → "Database" → "Redis"
- Railway creará automáticamente la variable `REDIS_URL`

### 3. MongoDB
**Opción A: MongoDB Atlas (Recomendado para producción)**
```bash
# 1. Ve a https://www.mongodb.com/cloud/atlas
# 2. Crea una cuenta gratis
# 3. Crea un cluster
# 4. Obtén la connection string
# 5. Agrégala en Railway como:
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/freedumb_logs
```

**Opción B: Railway MongoDB**
- Click en "+ New" → "Database" → "MongoDB"
- Railway creará la variable `MONGO_URL`

## 🔒 Generar Claves Seguras

Para generar claves JWT seguras, ejecuta en terminal:

```bash
# Genera JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Genera JWT_REFRESH_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## ✅ Verificar Deployment

Después de desplegar, verifica:

```bash
# 1. Verifica que el servidor esté corriendo
curl https://new-production-cd21.up.railway.app/health

# Deberías ver algo como:
# {"status":"healthy","timestamp":"...","uptime":123}

# 2. Verifica la documentación API
# Abre en navegador: https://new-production-cd21.up.railway.app/api-docs
```

## 🐛 Problemas Comunes

### Error: "Cannot find module 'X'"
- Asegúrate de que `package.json` tenga todas las dependencias
- En Railway, ve a Settings → Restart App

### Error: "Database connection failed"
- Verifica que las variables de entorno estén configuradas
- Verifica que los servicios de DB estén corriendo en Railway

### Error CORS
- Verifica que `FRONTEND_URL` esté configurada correctamente
- El código ya incluye la URL del frontend en CORS

## 📝 Próximos Pasos

1. ✅ Despliega el backend siguiendo esta guía
2. ✅ Configura las variables de entorno
3. ✅ Agrega las bases de datos
4. ✅ Verifica que el `/health` endpoint responda
5. ✅ El frontend ya está configurado para conectarse al backend
6. ✅ Prueba la aplicación abriendo el frontend en Railway

## 🔗 URLs Importantes

- **Backend**: https://new-production-cd21.up.railway.app
- **Frontend**: https://frontend-production-95a0.up.railway.app
- **Railway Dashboard**: https://railway.app/dashboard
- **API Docs** (después de desplegar): https://new-production-cd21.up.railway.app/api-docs
