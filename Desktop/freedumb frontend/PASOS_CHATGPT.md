# 🎯 Configurar ChatGPT - Paso a Paso Visual

## 📌 Importante: Tienes 3 archivos de schema para elegir

1. **`chatgpt-openapi-simple.json`** ← **EMPIEZA CON ESTE** (más fácil de importar)
2. **`chatgpt-openapi-schema.json`** ← Versión completa JSON
3. **`chatgpt-openapi-schema.yaml`** ← Versión completa YAML

---

## 🚀 PASO 1: Abrir ChatGPT GPTs

1. Ve a: **https://chat.openai.com/gpts**
2. Click en el botón verde **"Create a GPT"**

```
┌─────────────────────────────────────┐
│  My GPTs                     [+]    │
├─────────────────────────────────────┤
│                                     │
│     [Create a GPT]  ← CLICK AQUÍ   │
│                                     │
└─────────────────────────────────────┘
```

---

## 🚀 PASO 2: Ir a Configure

Verás 2 pestañas arriba:
- **Create** (chatbot de configuración)
- **Configure** ← **CLICK AQUÍ**

```
┌─────────────────────────────────────┐
│  [Create]  [Configure] ← CLICK      │
├─────────────────────────────────────┤
│                                     │
│  Name: _______________________      │
│  Description: _________________     │
│  Instructions: _________________    │
│                                     │
└─────────────────────────────────────┘
```

---

## 🚀 PASO 3: Configuración Básica

Llena estos campos:

### Name:
```
FREEDUMB - Asistente Financiero
```

### Description:
```
Tu asistente financiero personal con IA. Guarda gastos hablando naturalmente y visualiza tus datos con dashboards interactivos.
```

### Instructions:
**COPIA TODO ESTO** (está en CHATGPT_SETUP_GUIDE.md, sección "Instructions")

```
Eres Eliza, la asistente financiera IA de FREEDUMB.

CAPACIDADES PRINCIPALES:

1. GUARDAR TRANSACCIONES
   - Cuando el usuario mencione un gasto, usa saveTransaction
   - Confirma siempre lo que guardaste

2. MOSTRAR DATOS CON WIDGETS
   - Cuando el usuario pida "ver", usa generateWidget
   - Muestra el link y un resumen textual

[... copia el resto de CHATGPT_SETUP_GUIDE.md ...]
```

---

## 🚀 PASO 4: Añadir Actions (AQUÍ ES LO IMPORTANTE)

Baja hasta la sección **"Actions"**

```
┌─────────────────────────────────────┐
│  Actions                            │
│                                     │
│  [Create new action]  ← CLICK       │
└─────────────────────────────────────┘
```

---

## 🚀 PASO 5: Importar el Schema

Ahora tienes 2 opciones:

### OPCIÓN A: Pegar directamente (Recomendado)

1. Abre el archivo: **`chatgpt-openapi-simple.json`**
2. **IMPORTANTE:** Primero cambia la línea 8:
   ```json
   "url": "https://your-railway-app.up.railway.app/api"
   ```
   Por tu URL real de Railway:
   ```json
   "url": "https://freedumb-production-abc123.up.railway.app/api"
   ```
3. Copia TODO el contenido del archivo
4. En ChatGPT, verás un campo grande que dice **"Schema"**
5. Pega todo el JSON ahí
6. Click **"Save"** abajo

```
┌─────────────────────────────────────┐
│  Schema                             │
│  ┌─────────────────────────────┐   │
│  │ {                           │   │
│  │   "openapi": "3.0.0",      │   │
│  │   "info": { ... }          │   │
│  │ }                           │   │
│  └─────────────────────────────┘   │
│                                     │
│           [Save]  ← CLICK           │
└─────────────────────────────────────┘
```

### OPCIÓN B: Importar desde URL (Si ya desplegaste el frontend)

Si ya subiste el frontend a GitHub Pages o Vercel:

1. Click **"Import from URL"**
2. Pega la URL de tu schema:
   ```
   https://luiso2.github.io/freedumb-frontend/chatgpt-openapi-simple.json
   ```
   o
   ```
   https://your-frontend.vercel.app/chatgpt-openapi-simple.json
   ```
3. Click **"Import"**
4. ChatGPT cargará todo automáticamente

---

## 🚀 PASO 6: Configurar Autenticación

Después de importar el schema, baja a la sección **"Authentication"**

```
┌─────────────────────────────────────┐
│  Authentication                     │
│                                     │
│  ⦿ None                             │
│  ○ API Key         ← SELECCIONA    │
│  ○ OAuth                            │
└─────────────────────────────────────┘
```

1. Selecciona **"API Key"**

2. Verás nuevos campos:

```
┌─────────────────────────────────────┐
│  Auth Type: [API Key ▼]            │
│                                     │
│  API Key: [Custom ▼]                │
│                                     │
│  Custom Header Name:                │
│  ┌─────────────────────────────┐   │
│  │ Authorization               │   │
│  └─────────────────────────────┘   │
│                                     │
│  Custom Header Value:               │
│  ┌─────────────────────────────┐   │
│  │ Bearer eyJhbGc...          │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

3. **Custom Header Name:** `Authorization`

4. **Custom Header Value:** `Bearer TU_TOKEN_AQUI`
   - Reemplaza `TU_TOKEN_AQUI` con tu token JWT real
   - Lo obtienes haciendo login (ver abajo)

---

## 🔑 CÓMO OBTENER EL TOKEN JWT

Abre tu terminal y ejecuta:

```bash
# Reemplaza con tu URL de Railway y tus credenciales reales
curl -X POST https://your-railway-app.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tu-email@example.com",
    "password": "tu-password"
  }'
