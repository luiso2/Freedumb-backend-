# 🤖 Configurar ChatGPT Actions

Guía paso a paso para conectar tu Finance Agent Backend con ChatGPT usando Actions.

## Prerequisitos

- Backend desplegado en Railway con URL pública
- API Key configurada
- Cuenta de ChatGPT Plus o Enterprise

---

## Paso 1: Obtener Información del Backend

Necesitarás:
1. **URL del Backend**: `https://tu-app.railway.app`
2. **API Key**: La que configuraste en Railway (ej: `freedumb-finance-api-key-2025`)

Verifica que el backend funciona:
```bash
curl https://tu-app.railway.app/
```

---

## Paso 2: Actualizar el Schema OpenAPI

1. Abre el archivo `openapi.yaml`
2. Actualiza la URL del servidor:

```yaml
servers:
  - url: https://tu-app-real.railway.app  # ← Cambia esto
    description: Railway Production Server
```

3. Guarda el archivo

---

## Paso 3: Crear Custom GPT

1. Ve a [ChatGPT](https://chat.openai.com)
2. Click en tu nombre (arriba a la derecha)
3. Selecciona "My GPTs"
4. Click en "+ Create a GPT"

---

## Paso 4: Configurar el GPT

### En la pestaña "Create":

**Name**: `Finance Agent`

**Description**:
```
Tu asistente financiero personal. Registra gastos e ingresos, obtén resúmenes de tu situación financiera y recibe insights sobre tus finanzas.
```

**Instructions**:
```
Eres un asistente financiero personal experto. Tu trabajo es ayudar al usuario a:

1. **Registrar transacciones**: Cuando el usuario mencione un gasto o ingreso, usa la acción createTransaction para registrarlo automáticamente.

2. **Consultar información**: Usa las acciones correspondientes para obtener:
   - Lista de transacciones (getTransactions)
   - Resumen financiero (getSummary)

3. **Analizar finanzas**: Proporciona insights útiles basados en los datos del usuario.

**Reglas importantes**:
- Siempre confirma la transacción después de registrarla
- Al mostrar montos, usa formato de moneda (ej: $45.50)
- Sé proactivo en sugerir categorías si el usuario no las especifica
- Proporciona análisis constructivos, nunca juzgues

**Categorías sugeridas**:
- Gastos: comida, transporte, entretenimiento, salud, vivienda, servicios, otros
- Ingresos: salario, freelance, inversiones, otros

**Ejemplos de interacción**:
Usuario: "Gasté $50 en gasolina"
Asistente: [Registra con type=gasto, amount=50, category=transporte, description=gasolina]
           "✅ Registrado: Gasto de $50.00 en gasolina (Transporte)"

Usuario: "¿Cómo van mis finanzas?"
Asistente: [Obtiene resumen]
           "📊 Tu situación financiera:
           - Ingresos totales: $X
           - Gastos totales: $Y
           - Balance: $Z"
```

**Conversation starters** (ejemplos para el usuario):
```
Registra un gasto de $50 en gasolina
¿Cuál es mi balance actual?
Muéstrame mis últimas transacciones
Registra un ingreso de $2000 de mi salario
```

---

## Paso 5: Configurar Actions

### En la pestaña "Configure":

1. Scroll hasta "Actions"
2. Click en "Create new action"

### Importar Schema:

1. Abre tu archivo `openapi.yaml`
2. Copia TODO el contenido
3. Pégalo en el campo "Schema"

**Importante**: El schema debe empezar con:
```yaml
openapi: 3.0.0
info:
  title: Freedumb Finance Agent API
  ...
```

---

## Paso 6: Configurar Authentication

Después de pegar el schema, verás una sección "Authentication":

1. **Authentication Type**: `API Key`
2. **API Key**:
   - Auth Type: `Custom`
   - Custom Header Name: `x-api-key`
3. Click en "Add" o el botón para agregar la key
4. En el campo que aparece, pega tu API Key (ej: `freedumb-finance-api-key-2025`)

---

## Paso 7: Test de Privacy

ChatGPT te pedirá revisar la privacidad:

1. **User data access**: Selecciona lo que aplique
   - "User's financial transaction data"
2. **Link to privacy policy**: (Opcional) Agrega tu política de privacidad si tienes

---

## Paso 8: Guardar y Publicar

1. Click en "Save" (arriba a la derecha)
2. Selecciona el nivel de acceso:
   - **Only me**: Solo tú puedes usarlo (recomendado para empezar)
   - **Anyone with a link**: Cualquiera con el link puede usarlo
   - **Public**: Aparecerá en el GPT Store

---

## Paso 9: Probar el GPT

### Test 1: Registrar un gasto
```
Usuario: "Gasté $45.50 en gasolina con mi Visa"

Esperado:
✅ GPT llama a POST /transactions
✅ Responde confirmando el registro
```

### Test 2: Registrar un ingreso
```
Usuario: "Registra un ingreso de $2500 de mi salario"

Esperado:
✅ GPT llama a POST /transactions con type=ingreso
✅ Confirma el registro
```

### Test 3: Ver resumen
```
Usuario: "¿Cuál es mi balance actual?"

Esperado:
✅ GPT llama a GET /summary
✅ Muestra totalGastos, totalIngresos, balance
```

### Test 4: Listar transacciones
```
Usuario: "Muéstrame mis últimas 5 transacciones"

Esperado:
✅ GPT llama a GET /transactions?limit=5
✅ Muestra las transacciones en formato legible
```

---

## Troubleshooting

### Error: "Action failed to execute"

**Causa**: El backend no responde o hay error de autenticación.

**Solución**:
1. Verifica que el backend esté funcionando: `curl https://tu-app.railway.app/`
2. Revisa que la API Key sea correcta
3. Mira los logs de Railway: `railway logs`

### Error: "Invalid schema"

**Causa**: El schema OpenAPI tiene errores de sintaxis.

**Solución**:
1. Valida el schema en [Swagger Editor](https://editor.swagger.io)
2. Asegúrate de copiar TODO el contenido del archivo
3. Verifica que no haya caracteres especiales corruptos

### Error: "Authentication failed"

**Causa**: La API Key no está configurada correctamente.

**Solución**:
1. En ChatGPT Actions, re-verifica la configuración:
   - Auth Type: `Custom`
   - Header Name: exactamente `x-api-key`
   - Value: tu API Key correcta
2. Prueba la API Key manualmente con curl

### GPT no usa las actions automáticamente

**Causa**: Las instrucciones no son lo suficientemente claras.

**Solución**:
1. Mejora las instrucciones del GPT para ser más específico sobre cuándo usar cada action
2. Usa frases como "SIEMPRE usa la acción X cuando..."

---

## Optimizaciones Avanzadas

### 1. Agregar Conversación Contextual

En las instructions del GPT, agrega:
```
Mantén el contexto de la conversación. Si el usuario dice "y también gasté $20 en café",
registra ambas transacciones automáticamente.
```

### 2. Análisis Inteligente

```
Cuando el usuario pida análisis, proporciona:
- Categoría con más gastos
- Tendencias de gasto
- Sugerencias de ahorro basadas en los datos
```

### 3. Recordatorios Proactivos

```
Si el usuario no ha registrado transacciones en varios días, pregunta amablemente
si hay algo que registrar.
```

---

## Schema OpenAPI Simplificado (Alternativa)

Si ChatGPT tiene problemas con el schema completo, usa esta versión mínima:

```yaml
openapi: 3.0.0
info:
  title: Finance API
  version: "1.0"
servers:
  - url: https://tu-app.railway.app
paths:
  /transactions:
    post:
      summary: Registrar transacción
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                type: {type: string, enum: [gasto, ingreso]}
                amount: {type: number}
                description: {type: string}
                category: {type: string}
      responses:
        '201': {description: OK}
    get:
      summary: Listar transacciones
      parameters:
        - {name: limit, in: query, schema: {type: integer}}
      responses:
        '200': {description: OK}
  /summary:
    get:
      summary: Obtener resumen
      responses:
        '200': {description: OK}
components:
  securitySchemes:
    ApiKeyAuth:
      type: apiKey
      in: header
      name: x-api-key
security:
  - ApiKeyAuth: []
```

---

## ✅ Checklist de Configuración

- [ ] Backend funcionando en Railway
- [ ] URL pública obtenida
- [ ] API Key configurada
- [ ] openapi.yaml actualizado con URL real
- [ ] Custom GPT creado en ChatGPT
- [ ] Schema OpenAPI importado
- [ ] Authentication configurada (x-api-key)
- [ ] API Key agregada a ChatGPT
- [ ] GPT guardado
- [ ] Test básicos realizados:
  - [ ] Registrar gasto
  - [ ] Registrar ingreso
  - [ ] Ver resumen
  - [ ] Listar transacciones

---

## Ejemplo de Conversación Completa

```
Usuario: Hola!
GPT: ¡Hola! Soy tu asistente financiero. Puedo ayudarte a registrar gastos e ingresos,
     ver tu balance, y darte insights sobre tus finanzas. ¿En qué puedo ayudarte?

Usuario: Gasté $50 en gasolina esta mañana con mi Visa
GPT: [Llama a POST /transactions]
     ✅ Perfecto, he registrado tu gasto:
     💸 Gasto: $50.00
     🏷️ Descripción: Gasolina
     💳 Tarjeta: Visa
     📂 Categoría: Transporte

Usuario: ¿Cuánto llevo gastado este mes?
GPT: [Llama a GET /summary]
     📊 Aquí está tu resumen financiero:

     💰 Ingresos totales: $2,500.00
     💸 Gastos totales: $650.00
     ✨ Balance: $1,850.00

     ¡Llevas un buen control de tus finanzas!

Usuario: Muéstrame mis últimos 5 gastos
GPT: [Llama a GET /transactions?type=gasto&limit=5]
     📋 Tus últimos 5 gastos:

     1. $50.00 - Gasolina (Transporte) - Hoy
     2. $35.00 - Almuerzo (Comida) - Ayer
     3. $120.00 - Supermercado (Comida) - 2 días atrás
     ...
```

---

**¡Listo!** Tu Finance Agent está completamente configurado con ChatGPT Actions.

Ahora puedes gestionar tus finanzas conversando naturalmente con ChatGPT. 🎉
