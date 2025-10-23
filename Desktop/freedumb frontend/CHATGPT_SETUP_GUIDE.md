# 🤖 Guía Completa: Configurar ChatGPT con FREEDUMB

## ⚠️ Problema Común: No se puede importar el YAML

ChatGPT puede tener problemas importando archivos YAML directamente. Aquí tienes **3 métodos alternativos** que funcionan:

---

## 📍 Método 1: Usar Versión JSON (Recomendado)

ChatGPT prefiere archivos JSON. Ya creé la versión JSON para ti.

### Pasos:

1. **Ve a ChatGPT** → https://chat.openai.com/gpts
2. Click en **"Create a GPT"**
3. Ve a la pestaña **"Configure"**
4. Baja hasta **"Actions"**
5. Click en **"Create new action"**
6. **IMPORTANTE:** Actualiza primero tu URL de Railway:
   ```
   Abre: /Users/josemichaelhernandezvargas/Desktop/freedumb frontend/chatgpt-openapi-schema.json

   Línea 8: Reemplaza "your-railway-app.up.railway.app" con tu URL real
   ```
7. Copia TODO el contenido de `chatgpt-openapi-schema.json`
8. Pégalo en el campo de schema en ChatGPT
9. Click en **"Save"**

---

## 📍 Método 2: Hostear el Schema en una URL Pública

ChatGPT puede importar desde una URL. Vamos a usar GitHub para esto.

### Pasos:

1. **Crear repositorio para el frontend** (si aún no lo hiciste):
   ```bash
   cd "/Users/josemichaelhernandezvargas/Desktop/freedumb frontend"
   git init
   git add .
   git commit -m "Initial commit: FREEDUMB Frontend"
   git remote add origin https://github.com/luiso2/freedumb-frontend.git
   git push -u origin main
   ```

2. **Activar GitHub Pages:**
   - Ve a tu repo en GitHub
   - Settings → Pages
   - Source: main branch
   - Save

3. **Tu schema estará en:**
   ```
   https://luiso2.github.io/freedumb-frontend/chatgpt-openapi-schema.json
   ```

4. **En ChatGPT Actions:**
   - Click "Import from URL"
   - Pega la URL de arriba
   - ChatGPT importará automáticamente

---

## 📍 Método 3: Configuración Manual (Más Control)

Si ninguno de los anteriores funciona, puedes añadir las actions manualmente una por una.

### Action 1: Guardar Transacción

```json
{
  "name": "saveTransactionFromNaturalLanguage",
  "description": "Guardar transacción desde lenguaje natural",
  "method": "POST",
  "url": "https://your-railway-app.up.railway.app/api/transactions/nlp",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "input": "{{input}}"
  }
}
```

### Action 2: Generar Widget

```json
{
  "name": "generateWidgetUrl",
  "description": "Generar URL de widget interactivo",
  "method": "POST",
  "url": "https://your-railway-app.up.railway.app/api/widget/generate",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "widgetType": "{{widgetType}}",
    "period": "{{period}}",
    "category": "{{category}}"
  }
}
```

### Action 3: Obtener Insights

```json
{
  "name": "getFinancialInsights",
  "description": "Obtener insights financieros con IA",
  "method": "GET",
  "url": "https://your-railway-app.up.railway.app/api/ai/insights?period={{period}}"
}
```

### Action 4: Ver Transacciones

```json
{
  "name": "getTransactions",
  "description": "Obtener transacciones del usuario",
  "method": "GET",
  "url": "https://your-railway-app.up.railway.app/api/transactions?period={{period}}&category={{category}}"
}
```

---

## 🔐 Configurar Autenticación

Después de importar el schema o añadir las actions:

### Paso 1: Obtener un Token JWT

```bash
# Hacer login para obtener token
curl -X POST https://your-railway-app.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tu-email@example.com",
    "password": "tu-password"
  }'

# Respuesta:
# {
#   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "refreshToken": "..."
# }
```

### Paso 2: Configurar en ChatGPT

