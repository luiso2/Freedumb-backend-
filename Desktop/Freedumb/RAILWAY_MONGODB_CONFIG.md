# 🚂 FREEDUMB - Railway MongoDB Configuration

## MongoDB Production Connection

Este documento describe la configuración de MongoDB en producción usando Railway.

## 📍 Conexión Actual

**Servidor**: Railway (tramway.proxy.rlwy.net)
**Puerto**: 45841
**Base de datos**: freedumb_logs

## 🔐 Configuración en .env

```bash
# MongoDB - Railway Production
MONGODB_URI=mongodb://mongo:GqAApaVYaEnFDkYxJVERSsxYpAmKdMeo@tramway.proxy.rlwy.net:45841
```

## ✅ Estado de Conexión

- **PostgreSQL**: ⚠️ Warning (role "freedumb_user" no existe)
- **Redis**: ✅ Conectado (localhost:6379)
- **MongoDB**: ✅ Conectado (Railway Production)

## 📊 Uso de MongoDB en FREEDUMB

MongoDB se utiliza para:
- 📝 Logs de aplicación
- 💬 Historial de conversaciones con IA
- 🔍 Datos no estructurados de analytics
- 📈 Eventos y auditoría

## 🔄 Cómo Cambiar la Conexión

1. **Editar `.env`**:
   ```bash
   MONGODB_URI=mongodb://[user]:[password]@[host]:[port]/[database]
   ```

2. **Reiniciar el servidor**:
   ```bash
   pkill -f "node src/server.js"
   npm run dev
   ```

3. **Verificar conexión** en los logs:
   ```
   MongoDB connected successfully
   ✅ MongoDB connected
   ```

## 🛠️ Troubleshooting

### Error: "Unable to connect to MongoDB"
- Verificar que la URL en `.env` sea correcta
- Verificar credenciales (usuario/password)
- Verificar conectividad de red a Railway
- Revisar logs del servidor Railway

### Reiniciar Servidor
```bash
# Opción 1: Con nodemon (automático)
npm run dev

# Opción 2: Producción
npm start
```

## 📝 Notas Importantes

- ⚠️ **NO COMMITEAR** el archivo `.env` a Git
- La conexión está protegida en `.gitignore`
- Para producción, usar variables de entorno del hosting
- Railway maneja las credenciales automáticamente en su plataforma

## 🔗 Enlaces Útiles

- [Railway Dashboard](https://railway.app)
- [MongoDB Docs](https://docs.mongodb.com/)
- [Mongoose Docs](https://mongoosejs.com/)

---

**Última Actualización**: 2024-10-24
**Servidor**: Running on port 3000
**MongoDB Status**: ✅ Connected to Railway