```

**Respuesta:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMiLCJpYXQiOjE2OTk...",
  "user": { ... }
}
```

Copia el valor de `token` y úsalo así:
```
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMiLCJpYXQiOjE2OTk...
```

---

## 🚀 PASO 7: Configurar Conversation Starters

Baja a la sección **"Conversation starters"**

Añade estos 4:

1. 💰 Registrar un gasto o ingreso
2. 📊 Ver mis gastos del mes
3. 💡 ¿En qué puedo ahorrar?
4. 📈 ¿Cómo voy con mis presupuestos?

```
┌─────────────────────────────────────┐
│  Conversation starters              │
│  ┌─────────────────────────────┐   │
│  │ 💰 Registrar un gasto      │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ 📊 Ver mis gastos del mes  │   │
│  └─────────────────────────────┘   │
│  [+ Add another]                    │
└─────────────────────────────────────┘
```

---

## 🚀 PASO 8: Guardar y Publicar

1. Click en **"Save"** arriba a la derecha
2. Elige la privacidad:
   - **"Only me"** ← Para uso personal (recomendado)
   - **"Anyone with a link"** ← Para compartir con familia
   - **"Public"** ← Para publicar en la tienda de GPTs

```
┌─────────────────────────────────────┐
│  How would you like to publish?     │
│                                     │
│  ⦿ Only me         ← RECOMENDADO   │
│  ○ Anyone with a link               │
│  ○ Public                           │
│                                     │
│           [Confirm]                 │
└─────────────────────────────────────┘
```

---

## ✅ PASO 9: Probar

1. Click en tu GPT recién creado
2. Prueba estos comandos:

### Test 1: Guardar transacción
```
Gasté $50 en Uber para ir al trabajo
```

**Esperado:** ChatGPT confirma que guardó la transacción

### Test 2: Generar widget
```
Muéstrame mis gastos del mes
```

**Esperado:** ChatGPT te da un link como:
```
📊 Aquí está tu dashboard financiero:

[Ver Dashboard Interactivo](https://freedumb.app/widget?user=123&token=xyz)

Resumen:
• Gastos: $1,234
• Ingresos: $3,000
• Balance: +$1,766
```

### Test 3: Click en el link
- Haz click en el link generado
- Deberías ver el dashboard animado con tus datos

---

## 🐛 Si algo no funciona

### Error: "Schema is invalid"

**Solución:**
1. Usa `chatgpt-openapi-simple.json` en lugar del completo
2. Verifica que cambiaste la URL del servidor (línea 8)
3. Asegúrate de copiar TODO el JSON (desde `{` hasta `}`)

### Error: "Action failed to execute"

**Solución:**
1. Verifica que tu backend en Railway está corriendo
2. Checa que el token JWT sea válido (no expirado)
3. Prueba el endpoint manualmente con curl primero

### ChatGPT dice "I cannot do that"

**Solución:**
1. Las instructions no son claras
2. Copia las instructions completas de CHATGPT_SETUP_GUIDE.md
3. En las instructions, menciona explícitamente cuándo usar cada action

### Token expirado

**Solución:**
1. Los tokens JWT expiran después de 7 días
2. Genera un nuevo token haciendo login otra vez
3. Actualiza en ChatGPT → Configure → Actions → Authentication

---

## 📋 Checklist Final

Marca cada uno cuando lo completes:

- [ ] Creé el GPT en ChatGPT
- [ ] Copié Name y Description
- [ ] Copié las Instructions completas
- [ ] Importé el schema (simple.json)
- [ ] Actualicé la URL del servidor en el schema
- [ ] Configuré Authentication con mi token JWT
- [ ] Añadí los 4 Conversation Starters
- [ ] Guardé y publiqué
- [ ] Probé guardar una transacción ✓
- [ ] Probé generar un widget ✓
- [ ] Hice click en el widget y se cargó ✓

---

## 🎉 ¡Listo!

Tu ChatGPT está configurado. Ahora puedes:

1. Hablar naturalmente para guardar gastos
2. Pedir ver tus datos con visualizaciones interactivas
3. Obtener insights y recomendaciones personalizadas

**Ejemplo de conversación:**

```
Tú: "Gasté $45 en Starbucks esta mañana"

ChatGPT: ✅ ¡Guardado!
• Monto: $45.00
• Categoría: Comida & Bebidas
• Comercio: Starbucks
• Fecha: Hoy

Ese es tu tercer café de la semana. ¿Quieres ver tu presupuesto de comida?

Tú: "Sí, muéstramelo"

ChatGPT: 📊 Aquí está tu presupuesto de comida:

[Ver Dashboard Interactivo](https://freedumb.app/widget?...)

Resumen:
• Límite mensual: $500
• Gastado: $234 (47%)
• Restante: $266

¡Vas muy bien! Aún tienes $266 disponibles para el resto del mes.
```

---

**¿Tienes dudas?** Revisa CHATGPT_SETUP_GUIDE.md para más detalles.