1. En **Actions**, baja a **"Authentication"**
2. Selecciona **"API Key"**
3. **Authentication Type:** Custom
4. **Custom Header Name:** `Authorization`
5. **Header Value:** `Bearer TU_TOKEN_JWT_AQUI`
   - Reemplaza `TU_TOKEN_JWT_AQUI` con el token que obtuviste arriba
6. Click **"Save"**

---

## 🎯 Configurar el GPT

### Información Básica

**Name:**
```
FREEDUMB - Asistente Financiero IA
```

**Description:**
```
Tu asistente financiero personal con IA. Guarda gastos hablando naturalmente y visualiza tus datos con dashboards interactivos.
```

**Profile Picture:**
- Usa un icono de dinero/finanzas

### Instructions (Prompt del GPT)

```
Eres Eliza, la asistente financiera IA de FREEDUMB.

PERSONALIDAD:
- Amigable y motivadora
- Usa lenguaje claro y simple
- Ayudas a las personas a tomar mejores decisiones financieras
- Eres proactiva en dar consejos

CAPACIDADES PRINCIPALES:

1. GUARDAR TRANSACCIONES
   - Cuando el usuario mencione un gasto o ingreso, usa saveTransactionFromNaturalLanguage
   - Ejemplos:
     • "Gasté $50 en Uber"
     • "Me pagaron $2000 del freelance"
     • "Compré café por $5"
   - Siempre confirma lo que guardaste con emojis amigables

2. MOSTRAR DATOS CON WIDGETS
   - Cuando el usuario pida "ver", "muéstrame", "cómo van", usa generateWidgetUrl
   - SIEMPRE genera el widget y muestra:
     a) El link al dashboard interactivo
     b) Un resumen textual de 2-3 líneas
   - Ejemplos de cuándo generar widgets:
     • "Muéstrame mis gastos"
     • "¿Cómo va mi presupuesto?"
     • "Qué he gastado en comida?"

3. DAR INSIGHTS Y CONSEJOS
   - Usa getFinancialInsights para análisis profundo
   - Da consejos específicos y accionables
   - Identifica patrones de gasto
   - Sugiere oportunidades de ahorro

4. GESTIONAR PRESUPUESTOS
   - Ayuda a crear presupuestos realistas
   - Alerta cuando se está excediendo
   - Celebra cuando se mantienen dentro del límite

FORMATO DE RESPUESTAS:

Al guardar una transacción:
```
✅ ¡Guardado!
• Monto: $XX.XX
• Categoría: [Categoría]
• Comercio: [Nombre]

[Comentario personalizado sobre el gasto]
```

Al generar widgets:
```
📊 Aquí está tu [dashboard/reporte/análisis]:

[Ver Dashboard Interactivo](URL_DEL_WIDGET)

Resumen rápido:
• [Stat 1]
• [Stat 2]
• [Stat 3]
```

Al dar insights:
```
💡 Basándome en tus últimos gastos:

[Insight 1]
[Insight 2]

Mi recomendación:
[Consejo específico]
```

REGLAS IMPORTANTES:
- NUNCA reveles información financiera a menos que el usuario lo pida explícitamente
- Si no entiendes una transacción, pide clarificación
- Usa emojis de forma moderada (1-2 por mensaje)
- Si el usuario pregunta cómo ahorrar, analiza sus datos primero
- Celebra los logros financieros
- Sé empático con los errores o excesos

EJEMPLOS DE CONVERSACIÓN:

Usuario: "Gasté $45 en Starbucks"
Tú:
```
✅ ¡Guardado!
• Monto: $45.00
• Categoría: Comida & Bebidas
• Comercio: Starbucks

Esa es tu 3ra visita a Starbucks esta semana. ¿Quieres ver tu presupuesto de café?
```

Usuario: "Muéstrame cómo van mis gastos"
Tú:
```
📊 Aquí está tu dashboard financiero de este mes:

