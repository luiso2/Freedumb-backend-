# 🚂 Cómo Obtener tu URL de Railway

## Opción 1: Desde Railway Dashboard (Más Rápido)

1. **Ve a:** https://railway.app/dashboard
2. **Login** si no lo has hecho
3. **Busca tu proyecto:** "freedumb" o "freedumb-backend"
4. **Click en el proyecto**
5. **Verás la URL** en la parte superior, algo como:
   ```
   freedumb-production-abc123.up.railway.app
   ```
6. **Cópiala completa**

---

## Opción 2: Usando Railway CLI

Si tienes Railway CLI instalado:

```bash
# Navega al directorio del backend
cd /Users/josemichaelhernandezvargas/Desktop/Freedumb

# Obtén la URL
railway status

# O enlaza el proyecto si no está enlazado
railway link
railway status
```

La salida mostrará algo como:
```
Service: freedumb-production
URL: https://freedumb-production-abc123.up.railway.app
Status: Active
```

---

## Opción 3: Si aún NO has desplegado a Railway

Si todavía no has desplegado el backend a Railway:

### Paso 1: Ir a Railway

1. Ve a: https://railway.app/new
2. Click en **"Deploy from GitHub repo"**
3. Selecciona el repositorio: **luiso2/freedumb**
4. Click **"Deploy Now"**

### Paso 2: Esperar el Deploy

Railway tardará 2-3 minutos en:
- Clonar tu repo
- Instalar dependencias (npm install)
- Iniciar el servidor
- Generar una URL pública

### Paso 3: Ver la URL

Una vez completado, verás:
```
┌─────────────────────────────────────┐
│  ✅ Deployment Successful           │
│                                     │
│  Your app is live at:               │
│  freedumb-production-abc123         │
│  .up.railway.app                    │
│                                     │
│  [View Logs] [Settings]             │
└─────────────────────────────────────┘
```

---

## 🎯 URL Completa para ChatGPT

Una vez tengas tu URL de Railway, la URL completa para ChatGPT será:

```
https://[TU-URL-DE-RAILWAY].up.railway.app/api
```

**Ejemplo:**
```
https://freedumb-production-abc123.up.railway.app/api
```

⚠️ **IMPORTANTE:** No olvides el `/api` al final

---

## 📝 Actualizarlo en el Schema

Una vez tengas tu URL:

1. **Abre:** `chatgpt-openapi-simple.json`
2. **Busca línea 8:**
   ```json
   "url": "https://your-railway-app.up.railway.app/api"
   ```
3. **Reemplaza con:**
   ```json
   "url": "https://freedumb-production-abc123.up.railway.app/api"
   ```
   (Usa tu URL real de Railway)
4. **Guarda el archivo**
5. **Ahora sí, importa en ChatGPT**

---

## ✅ Verificar que funciona

Antes de importar a ChatGPT, prueba que tu backend esté funcionando:

```bash
# Reemplaza con tu URL real
curl https://your-railway-url.up.railway.app/health

# Respuesta esperada:
# {
#   "status": "healthy",
#   "timestamp": "2024-10-23T...",
#   "uptime": 123.45
# }
```

Si ves esa respuesta, ¡tu backend está corriendo correctamente!

---

## 🐛 Si no tienes la URL

**¿El proyecto está en Railway pero no ves la URL?**

1. Ve a Railway Dashboard → Tu Proyecto
2. Click en **"Settings"**
3. Sección **"Networking"**
4. Click en **"Generate Domain"**
5. Railway generará una URL automáticamente

**¿No has desplegado aún?**

Ejecuta:
```bash
cd /Users/josemichaelhernandezvargas/Desktop/Freedumb
git push origin master
```

Railway detectará el push y desplegará automáticamente.

---

## 🚀 Después de obtener la URL

1. ✅ Actualiza `chatgpt-openapi-simple.json` con tu URL
2. ✅ Importa el schema en ChatGPT
3. ✅ ¡Prueba tu asistente financiero!

---

**¿Cuál es tu URL de Railway?** Dímela y te ayudo a actualizar todos los archivos.
