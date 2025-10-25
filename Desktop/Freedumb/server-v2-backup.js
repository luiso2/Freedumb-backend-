import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import session from "express-session";
import passport from "./config/passport.js";
import authRoutes from "./routes/auth.js";

dotenv.config();

const app = express();

// ===== Middleware =====
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration for Passport
app.use(
  session({
    secret: process.env.JWT_SECRET || 'your-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production', // true in production (HTTPS)
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// ===== MongoDB Connection =====
const mongoUri = process.env.MONGODB_URI || process.env.RAILWAY_MONGODB_URL;
if (!mongoUri) {
  console.error("❌ ERROR: No se encontró MONGODB_URI. Configura la variable de entorno.");
  process.exit(1);
}

mongoose
  .connect(mongoUri, {
    autoIndex: true,
    serverSelectionTimeoutMS: 5000,
  })
  .then(() => console.log("✅ Conectado a MongoDB exitosamente"))
  .catch((err) => {
    console.error("❌ Error conectando a MongoDB:", err.message);
    process.exit(1);
  });

// ===== Models (Simple Schema for Backward Compatibility) =====
const transactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["gasto", "ingreso"],
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: [0, "El monto no puede ser negativo"]
    },
    card: {
      type: String,
      default: null
    },
    description: {
      type: String,
      default: null
    },
    category: {
      type: String,
      default: null
    },
    date: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

const Transaction = mongoose.model("Transaction", transactionSchema);

// ===== Helper Functions =====
const normalizeAmount = (val) => {
  if (typeof val === "number") return val;
  if (typeof val !== "string") return null;
  const cleaned = val.replace(/\$/g, "").trim().replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

// ===== API Key Authentication =====
const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers["x-api-key"];
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: "API Key inválida o no proporcionada" });
  }
  next();
};

// ===== Routes =====

// Health check (sin autenticación)
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "✅ Finance Agent API activa",
    timestamp: new Date().toISOString(),
    version: "2.0.0",
    endpoints: {
      simple: {
        "POST /transactions": "Crear transacción (compatible con ChatGPT)",
        "GET /transactions": "Listar transacciones (compatible con ChatGPT)",
        "GET /summary": "Resumen financiero (compatible con ChatGPT)",
        "DELETE /transactions/:id": "Eliminar transacción"
      },
      api: {
        "POST /api/auth/login": "Login de usuario",
        "POST /api/auth/register": "Registro de usuario",
        "GET /api/auth/google": "Iniciar OAuth con Google",
        "GET /api/auth/google/callback": "Callback de Google OAuth",
        "POST /api/auth/refresh": "Refrescar token",
        "POST /api/auth/logout": "Logout de usuario",
        "POST /api/transactions": "Crear transacción (nueva API)",
        "GET /api/transactions": "Listar transacciones (nueva API)",
        "GET /api/summary": "Resumen financiero (nueva API)",
        "GET /api/categories": "Gestión de categorías",
        "GET /api/accounts": "Gestión de cuentas"
      }
    }
  });
});

// API Documentation
app.get("/api-docs", (req, res) => {
  res.json({
    name: "Freedumb Finance API",
    version: "2.0.0",
    description: "API para gestión financiera con soporte para ChatGPT Actions",
    authentication: {
      type: "API Key",
      header: "x-api-key",
      value: "Incluir en headers de cada request"
    },
    endpoints: {
      legacy: "Endpoints simples compatibles con ChatGPT (/transactions, /summary)",
      modern: "Endpoints modulares con más funcionalidad (/api/*)"
    }
  });
});

// ===== LEGACY ENDPOINTS (Compatible con ChatGPT Actions) =====

