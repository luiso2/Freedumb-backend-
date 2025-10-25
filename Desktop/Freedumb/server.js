import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();
app.use(cors({
  origin: ['https://chat.openai.com', 'https://chatgpt.com', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ====== ENV REQUERIDAS ======
const {
  MONGODB_URI,
  RAILWAY_MONGODB_URL,
  // Google OAuth (tu app de Google)
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  // Callback en tu backend para recibir Google
  OAUTH_CALLBACK_URL, // ej: https://backend-production-d153.up.railway.app/oauth/callback
  // Credenciales del "cliente" que configuras en ChatGPT Builder (NO son las de Google)
  ACTION_CLIENT_ID,     // inventado por ti, p.ej. "chatgpt-actions"
  ACTION_CLIENT_SECRET, // inventado por ti, p.ej. "chatgpt-actions-secret"
  // Redirect que usa ChatGPT (fijo)
  ACTION_REDIRECT_URI = "https://chat.openai.com/aip/g-oauth/callback",
  // Firma de tus JWT
  JWT_SECRET,
  // Fallback para pruebas/admin
  API_KEY
} = process.env;

// ====== MONGO ======
const mongoUri = MONGODB_URI || RAILWAY_MONGODB_URL;
if (!mongoUri) console.warn("⚠️  Configura MONGODB_URI o RAILWAY_MONGODB_URL");
mongoose.connect(mongoUri, { autoIndex: true })
  .then(() => console.log("✅ MongoDB conectado"))
  .catch(err => console.error("❌ Mongo error:", err));

// ====== MODELOS ======
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

// ====== OAUTH REDIRECT URI ======
// Variable de entorno para el redirect URI de OAuth
const OAUTH_REDIRECT_URI = process.env.OAUTH_REDIRECT_URI || "http://localhost:3000/oauth/callback";

// ====== HELPERS ======
function normalizeAmount(val){
  if (typeof val === "number") return val;
  if (typeof val !== "string") return null;
  const cleaned = val.replace(/\$/g,"").trim().replace(",",".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

// ====== AUTH DE RUTAS PROTEGIDAS ======
async function authHybrid(req, res, next){
  // 1) Bearer de TU sistema (JWT emitido en /oauth/token)
  const auth = req.headers.authorization || "";
  if (auth.startsWith("Bearer ")) {
    const token = auth.slice(7).trim();
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      if (payload?.user?.sub) {
        req.user = { userId: payload.user.sub, email: payload.user.email || null, name: payload.user.name || null };
        return next();
      }
    } catch (e) { /* sigue a x-api-key */ }
  }
  // 2) Fallback x-api-key (admin/POC)
  const key = req.headers["x-api-key"];
  if (key && key === API_KEY) {
    req.user = { userId: "service-admin", email: "service@local" };
    return next();
  }
  return res.status(401).json({ error: "No autorizado (Bearer JWT o x-api-key)" });
}

// ====== HEALTH ======
app.get("/", (_,res)=>res.send("✅ Backend OAuth Provider + Finance API activo"));

// ============================================================
// ===============  OAUTH PARA FRONTEND (WEB/MOBILE)  ========
// ============================================================
// Estas rutas son para que tu frontend web/mobile autentique usuarios
// FLUJO:
// Frontend  -> window.location = "http://backend/auth/google"
// Backend   -> redirige a Google OAuth
// Google    -> vuelve a /auth/google/callback con ?code
// Backend   -> canjea code, obtiene perfil, emite JWT, redirige al frontend con token

// Variable de entorno para la URL del frontend (para redirección post-login)
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// Inicia el flujo de Google OAuth para el frontend
app.get("/auth/google", (req, res) => {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: `${req.protocol}://${req.get('host')}/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    access_type: "online"
  });
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  return res.redirect(302, googleAuthUrl);
});

// Callback de Google OAuth para el frontend
app.get("/auth/google/callback", async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) return res.status(400).send("Falta código de autorización");

    const redirectUri = `${req.protocol}://${req.get('host')}/auth/google/callback`;

    // Intercambia el code por tokens de Google
    const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: "authorization_code"
      })
    });

    if (!tokenResp.ok) {
      const txt = await tokenResp.text();
      console.error("Error obteniendo token de Google:", txt);
      return res.status(500).send("Error en autenticación con Google");
    }

    const tokens = await tokenResp.json();

    // Obtiene información del usuario
    const userInfoResp = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });
    const profile = await userInfoResp.json();

    // Genera JWT para el frontend
    const accessToken = jwt.sign(
      { user: { sub: profile.sub, email: profile.email, name: profile.name, picture: profile.picture } },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    // Redirige al frontend con el token en la URL
    const frontendRedirect = new URL(FRONTEND_URL);
    frontendRedirect.searchParams.set("token", accessToken);
    frontendRedirect.searchParams.set("email", profile.email);
    frontendRedirect.searchParams.set("name", profile.name);

    return res.redirect(302, frontendRedirect.toString());
  } catch (e) {
    console.error("Error en callback de Google:", e);
    return res.status(500).send("Error procesando autenticación");
  }
});
//
// =============  FIN OAUTH PARA FRONTEND  ====================

