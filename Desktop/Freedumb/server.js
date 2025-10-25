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
  OAUTH_CALLBACK_URL,              // ej: https://backend-production-d153.up.railway.app/oauth/callback
  ACTION_CLIENT_ID,                // ej: chatgpt-finance-agent
  ACTION_CLIENT_SECRET,            // ej: chatgpt-finance-agent-secret-key-2025
  ACTION_REDIRECT_URI,             // DEBE ser EXACTAMENTE el que te muestra el Builder (en tu caso empieza con https://chat.openai.com/aip/g-.../oauth/callback)
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
const authCodeStore = new Map(); // code -> { access_token, scope, expAt }
const rand = (n=48)=>Array.from({length:n},()=>Math.random().toString(36).slice(2,3)).join("").slice(0,n);
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
  if (response_type !== "code") return res.status(400).send("response_type debe ser 'code'");
  if (client_id !== ACTION_CLIENT_ID) return res.status(401).send("client_id inválido");
  if (redirect_uri !== ACTION_REDIRECT_URI) return res.status(400).send("redirect_uri no permitido");

  // Redirige a Google
  const p = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: OAUTH_CALLBACK_URL,
    response_type: "code",
    scope: scope || "openid email profile",
    access_type: "online",
    include_granted_scopes: "true",
    state: encodeURIComponent(state || "")
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${p.toString()}`);
});

// 2) Google → /oauth/callback
app.get("/oauth/callback", async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code) return res.status(400).send("Falta code");

    // Canjea code por tokens de Google
    const body = new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: OAUTH_CALLBACK_URL,
      grant_type: "authorization_code"
    });
    const tr = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body
    });
    if (!tr.ok) return res.status(500).send("Error token Google");
    const tokens = await tr.json();

    // Perfil
    const ur = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });
    if (!ur.ok) return res.status(500).send("Error userinfo Google");
    const profile = await ur.json(); // {sub,email,name,...}

    // Tu JWT (30 días)
    const myAccessToken = jwt.sign({ user: { sub: profile.sub, email: profile.email, name: profile.name } }, JWT_SECRET, { expiresIn: "30d" });

    // Authorization code efímero para ChatGPT
    const oneTime = rand(48);
    authCodeStore.set(oneTime, { access_token: myAccessToken, scope: "openid email profile", expAt: Date.now() + 2*60*1000 });

    // Redirige a ChatGPT con ?code= y state
    const back = new URL(ACTION_REDIRECT_URI);
    back.searchParams.set("code", oneTime);
    if (state) back.searchParams.set("state", state);
    res.redirect(back.toString());
  } catch (e) {
    console.error(e);
    res.status(500).send("OAuth callback error");
  }
});

// 3) ChatGPT → /oauth/token
app.post("/oauth/token", express.urlencoded({ extended: true }), (req, res) => {
  const { grant_type, code, redirect_uri, client_id, client_secret } = req.body;
  if (grant_type !== "authorization_code") return res.status(400).json({ error: "unsupported_grant_type" });
  if (client_id !== ACTION_CLIENT_ID || client_secret !== ACTION_CLIENT_SECRET) return res.status(401).json({ error: "invalid_client" });
  if (redirect_uri !== ACTION_REDIRECT_URI) return res.status(400).json({ error: "invalid_request", error_description: "redirect_uri inválido" });

  const entry = authCodeStore.get(code);
  if (!entry) return res.status(400).json({ error: "invalid_grant" });
  if (Date.now() > entry.expAt) { authCodeStore.delete(code); return res.status(400).json({ error: "expired_code" }); }
  authCodeStore.delete(code); // one-time use

  res.json({ access_token: entry.access_token, token_type: "Bearer", expires_in: 30*24*60*60, scope: entry.scope });
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
