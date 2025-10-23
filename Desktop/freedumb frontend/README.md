# 💰 FREEDUMB Frontend - Dynamic Widget Dashboard

## 📋 Overview

Frontend interactivo y animado para FREEDUMB que se integra con ChatGPT. Genera visualizaciones dinámicas de datos financieros cuando el usuario los solicita a través de conversación.

---

## ✨ Características

### 🎨 Widgets Animados
- **Dashboard completo** con stats en tiempo real
- **Gráficos interactivos** (Chart.js)
- **Transacciones** con animaciones slide-in
- **Presupuestos** con barras de progreso animadas
- **Insights de IA** generados dinámicamente

### 🚀 Tecnologías
- **HTML5/CSS3** - Diseño responsivo moderno
- **Vanilla JavaScript** - No frameworks, carga rápida
- **Chart.js** - Visualizaciones de datos
- **Anime.js** - Animaciones suaves
- **CSS Grid/Flexbox** - Layout adaptativo

### 🤖 Integración ChatGPT
- URLs dinámicas generadas por ChatGPT
- Tokens JWT para autenticación segura
- Actualización automática cada 30 segundos
- Parámetros URL configurables

---

## 🛠️ Instalación Local

```bash
# 1. Clonar o navegar al directorio
cd "freedumb frontend"

# 2. No requiere instalación (Vanilla JS)
# Solo abre index.html en un navegador

# 3. Para desarrollo con servidor local:
# Opción A: Python
python -m http.server 8080

# Opción B: Node.js
npx http-server -p 8080

# 4. Abrir en navegador:
# http://localhost:8080
```

---

## 📦 Estructura de Archivos

```
freedumb frontend/
├── index.html                      # Página principal del widget
├── styles.css                      # Estilos con animaciones
├── app.js                          # Lógica principal
├── chatgpt-openapi-schema.yaml    # Schema para ChatGPT Actions
├── CHATGPT_INTEGRATION.md         # Guía de integración
└── README.md                       # Este archivo
```

---

## 🔗 Uso con ChatGPT

### Paso 1: Usuario guarda datos

```
Usuario → ChatGPT: "Gasté $50 en Uber"
ChatGPT → Backend API: POST /api/transactions/nlp
Backend → DB: Guarda transacción
ChatGPT → Usuario: "✅ Guardado!"
```

### Paso 2: Usuario pide ver datos

```
Usuario → ChatGPT: "Muéstrame mis gastos"
ChatGPT → Backend: POST /api/widget/generate
Backend → ChatGPT: { widgetUrl: "https://..." }
ChatGPT → Usuario: [Link al widget]
```

### Paso 3: Usuario hace click

```
Usuario → Widget URL: https://freedumb.app/widget?user=123&token=xyz
Widget → Backend: GET /api/transactions, /api/budgets, etc.
Backend → Widget: JSON con datos
Widget → Usuario: Dashboard animado e interactivo
```

---

## 🎯 Parámetros URL

El widget acepta estos parámetros en la URL:

```
https://freedumb.app/widget?
  user=123                 # ID del usuario (requerido)
  &token=xyz               # JWT token (requerido)
  &type=dashboard          # Tipo de widget (opcional)
  &period=month            # Período de tiempo (opcional)
  &category=food           # Filtrar por categoría (opcional)
  &theme=dark              # Tema (opcional)
  &animated=true           # Animaciones (opcional)
```

### Tipos de Widget

- `dashboard` - Dashboard completo (default)
- `transactions` - Solo transacciones
- `budgets` - Solo presupuestos
- `insights` - Solo insights de IA
- `category` - Vista de categoría específica

### Períodos

- `day` - Hoy
- `week` - Esta semana
- `month` - Este mes (default)
- `year` - Este año
- `all` - Todo el historial

---

## ⚙️ Configuración

### Conectar al Backend

Edita `app.js` línea 5:

```javascript
const CONFIG = {
    // Cambiar por tu URL de Railway
    API_BASE_URL: 'https://your-app.up.railway.app/api',

    // Para desarrollo local
    // API_BASE_URL: 'http://localhost:3000/api',

    ANIMATION_DURATION: 1000,
    REFRESH_INTERVAL: 30000,
};
```

### Personalizar Estilos

Edita `styles.css` líneas 1-11 (CSS Variables):

```css
:root {
    --primary-color: #667eea;     /* Color principal */
    --secondary-color: #764ba2;   /* Color secundario */
    --success-color: #10b981;     /* Verde (ingresos) */
    --danger-color: #ef4444;      /* Rojo (gastos) */
    /* ... más variables ... */
}
```

---

## 🚀 Deployment

### Opción 1: Vercel (Recomendado)

```bash
# 1. Instalar Vercel CLI
npm i -g vercel

# 2. Deploy
cd "freedumb frontend"
vercel --prod

# 3. Configurar dominio personalizado (opcional)
# En dashboard de Vercel: Settings → Domains
```

### Opción 2: Netlify

```bash
# 1. Instalar Netlify CLI
npm i -g netlify-cli

# 2. Deploy
cd "freedumb frontend"
netlify deploy --prod --dir .

# 3. Configurar dominio
# En dashboard de Netlify: Domain management
```