// POST /transactions - Crear transacción (compatible con ChatGPT)
app.post("/transactions", authenticateApiKey, async (req, res) => {
  try {
    let { type, amount, card, description, category, date } = req.body;

    // Validaciones
    if (!type) type = "gasto";
    if (!["gasto", "ingreso"].includes(type)) {
      return res.status(400).json({ error: "type debe ser 'gasto' o 'ingreso'" });
    }

    const normAmount = normalizeAmount(amount);
    if (normAmount === null) {
      return res.status(400).json({ error: "amount inválido o negativo" });
    }

    // Crear payload
    const payload = {
      type,
      amount: normAmount,
      card: card || null,
      description: description || (type === "gasto" ? "Gasto sin descripción" : "Ingreso sin descripción"),
      category: category || null,
      date: date ? new Date(date) : new Date()
    };

    const transaction = await Transaction.create(payload);

    return res.status(201).json({
      message: "Transacción registrada exitosamente",
      data: transaction
    });
  } catch (err) {
    console.error("POST /transactions error:", err);
    return res.status(500).json({
      error: "Error al registrar transacción",
      details: err.message
    });
  }
});

// GET /transactions - Listar transacciones (compatible con ChatGPT)
app.get("/transactions", authenticateApiKey, async (req, res) => {
  try {
    const { type, limit, category } = req.query;

    // Construir filtros
    const query = {};
    if (type && ["gasto", "ingreso"].includes(type)) {
      query.type = type;
    }
    if (category) {
      query.category = category;
    }

    // Limitar resultados (máximo 500)
    const limitNum = Math.min(Math.max(parseInt(limit || "500", 10), 1), 500);

    const transactions = await Transaction
      .find(query)
      .sort({ date: -1 })
      .limit(limitNum);

    return res.json({
      total: transactions.length,
      transactions: transactions.map(t => ({
        _id: t._id.toString(),
        type: t.type,
        amount: t.amount,
        card: t.card,
        description: t.description,
        category: t.category,
        date: t.date.toISOString()
      }))
    });
  } catch (err) {
    console.error("GET /transactions error:", err);
    return res.status(500).json({
      error: "Error al obtener transacciones",
      details: err.message
    });
  }
});

// GET /summary - Resumen financiero (compatible con ChatGPT)
app.get("/summary", authenticateApiKey, async (req, res) => {
  try {
    const transactions = await Transaction.find({});

    const summary = transactions.reduce(
      (acc, t) => {
        if (t.type === "gasto") {
          acc.totalGastos += t.amount;
        } else if (t.type === "ingreso") {
          acc.totalIngresos += t.amount;
        }
        return acc;
      },
      { totalGastos: 0, totalIngresos: 0 }
    );

    summary.balance = summary.totalIngresos - summary.totalGastos;

    // Redondear a 2 decimales
    summary.totalGastos = Number(summary.totalGastos.toFixed(2));
    summary.totalIngresos = Number(summary.totalIngresos.toFixed(2));
    summary.balance = Number(summary.balance.toFixed(2));

    return res.json(summary);
  } catch (err) {
    console.error("GET /summary error:", err);
    return res.status(500).json({
      error: "Error al calcular resumen",
      details: err.message
    });
  }
});

// DELETE /transactions/:id - Eliminar transacción (compatible con ChatGPT)
app.delete("/transactions/:id", authenticateApiKey, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const deleted = await Transaction.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ error: "Transacción no encontrada" });
    }

    return res.json({
      message: "Transacción eliminada exitosamente",
      data: deleted
    });
  } catch (err) {
    console.error("DELETE /transactions/:id error:", err);
    return res.status(500).json({
      error: "Error al eliminar transacción",
      details: err.message
    });
  }
});

// ===== MODERN API ENDPOINTS (/api/*) =====

// Auth routes (login, register, refresh, logout)
app.use("/api/auth", authRoutes);

// TODO: Importar otras rutas modulares cuando estén listas con ES modules

// ===== Server Start =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
  console.log(`📊 Endpoints disponibles:`);
  console.log(`   - GET  /             (healthcheck)`);
  console.log(`   - GET  /api-docs     (documentación)`);
  console.log(`   - POST /transactions (crear - ChatGPT compatible)`);
  console.log(`   - GET  /transactions (listar - ChatGPT compatible)`);
  console.log(`   - GET  /summary      (resumen - ChatGPT compatible)`);
  console.log(`   - DELETE /transactions/:id (eliminar)`);
});