// ============================================================
// ===============  PROVEEDOR OAUTH PARA CHATGPT  =============
// ============================================================
//
// FLUJO:
// ChatGPT -> GET /oauth/authorize (con client_id, redirect_uri, state)
// Backend  -> redirige a Google OAuth
// Google   -> vuelve a /oauth/callback con ?code
// Backend  -> canjea code en Google, obtiene perfil del usuario
// Backend  -> genera authorization code JWT y redirige a ChatGPT
// ChatGPT  -> POST /oauth/token (grant_type=authorization_code, code)
// Backend  -> valida JWT code y devuelve {access_token, token_type, expires_in}

// 1. GET /oauth/authorize
app.get('/oauth/authorize', (req, res) => {
  const { client_id, redirect_uri, state } = req.query;

  const googleUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${GOOGLE_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(OAUTH_REDIRECT_URI)}` +
    `&response_type=code` +
    `&scope=openid%20email%20profile` +
    `&state=${state}` +
    `&access_type=offline` +
    `&prompt=consent`;

  res.redirect(googleUrl);
});

// 2. GET /oauth/callback
app.get('/oauth/callback', async (req, res) => {
  try {
    const { code, state } = req.query;

    // Intercambiar code de Google por tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: OAUTH_REDIRECT_URI,
        grant_type: 'authorization_code'
      }).toString()
    });

    const googleTokens = await tokenResponse.json();

    // Obtener info del usuario
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${googleTokens.access_token}` }
    });
    const userData = await userResponse.json();

    // Generar authorization code para ChatGPT usando JWT
    const authCode = jwt.sign(
      { userId: userData.id, email: userData.email, name: userData.name, type: 'auth_code' },
      JWT_SECRET,
      { expiresIn: '10m' }
    );

    // Redirigir a ChatGPT con el code
    res.redirect(`https://chat.openai.com/aip/g-acb82384ffd79c2fc2a4454695282554c7439caf/oauth/callback?code=${authCode}&state=${state}`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).json({ error: 'server_error' });
  }
});

// 3. POST /oauth/token
app.post('/oauth/token', (req, res) => {
  try {
    const { code, grant_type } = req.body;

    if (grant_type !== 'authorization_code') {
      return res.status(400).json({ error: 'unsupported_grant_type' });
    }

    // Verificar el authorization code
    const decoded = jwt.verify(code, JWT_SECRET);

    if (decoded.type !== 'auth_code') {
      return res.status(400).json({ error: 'invalid_grant' });
    }

    // Generar access token
    const accessToken = jwt.sign(
      { userId: decoded.userId, email: decoded.email, name: decoded.name, type: 'access' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      scope: 'openid email profile'
    });
  } catch (error) {
    console.error('Token error:', error);
    res.status(400).json({
      error: 'invalid_grant',
      error_description: error.message
    });
  }
});
//
// =================  FIN PROVEEDOR OAUTH  ====================

// ====== RUTAS DE NEGOCIO PROTEGIDAS ======
app.post("/transactions", authHybrid, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "No autorizado" });

    let { type, amount, card, description, categoryId, date } = req.body;

    // acepta "gasto/ingreso" y también "expense/income"
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

    return res.status(201).json({ message: "Transacción registrada", data: tx });
  } catch (e) {
    console.error("POST /transactions error:", e);
    return res.status(500).json({ error: "Error al registrar transacción" });
  }
});

app.get("/transactions", authHybrid, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "No autorizado" });

    const { type, limit } = req.query;
    const q = { userId };
    if (type && ["gasto","ingreso"].includes(String(type).toLowerCase())) q.type = String(type).toLowerCase();

    const lim = Math.min(Math.max(parseInt(limit || "100", 10), 1), 500);
    const txs = await Transaction.find(q).sort({ date: -1 }).limit(lim);

    const totals = txs.reduce((acc, t) => {
      if (t.type === "gasto") acc.gastos += t.amount;
      else acc.ingresos += t.amount;
      return acc;
    }, { gastos: 0, ingresos: 0 });

    return res.json({
      total: txs.length,
      totals: {
        gastos: Number(totals.gastos.toFixed(2)),
        ingresos: Number(totals.ingresos.toFixed(2)),
        balance: Number((totals.ingresos - totals.gastos).toFixed(2))
      },
      transactions: txs.map(t => ({
        date: t.date, type: t.type, amount: t.amount,
        card: t.card || null, description: t.description || null, categoryId: t.categoryId || null
      }))
    });
  } catch (e) {
    console.error("GET /transactions error:", e);
    return res.status(500).json({ error: "Error al obtener transacciones" });
  }
});

// ====== START ======
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server on :${PORT}`));