[Ver Dashboard Interactivo](https://freedumb.app/widget?...)

Resumen rápido:
• Gastos totales: $1,234
• Categoría principal: Comida ($456 - 37%)
• vs mes pasado: +12%

¿Quieres que analice dónde puedes ahorrar?
```

Usuario: "¿En qué puedo ahorrar?"
Tú:
```
💡 Analicé tus gastos y encontré 3 oportunidades:

1. Comida fuera: $456 este mes
   → Cocinando 2 días más ahorrarías ~$120

2. Transporte: $234 en Uber
   → Considera la membresía mensual, ahorras $50

3. Suscripciones: Tienes 5 activas
   → Cancela las que no usas = $30/mes

Total potencial de ahorro: $200/mes

¿Quieres que te ayude a crear un plan de acción?
```
```

### Conversation Starters (Sugerencias de inicio)

Añade estos 4 starters:

1. `💰 Registrar un gasto o ingreso`
2. `📊 Ver mis gastos del mes`
3. `💡 ¿En qué puedo ahorrar?`
4. `📈 ¿Cómo voy con mis presupuestos?`

---

## ✅ Verificación

Después de configurar todo, prueba con estos comandos:

### Test 1: Guardar Transacción
```
Usuario: "Gasté $50 en Uber para ir al aeropuerto"
```

**Esperado:** ChatGPT llama a `saveTransactionFromNaturalLanguage` y confirma

### Test 2: Generar Widget
```
Usuario: "Muéstrame mis gastos del mes"
```

**Esperado:** ChatGPT llama a `generateWidgetUrl` y te da un link

### Test 3: Obtener Insights
```
Usuario: "¿En qué puedo ahorrar?"
```

**Esperado:** ChatGPT llama a `getFinancialInsights` y da recomendaciones

---

## 🐛 Troubleshooting

### Error: "Schema import failed"

**Solución 1:** Usa el archivo JSON en lugar del YAML

**Solución 2:** Verifica que la URL del servidor esté correcta (sin typos)

**Solución 3:** Importa desde URL pública (GitHub Pages) en lugar de copiar/pegar

### Error: "Authentication failed"

**Causa:** Token JWT expirado o inválido

**Solución:**
1. Genera un nuevo token haciendo login
2. Actualiza el token en ChatGPT Actions → Authentication
3. Los tokens duran 7 días, actualízalo regularmente

### Error: "Cannot reach server"

**Causa:** Backend en Railway no está corriendo o CORS bloqueado

**Solución:**
1. Verifica que Railway esté running
2. Checa que CORS incluya `https://chat.openai.com`
3. Prueba el endpoint manualmente con curl primero

### ChatGPT no usa las actions

**Causa:** Instructions no son claras sobre cuándo usar cada action

**Solución:**
- Asegúrate de copiar las instructions completas de arriba
- En las instructions, menciona explícitamente "usa [nombreDelAction] cuando..."
- Dale ejemplos específicos

### Widget muestra "Token expired"

**Causa:** Los tokens del widget duran 1 hora

**Solución:** Normal. Usuario simplemente pide un nuevo link a ChatGPT

---

## 🎉 ¡Listo!

Tu ChatGPT está ahora configurado para:
- ✅ Guardar transacciones en lenguaje natural
- ✅ Generar widgets interactivos
- ✅ Dar insights financieros con IA
- ✅ Gestionar presupuestos

**Siguiente paso:** ¡Pruébalo con tus gastos reales!

---

## 📋 Checklist Final

- [ ] Schema importado (JSON o YAML)
- [ ] Autenticación JWT configurada
- [ ] Instructions del GPT copiadas
- [ ] 4 Conversation Starters añadidos
- [ ] Testeado guardar transacción ✓
- [ ] Testeado generar widget ✓
- [ ] Testeado obtener insights ✓
- [ ] Backend corriendo en Railway
- [ ] Frontend desplegado
- [ ] CORS configurado correctamente

---

**¿Necesitas ayuda?** Revisa FINAL_SETUP.md para más detalles técnicos.
