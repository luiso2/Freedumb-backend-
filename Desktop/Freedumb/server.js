import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

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

// ====== MEMORIA: AUTH CODES EFÍMEROS PARA EL INTERCAMBIO ======
const authCodeStore = new Map(); // code -> { access_token, scope, expAt }
function makeRandom(n=48){
  const chars="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let s=""; for(let i=0;i<n;i++) s+=chars[Math.floor(Math.random()*chars.length)];
  return s;
}

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
// ChatGPT -> GET /oauth/authorize (con client_id del Action, redirect_uri=chat.openai.com, scope, state)
// Backend  -> redirige a Google OAuth
// Google   -> vuelve a /oauth/callback con ?code
// Backend  -> canjea code en Google, obtiene perfil, emite JWT propio
// Backend  -> genera un "authorization code" efímero y redirige a ChatGPT con ?code=&state=
// ChatGPT  -> POST /oauth/token (grant_type=authorization_code, code, client_id/secret del Action)
// Backend  -> valida code efímero y devuelve {access_token, token_type, expires_in, scope}

app.get("/oauth/authorize", async (req, res) => {
  try {
    const { response_type, client_id, redirect_uri, scope, state } = req.query;

    // Validaciones mínimas de cliente y redirect
    if (response_type !== "code") return res.status(400).send("response_type debe ser 'code'");
    if (client_id !== ACTION_CLIENT_ID) return res.status(401).send("client_id inválido");
    if (redirect_uri !== ACTION_REDIRECT_URI) return res.status(400).send("redirect_uri no permitido");

    // Redirige a Google OAuth
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: OAUTH_CALLBACK_URL,        // callback de TU backend
      response_type: "code",
      scope: scope || "openid email profile",
      access_type: "online",
      include_granted_scopes: "true",
      state: encodeURIComponent(state || "")   // preservamos state de ChatGPT
    });
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    return res.redirect(302, googleAuthUrl);
  } catch (e) {
    console.error("GET /oauth/authorize error:", e);
    return res.status(500).send("OAuth authorize error");
  }
});

// Recibe el code de Google, emite authorization code efímero para ChatGPT
app.get("/oauth/callback", async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code) return res.status(400).send("Falta code");

    // Intercambia code por tokens de Google
    const body = new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: OAUTH_CALLBACK_URL,
      grant_type: "authorization_code"
    });

    const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body
    });
    if (!tokenResp.ok) {
      const txt = await tokenResp.text();
      console.error("Token Google error:", txt);
      return res.status(500).send("Error token Google");
    }
    const tokens = await tokenResp.json(); // {access_token, id_token, ...}

    // Obtiene perfil (USERINFO)
    const uiResp = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });
    const profile = await uiResp.json(); // {sub, email, name, picture,...}

    // Emite TU JWT (30 días) con el sub/email
    const myAccessToken = jwt.sign(
      { user: { sub: profile.sub, email: profile.email, name: profile.name } },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    // Genera authorization code efímero que ChatGPT canjeará en /oauth/token
    const oneTimeCode = makeRandom(48);
    const expAt = Date.now() + 2 * 60 * 1000; // 2 minutos
    authCodeStore.set(oneTimeCode, {
      access_token: myAccessToken,
      scope: "openid email profile",
      expAt
    });

    // Redirige a ChatGPT con code+state original
    const finalRedirect = new URL(ACTION_REDIRECT_URI);
    finalRedirect.searchParams.set("code", oneTimeCode);
    if (state) finalRedirect.searchParams.set("state", state);
    return res.redirect(302, finalRedirect.toString());
  } catch (e) {
    console.error("GET /oauth/callback error:", e);
    return res.status(500).send("OAuth callback error");
  }
});

// Intercambia authorization code efímero por access_token (TU JWT)
app.post("/oauth/token", express.urlencoded({ extended: true }), async (req, res) => {
  try {
    const { grant_type, code, redirect_uri, client_id, client_secret } = req.body;

    if (grant_type !== "authorization_code") {
      return res.status(400).json({ error: "unsupported_grant_type" });
    }
    if (client_id !== ACTION_CLIENT_ID || client_secret !== ACTION_CLIENT_SECRET) {
      return res.status(401).json({ error: "invalid_client" });
    }
    if (redirect_uri !== ACTION_REDIRECT_URI) {
      return res.status(400).json({ error: "invalid_request", error_description: "redirect_uri inválido" });
    }

    const entry = authCodeStore.get(code);
    if (!entry) return res.status(400).json({ error: "invalid_grant" });
    if (Date.now() > entry.expAt) {
      authCodeStore.delete(code);
      return res.status(400).json({ error: "expired_code" });
    }
    // one-time use
    authCodeStore.delete(code);

    return res.json({
      access_token: entry.access_token,
      token_type: "Bearer",
      expires_in: 30 * 24 * 60 * 60, // 30 días
      scope: entry.scope
    });
  } catch (e) {
    console.error("POST /oauth/token error:", e);
    return res.status(500).json({ error: "server_error" });
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
