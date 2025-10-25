# 📋 Instrucciones para usar openapi.yaml con ChatGPT Actions

## ✅ Schema Optimizado

El archivo `openapi.yaml` ha sido simplificado y optimizado para ChatGPT Actions:

- **Versión**: OpenAPI 3.1.0
- **Operaciones totales**: 4 (menos de 30 ✓)
- **Servers**: 1 URL única ✓
- **Total líneas**: 173

## 🎯 Operaciones Disponibles

1. **createTransaction** (POST /transactions)
   - Registrar gastos e ingresos

2. **getTransactions** (GET /transactions)
   - Listar transacciones con filtros

3. **deleteTransaction** (DELETE /transactions/{id})
   - Eliminar una transacción

4. **getSummary** (GET /summary)
   - Obtener resumen financiero

## 📝 Cómo Usar en ChatGPT

### Paso 1: Actualizar la URL

Edita `openapi.yaml` línea 7:

```yaml
servers:
  - url: https://your-app.railway.app  # ← Cambia esto
```

Reemplaza con tu URL real de Railway, por ejemplo:
```yaml
servers:
  - url: https://freedumb-finance-production.up.railway.app
```

### Paso 2: Copiar el Schema

1. Abre el archivo `openapi.yaml`
2. Copia TODO el contenido (desde `openapi: 3.1.0` hasta el final)

### Paso 3: Crear Custom GPT

1. Ve a ChatGPT → My GPTs → Create a GPT
2. En la pestaña "Configure"
3. Scroll hasta "Actions"
4. Click en "Create new action"
5. Pega el contenido de `openapi.yaml`

### Paso 4: Configurar Autenticación

Después de pegar el schema:

1. En la sección "Authentication"
2. Selecciona: **API Key**
3. Configura:
   - **Auth Type**: Custom
   - **Custom Header Name**: `x-api-key`
4. Click "Add" y pega tu API Key: `freedumb-finance-api-key-2025`

### Paso 5: Configurar el GPT

**Name**: Finance Agent

**Instructions**:
```
Eres un asistente financiero experto. Ayudas a los usuarios a:

1. Registrar gastos e ingresos automáticamente cuando los mencionen
2. Consultar su situación financiera
3. Analizar sus hábitos de gasto

REGLAS:
- Usa createTransaction cuando el usuario mencione un gasto o ingreso
- Usa getSummary para mostrar el balance general
- Usa getTransactions para ver el historial
- Siempre confirma después de registrar una transacción
- Muestra montos en formato de moneda ($XX.XX)

CATEGORÍAS COMUNES:
Gastos: comida, transporte, entretenimiento, salud, vivienda, servicios
Ingresos: salario, freelance, inversiones, otros
```

**Conversation starters**:
```
- Registra un gasto de $50 en gasolina
- ¿Cuál es mi balance actual?
- Muéstrame mis últimos gastos
- Registra un ingreso de $2500 de mi salario
```

## 🧪 Validar el Schema

Puedes validar el schema en: https://editor.swagger.io

1. Ve a Swagger Editor
2. Pega el contenido de `openapi.yaml`
3. Verifica que no haya errores

## ✅ Verificación

El schema ha sido probado y funciona con:

- ✅ Registro de gastos
- ✅ Registro de ingresos
- ✅ Listado de transacciones
- ✅ Resumen financiero
- ✅ Eliminación de transacciones
- ✅ Autenticación con API Key

## 🔧 Si Necesitas Modificar

Para agregar más campos o cambiar comportamiento:

1. Edita `openapi.yaml`
2. Asegúrate de mantener menos de 30 operaciones
3. Valida en Swagger Editor
4. Actualiza el schema en ChatGPT

## 📊 Ejemplo de Uso

```
Usuario: "Gasté $45.50 en gasolina con mi Visa"

GPT ejecuta:
POST /transactions
{
  "type": "gasto",
  "amount": 45.50,
  "card": "Visa",
  "description": "gasolina",
  "category": "transporte"
}

GPT responde: "✅ Registrado: Gasto de $45.50 en gasolina (Transporte)"
```

## 🚨 Importante

Antes de usar en ChatGPT:
1. ✅ Despliega el backend en Railway
2. ✅ Actualiza la URL en `openapi.yaml`
3. ✅ Verifica que la API funcione (usa TESTS.sh)
4. ✅ Copia el schema completo
5. ✅ Configura la autenticación correctamente

---

**¿Todo listo?** Sigue [CHATGPT_SETUP.md](./CHATGPT_SETUP.md) para la guía completa paso a paso.
