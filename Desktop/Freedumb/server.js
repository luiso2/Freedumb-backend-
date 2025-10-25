// server.js
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

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
  .then(() => console.log("✅ MongoDB ok"))
  .catch(e => console.error("❌ Mongo error:", e));

// ===== Modelos =====
const transactionSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // guardamos Google "sub" como string
  type: { type: String, enum: ["gasto","ingreso"], required: true },
  amount: { type: Number, required: true, min: 0 },
  card: String,
  description: String,
  categoryId: String,
  date: { type: Date, default: Date.now }
}, { timestamps: true });
const Transaction = mongoose.model("Transaction", transactionSchema);

// ===== Helpers =====
const normalizeAmount = v => {
  if (typeof v === "number") return v;
  if (typeof v !== "string") return null;
  const n = Number(v.replace(/\$/g,"").replace(",",".").trim());
  return Number.isFinite(n) ? n : null;
};

// ===== Auth rutas protegidas =====
async function authHybrid(req, res, next){
  // Bearer: tu JWT emitido en /oauth/token
  const auth = req.headers.authorization || "";
  if (auth.startsWith("Bearer ")) {
    try {
      const payload = jwt.verify(auth.slice(7).trim(), JWT_SECRET);
      if (payload?.user?.sub) {
        req.user = { userId: payload.user.sub, email: payload.user.email || null, name: payload.user.name || null };
        return next();
      }
    } catch (_) {}
  }
  // Fallback x-api-key (admin/POC)
  if (req.headers["x-api-key"] === API_KEY) {
    req.user = { userId: "service-admin", email: "service@local" };
    return next();
  }
  return res.status(401).json({ error: "No autorizado (Bearer JWT o x-api-key)" });
}

// ===== Salud =====
app.get("/", (_req,res)=>res.send("✅ OAuth Provider + Finance API activo"));

// ================== PROVEEDOR OAUTH ==================

// 1) ChatGPT → /oauth/authorize
app.get("/oauth/authorize", (req, res) => {
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

// 2) ChatGPT → /oauth/token (intercambia code por access token)
app.post("/oauth/token", express.urlencoded({ extended: true }), async (req, res) => {
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

    // Aquí puedes crear/encontrar usuario en tu DB si lo necesitas
    // const user = await findOrCreateUser(profile);

    // Generar JWT access token
    const accessToken = jwt.sign(
      {
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

// ================== API DE NEGOCIO ==================
app.post("/api/v1/transactions", authHybrid, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "No autorizado" });
    let { type, amount, card, description, categoryId, date } = req.body;

    const map = { expense: "gasto", income: "ingreso" };
    const t = (type || "").toLowerCase();
    type = ["gasto","ingreso"].includes(t) ? t : (map[t] || "gasto");

    const amt = normalizeAmount(amount);
    if (amt === null || amt < 0) return res.status(400).json({ error: "amount inválido" });

    const tx = await Transaction.create({
      userId, type, amount: amt, card: card || undefined,
      description: description || (type === "gasto" ? "Gasto reportado por usuario" : "Ingreso reportado por usuario"),
      categoryId: categoryId || undefined,
      date: date ? new Date(date) : undefined
    });

    res.status(201).json({ message: "Transacción registrada", data: tx });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al registrar transacción" });
  }
});

app.get("/api/v1/transactions", authHybrid, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "No autorizado" });

    const { type, limit } = req.query;
    const q = { userId };
    if (type && ["gasto","ingreso"].includes(String(type).toLowerCase())) q.type = String(type).toLowerCase();

    const lim = Math.min(Math.max(parseInt(limit || "100", 10), 1), 500);
    const txs = await Transaction.find(q).sort({ date: -1 }).limit(lim);

    const totals = txs.reduce((a,t)=> (t.type==="gasto"?(a.gastos+=t.amount):(a.ingresos+=t.amount), a), {gastos:0, ingresos:0});

    res.json({
      total: txs.length,
      totals: { gastos: +totals.gastos.toFixed(2), ingresos: +totals.ingresos.toFixed(2), balance: +(totals.ingresos - totals.gastos).toFixed(2) },
      transactions: txs.map(t => ({ date: t.date, type: t.type, amount: t.amount, card: t.card||null, description: t.description||null, categoryId: t.categoryId||null }))
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al obtener transacciones" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server on :${PORT}`));
