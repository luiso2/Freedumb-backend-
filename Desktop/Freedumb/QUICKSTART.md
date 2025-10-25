# 🚀 Quick Start Guide

Guía rápida para poner en marcha tu Finance Agent Backend en menos de 5 minutos.

## Inicio Rápido (Local)

```bash
# 1. Instalar dependencias (si aún no lo hiciste)
npm install

# 2. Verificar que .env existe y tiene las credenciales correctas
cat .env

# 3. Iniciar servidor
npm start
```

El servidor estará disponible en `http://localhost:3000`

## Verificar que Funciona

### Test 1: Health Check
```bash
curl http://localhost:3000/
```

Deberías ver:
```json
{"status":"ok","message":"✅ Finance Agent API activa","timestamp":"..."}
```

### Test 2: Registrar una transacción
```bash
curl -X POST http://localhost:3000/transactions \
  -H "x-api-key: freedumb-finance-api-key-2025" \
  -H "Content-Type: application/json" \
  -d '{"type":"gasto","amount":50,"description":"Test"}'
```

### Test 3: Ver resumen
```bash
curl http://localhost:3000/summary \
  -H "x-api-key: freedumb-finance-api-key-2025"
```

## Suite de Tests Completa

Ejecuta el script de tests:

```bash
./TESTS.sh
```

Este script ejecutará todos los tests automáticamente.

## Deploy a Railway

Ver guía completa en [DEPLOYMENT.md](./DEPLOYMENT.md)

Resumen:
```bash
# Con Railway CLI
npm install -g @railway/cli
railway login
railway init
railway variables set MONGODB_URI="tu-mongodb-uri"
railway variables set API_KEY="tu-api-key"
railway up
```

## Configurar ChatGPT

Ver guía completa en [CHATGPT_SETUP.md](./CHATGPT_SETUP.md)

Resumen:
1. Despliega el backend en Railway
2. Obtén la URL pública
3. Actualiza `openapi.yaml` con la URL
4. Crea un Custom GPT en ChatGPT
5. Pega el schema de `openapi.yaml`
6. Configura autenticación con `x-api-key`
7. ¡Listo!

## Estructura del Proyecto

```
Freedumb/
├── server.js              # ⚙️  Servidor principal
├── package.json           # 📦 Dependencias
├── .env                   # 🔐 Variables de entorno (NO subir a git)
├── .env.example           # 📝 Ejemplo de variables
├── openapi.yaml           # 📋 Schema para ChatGPT Actions
├── railway.json           # 🚂 Configuración de Railway
├── .gitignore             # 🚫 Archivos ignorados
├── README.md              # 📖 Documentación principal
├── QUICKSTART.md          # ⚡ Esta guía rápida
├── DEPLOYMENT.md          # 🚂 Guía de deploy
├── CHATGPT_SETUP.md       # 🤖 Guía de ChatGPT
└── TESTS.sh               # 🧪 Suite de tests
```

## Endpoints Disponibles

| Método | Endpoint | Descripción | Requiere API Key |
|--------|----------|-------------|------------------|
| GET | / | Health check | ❌ No |
| POST | /transactions | Crear transacción | ✅ Sí |
| GET | /transactions | Listar transacciones | ✅ Sí |
| GET | /summary | Resumen financiero | ✅ Sí |
| DELETE | /transactions/:id | Eliminar transacción | ✅ Sí |

## Próximos Pasos

1. ✅ Instalar dependencias → `npm install`
2. ✅ Configurar `.env` con credenciales
3. ✅ Probar localmente → `npm start`
4. ✅ Ejecutar tests → `./TESTS.sh`
5. 🚂 Desplegar en Railway → Ver [DEPLOYMENT.md](./DEPLOYMENT.md)
6. 🤖 Configurar ChatGPT → Ver [CHATGPT_SETUP.md](./CHATGPT_SETUP.md)

## Ayuda

- **Problema con MongoDB**: Verifica la `MONGODB_URI` en `.env`
- **API Key no funciona**: Asegúrate de usar el header `x-api-key`
- **Puerto en uso**: Cambia `PORT` en `.env`

## Recursos

- [Documentación completa](./README.md)
- [Deploy a Railway](./DEPLOYMENT.md)
- [Configurar ChatGPT](./CHATGPT_SETUP.md)
- [Railway Docs](https://docs.railway.app)
- [OpenAI Actions](https://platform.openai.com/docs/actions)

---

**¿Listo?** Ejecuta `npm start` y comienza a usar tu Finance Agent Backend! 🎉
