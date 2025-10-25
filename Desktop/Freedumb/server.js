// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");

dotenv.config();

// Importar rutas y modelos
const transactionRoutes = require('./routes/transactions');
const { User, initializeDefaultCategories } = require('./models');

const app = express();
app.use(cors());
app.use(express.json());

// ===== ENV =====
const {
  MONGODB_URI, RAILWAY_MONGODB_URL,
  GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
  JWT_SECRET,
  API_KEY
} = process.env;

// ===== DB =====
const mongoUri = MONGODB_URI || RAILWAY_MONGODB_URL;
mongoose.connect(mongoUri, { autoIndex: true })
  .then(() => {
    console.log("✅ MongoDB ok");
    // Inicializar categorías por defecto
    initializeDefaultCategories();
  })
  .catch(e => console.error("❌ Mongo error:", e));

// ===== Modelos están en /models/index.js =====

// ===== Salud =====
app.get("/", (_req,res)=>res.send("✅ OAuth Provider + Finance API activo"));

// ================== PROVEEDOR OAUTH ==================
// Create auth router and mount at /auth
const authRouter = express.Router();

// 1) ChatGPT → /auth/oauth/authorize
authRouter.get("/oauth/authorize", (req, res) => {
  const { response_type, client_id, redirect_uri, scope, state } = req.query;

  console.log(`OAuth authorize request - client_id: ${client_id}, redirect_uri: ${redirect_uri}`);

  // Validate required parameters
  if (!client_id || !redirect_uri || !state) {
    return res.status(400).json({
      error: 'missing_parameters',
      error_description: 'client_id, redirect_uri, and state are required'
    });
  }

  if (response_type !== "code") {
    return res.status(400).json({
      error: 'unsupported_response_type',
      error_description: 'Only code response_type is supported'
    });
  }

  // Validate client_id (debe ser GOOGLE_CLIENT_ID)
  if (client_id !== GOOGLE_CLIENT_ID) {
    console.warn(`Invalid client_id: ${client_id}`);
    return res.status(400).json({
      error: 'invalid_client',
      error_description: 'Invalid client_id'
    });
  }

  // Validate redirect_uri (múltiples URIs de ChatGPT permitidas)
  const validRedirectUris = [
    'https://chat.openai.com/aip/g-acb82384ffd79c2fc2a4454695282554c7439caf/oauth/callback',
    'https://chatgpt.com/aip/g-acb82384ffd79c2fc2a4454695282554c7439caf/oauth/callback',
    // Agrega aquí otras URIs si ChatGPT las usa
  ];

  if (!validRedirectUris.includes(redirect_uri)) {
    console.warn(`Invalid redirect_uri: ${redirect_uri}`);
    return res.status(400).json({
      error: 'invalid_request',
      error_description: 'Invalid redirect_uri'
    });
  }

  // Redirige a Google OAuth (con el redirect_uri DE CHATGPT)
  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleAuthUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
  googleAuthUrl.searchParams.set('redirect_uri', redirect_uri); // ⚠️ USA EL DE CHATGPT
  googleAuthUrl.searchParams.set('response_type', 'code');
  googleAuthUrl.searchParams.set('scope', scope || 'openid email profile');
  googleAuthUrl.searchParams.set('state', state);
  googleAuthUrl.searchParams.set('access_type', 'offline');
  googleAuthUrl.searchParams.set('prompt', 'consent');

  console.log(`Redirecting to Google OAuth: ${googleAuthUrl.toString()}`);
  res.redirect(googleAuthUrl.toString());
});

// 2) ChatGPT → /auth/oauth/token (intercambia code por access token)
authRouter.post("/oauth/token", express.urlencoded({ extended: true }), async (req, res) => {
  try {
    const { grant_type, code, redirect_uri, client_id, client_secret } = req.body;

    console.log(`OAuth token request - grant_type: ${grant_type}, client_id: ${client_id}`);

    // Validate grant_type
    if (grant_type !== "authorization_code") {
      return res.status(400).json({
        error: 'unsupported_grant_type',
        error_description: 'Only authorization_code grant type is supported'
      });
    }

    // Validate client credentials (GOOGLE, no ACTION)
    if (!client_id || !client_secret) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'client_id and client_secret are required'
      });
    }

    if (client_id !== GOOGLE_CLIENT_ID || client_secret !== GOOGLE_CLIENT_SECRET) {
      console.warn(`Invalid client credentials - client_id: ${client_id}`);
      return res.status(401).json({
        error: 'invalid_client',
        error_description: 'Invalid client credentials'
      });
    }

    // Validate code and redirect_uri
    if (!code || !redirect_uri) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'code and redirect_uri are required'
      });
    }

    // Intercambiar code con Google
    const tokenParams = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: redirect_uri
    });

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: tokenParams
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Google token exchange failed:', errorData);
      return res.status(400).json({
        error: 'invalid_grant',
        error_description: 'Invalid authorization code'
      });
    }

    const tokens = await tokenResponse.json();

    if (!tokens.id_token) {
      console.error('No id_token received from Google');
      return res.status(400).json({
        error: 'invalid_grant',
        error_description: 'No id_token received'
      });
    }

    // Obtener perfil de usuario de Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });

    if (!userInfoResponse.ok) {
      console.error('Failed to get user info from Google');
      return res.status(400).json({
        error: 'invalid_grant',
        error_description: 'Failed to get user info'
      });
    }

    const profile = await userInfoResponse.json();

    // Crear o actualizar usuario en la base de datos
    let user = await User.findOne({ googleId: profile.sub });

    if (!user) {
      // Usuario nuevo - crear
      user = await User.create({
        email: profile.email,
        name: profile.name || profile.email,
        googleId: profile.sub,
        picture: profile.picture,
        locale: profile.locale || 'en',
        isActive: true
      });
      console.log('✅ New user created:', user.email);
    } else {
      // Usuario existente - actualizar información
      user.email = profile.email;
      user.name = profile.name || user.name;
      user.picture = profile.picture || user.picture;
      user.locale = profile.locale || user.locale;
      await user.save();
      console.log('✅ Existing user updated:', user.email);
    }

    // Generar JWT access token con userId de MongoDB
    const accessToken = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        user: {
          sub: profile.sub,
          email: profile.email,
          name: profile.name
        },
        iss: 'freedumb-finance',
        aud: 'chatgpt-actions'
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        user: { sub: profile.sub },
        iss: 'freedumb-finance',
        aud: 'chatgpt-actions'
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log(`OAuth token generated for user: ${profile.email}`);

    res.json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: refreshToken,
      scope: 'openid email profile'
    });

  } catch (error) {
    console.error('OAuth token error:', error);
    res.status(500).json({
      error: 'server_error',
      error_description: 'Internal server error'
    });
  }
});

// Mount auth router at /auth
app.use("/auth", authRouter);

// ================== API DE NEGOCIO ==================
// Montar rutas de transacciones con prefijo /api
const API_PREFIX = process.env.API_PREFIX || '/api';
app.use(API_PREFIX, transactionRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server on :${PORT}`));