### Opción 3: GitHub Pages

```bash
# 1. Crear repo en GitHub
# 2. Push archivos
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/tuusuario/freedumb-frontend.git
git push -u origin main

# 3. En GitHub: Settings → Pages
# Source: main branch
# URL: https://tuusuario.github.io/freedumb-frontend
```

### Opción 4: Railway (junto con backend)

```bash
# 1. Crear carpeta public/ en el backend
# 2. Copiar archivos del frontend a public/
# 3. En server.js del backend:

app.use(express.static('public'));

# 4. Deploy backend normal
# Frontend estará en: https://your-app.up.railway.app/
```

---

## 🎨 Personalización Avanzada

### Añadir Nuevo Tipo de Gráfico

1. Edita `app.js`:

```javascript
const renderCustomChart = (data) => {
    const ctx = document.getElementById('customChart');

    new Chart(ctx, {
        type: 'bar', // line, pie, radar, etc.
        data: {
            labels: [...],
            datasets: [...]
        },
        options: {
            // Configuración del gráfico
        }
    });
};
```

2. Añade canvas en `index.html`:

```html
<div class="chart-container">
    <h2>Mi Gráfico Custom</h2>
    <canvas id="customChart"></canvas>
</div>
```

### Añadir Nuevo Widget Type

1. Backend - `widget.routes.js`:

```javascript
if (widgetType === 'custom') {
    widgetUrl.searchParams.set('view', 'custom');
}
```

2. Frontend - `app.js`:

```javascript
const params = new URLSearchParams(window.location.search);
if (params.get('type') === 'custom') {
    // Renderizar vista custom
    renderCustomView();
}
```

---

## 🔧 Troubleshooting

### Error: "No token provided"

**Solución:** Verifica que el URL incluya `?token=xyz` generado por el backend.

### Error: "CORS policy"

**Solución:** Añade el dominio del frontend al backend CORS:

```javascript
// Backend server.js
app.use(cors({
    origin: [
        'https://tu-frontend.vercel.app',
        'http://localhost:8080'
    ]
}));
```

### Gráficos no se muestran

**Solución:** Verifica que Chart.js esté cargado:

```html
<!-- index.html -->
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
```

### Datos no se actualizan

**Solución:**
1. Limpia cache del navegador
2. Verifica el token no haya expirado
3. Checa la consola del navegador (F12)

---

## 📊 Ejemplos de URLs Generadas

### Dashboard Mensual
```
https://freedumb.app/widget?
  user=550e8400-e29b-41d4-a716-446655440000
  &type=dashboard
  &period=month
  &token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Solo Comida del Mes
```
https://freedumb.app/widget?
  user=550e8400-e29b-41d4-a716-446655440000
  &type=category
  &category=food
  &period=month
  &token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Presupuestos
```
https://freedumb.app/widget?
  user=550e8400-e29b-41d4-a716-446655440000
  &type=budgets
  &token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🎯 Performance

### Métricas Objetivo
- **First Contentful Paint:** < 1.5s
- **Time to Interactive:** < 2.5s
- **Total Bundle Size:** < 500KB
- **Lighthouse Score:** 90+

### Optimizaciones Implementadas
- ✅ CSS minificado con variables
- ✅ JavaScript vanilla (sin frameworks)
- ✅ Lazy loading de gráficos
- ✅ Compresión de imágenes
- ✅ Cache de datos (30s)
- ✅ Animaciones GPU-aceleradas

---

## 🔐 Seguridad

### Medidas Implementadas

1. **JWT Tokens:** Autenticación segura
2. **Token Expiration:** 1 hora máximo
3. **HTTPS Only:** En producción
4. **Input Sanitization:** Limpieza de datos
5. **CORS Restringido:** Solo dominios permitidos
6. **No Local Storage:** Tokens solo en URL params

---

## 📱 Responsividad

El widget es completamente responsivo:

- **Desktop:** 1400px+ (Grid completo)
- **Tablet:** 768px-1399px (Grid 2 columnas)
- **Mobile:** <768px (Stack vertical)

Breakpoints configurables en `styles.css` línea 400+.

---

## 🆘 Soporte

### Issues Comunes

1. **"Cannot read property..."** → Datos no llegaron del backend
2. **"Failed to fetch"** → Problema de CORS o backend down
3. **Pantalla en blanco** → Check console (F12) para errores JS

### Debug Mode

Activa modo debug en `app.js`:

```javascript
const DEBUG = true; // Muestra logs detallados en consola
```

---

## 📝 Changelog

### v1.0.0 (2024-10-23)
- ✅ Dashboard interactivo completo
- ✅ Integración ChatGPT
- ✅ Gráficos animados
- ✅ Responsive design
- ✅ Auto-refresh cada 30s
- ✅ OpenAPI schema

---

## 🎉 ¡Listo para Usar!

El frontend está completamente funcional y listo para integrarse con ChatGPT.

**Próximos pasos:**
1. Deploy frontend a Vercel/Netlify
2. Configurar GPT personalizado en ChatGPT
3. Importar OpenAPI schema
4. ¡Comenzar a usar!

---

**Creado con ❤️ para FREEDUMB**
