# Guía de Integración OAuth para Frontend

Esta guía explica cómo implementar el login con Google OAuth en tu frontend React.

## Rutas OAuth Disponibles

### Backend Local
```
http://localhost:3000/auth/google
```

### Backend en Railway (Producción)
```
https://TU-DOMINIO-RAILWAY.up.railway.app/auth/google
```

## Flujo de Autenticación

1. **Usuario hace clic en "Login with Google"**
2. **Frontend redirige a** `http://localhost:3000/auth/google`
3. **Backend redirige a Google OAuth**
4. **Usuario autoriza en Google**
5. **Google redirige a** `http://localhost:3000/auth/google/callback`
6. **Backend procesa y redirige al frontend con el token:** `http://localhost:5173?token=JWT_TOKEN&email=user@example.com&name=User%20Name`
7. **Frontend captura el token y lo guarda**

## Implementación en React

### 1. Crear el botón de login

```tsx
// components/GoogleLoginButton.tsx
import { FcGoogle } from 'react-icons/fc';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export function GoogleLoginButton() {
  const handleGoogleLogin = () => {
    // Redirige al backend para iniciar OAuth
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  return (
    <button
      onClick={handleGoogleLogin}
      className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
    >
      <FcGoogle className="w-6 h-6" />
      <span className="font-medium text-gray-700">Continue with Google</span>
    </button>
  );
}
```

### 2. Capturar el token en el callback

```tsx
// App.tsx o una página de callback
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export function App() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Captura el token de la URL después del redirect de Google
    const token = searchParams.get('token');
    const email = searchParams.get('email');
    const name = searchParams.get('name');

    if (token && email) {
      // Guarda el token en localStorage
      localStorage.setItem('authToken', token);
      localStorage.setItem('userEmail', email);
      localStorage.setItem('userName', name || '');

      // Limpia la URL y redirige al dashboard
      navigate('/dashboard', { replace: true });
    }
  }, [searchParams, navigate]);

  return (
    // Tu componente
  );
}
```

### 3. Crear un hook personalizado para autenticación

```tsx
// hooks/useAuth.ts
import { useState, useEffect } from 'react';

interface User {
  email: string;
  name: string;
  token: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const email = localStorage.getItem('userEmail');
    const name = localStorage.getItem('userName');

    if (token && email) {
      setUser({ token, email, name: name || '' });
    }
    setIsLoading(false);
  }, []);

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    setUser(null);
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout
  };
}
```

### 4. Proteger rutas privadas

```tsx
// components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
```

### 5. Usar el token en las peticiones API

```tsx
// services/api.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

async function getAuthHeaders() {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
}

export async function getTransactions() {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/transactions`, { headers });

  if (!response.ok) {
    throw new Error('Failed to fetch transactions');
  }

  return response.json();
}

export async function addTransaction(transaction: NewTransaction) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/transactions`, {
    method: 'POST',
    headers,
    body: JSON.stringify(transaction),
  });

  if (!response.ok) {
    throw new Error('Failed to add transaction');
  }

  return response.json();
}
```

## Variables de Entorno

Crea un archivo `.env` en tu frontend:

```env
# Desarrollo Local
VITE_API_BASE_URL=http://localhost:3000

# Producción (Railway)
# VITE_API_BASE_URL=https://TU-DOMINIO-RAILWAY.up.railway.app
```

## Actualizar Google Cloud Console

Para que funcione en desarrollo local, agrega estas URLs en Google Cloud Console:

1. Ve a https://console.cloud.google.com/apis/credentials
2. Selecciona tu OAuth 2.0 Client ID
3. En "Authorized redirect URIs", agrega:
   ```
   http://localhost:3000/auth/google/callback
   https://TU-DOMINIO-RAILWAY.up.railway.app/auth/google/callback
   ```
4. En "Authorized JavaScript origins", agrega:
   ```
   http://localhost:3000
   http://localhost:5173
   https://TU-DOMINIO-RAILWAY.up.railway.app
   https://TU-DOMINIO-FRONTEND.vercel.app
   ```

## Ejemplo Completo de Página de Login

```tsx
// pages/Login.tsx
import { GoogleLoginButton } from '../components/GoogleLoginButton';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';

export function LoginPage() {
  const { isAuthenticated } = useAuth();

  // Si ya está autenticado, redirige al dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            AI Finance Agent
          </h1>
          <p className="mt-2 text-gray-600">
            Sign in to manage your finances
          </p>
        </div>

        <div className="mt-8">
          <GoogleLoginButton />
        </div>
      </div>
    </div>
  );
}
```

## Testing Local

1. **Inicia el backend:**
   ```bash
   cd /Users/josemichaelhernandezvargas/Desktop/Freedumb
   npm start
   ```

2. **Inicia el frontend:**
   ```bash
   cd /Users/josemichaelhernandezvargas/Desktop/ai-finance-agent
   npm run dev
   ```

3. **Prueba el login:**
   - Abre http://localhost:5173
   - Haz clic en "Login with Google"
   - Deberías ser redirigido a Google
   - Después de autorizar, vuelves al frontend con el token

## Manejo de Errores

```tsx
export function GoogleLoginButton() {
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = () => {
    try {
      window.location.href = `${API_BASE_URL}/auth/google`;
    } catch (err) {
      setError('Error al iniciar sesión con Google');
      console.error(err);
    }
  };

  return (
    <div>
      {error && (
        <div className="text-red-600 text-sm mb-2">{error}</div>
      )}
      <button onClick={handleGoogleLogin}>
        Continue with Google
      </button>
    </div>
  );
}
```

## Seguridad

- ✅ El token JWT tiene una duración de 30 días
- ✅ El token se envía en el header `Authorization: Bearer TOKEN`
- ✅ Todas las rutas de API están protegidas con el middleware `authHybrid`
- ✅ El backend valida el JWT en cada request
- ⚠️ En producción, usa HTTPS siempre
- ⚠️ No guardes información sensible en localStorage (solo el token)

## Próximos Pasos

1. ✅ Implementar el botón de login
2. ✅ Capturar el token en el callback
3. ✅ Guardar el token en localStorage
4. ✅ Agregar el token a las peticiones API
5. ✅ Implementar logout
6. ⏳ Agregar refresh token (opcional)
7. ⏳ Implementar manejo de sesión expirada
