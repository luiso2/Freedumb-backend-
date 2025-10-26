const mongoose = require('mongoose');

// ============================================
// MODELO DE TRANSACCIÓN
// ============================================
const transactionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: ['expense', 'income']
  },
  amount: {
    type: Number,
    required: true,
    min: 0.01
  },
  description: {
    type: String,
    default: ''
  },
  categoryId: {
    type: String,
    default: null
  },
  date: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, type: 1 });
transactionSchema.index({ userId: 1, categoryId: 1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

// ============================================
// MODELO DE CATEGORÍA
// ============================================
const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['expense', 'income']
  },
  icon: {
    type: String,
    default: '📝'
  },
  color: {
    type: String,
    default: '#6366f1'
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Índice único compuesto para prevenir duplicados
categorySchema.index({ name: 1, type: 1 }, { unique: true });

const Category = mongoose.model('Category', categorySchema);

// ============================================
// MODELO DE CUENTA
// ============================================
const accountSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['bank', 'credit', 'cash', 'investment']
  },
  balance: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Account = mongoose.model('Account', accountSchema);

// ============================================
// MODELO DE USUARIO
// ============================================
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  picture: {
    type: String
  },
  locale: {
    type: String,
    default: 'en'
  },
  currency: {
    type: String,
    default: 'USD'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);

// ============================================
// MODELO DE SESIÓN (Para tracking de sesiones activas)
// ============================================
const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  deviceInfo: {
    userAgent: String,
    ip: String,
    platform: String
  },
  expiresAt: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Índice compuesto para búsquedas eficientes
sessionSchema.index({ userId: 1, isActive: 1 });
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-delete expired sessions

const Session = mongoose.model('Session', sessionSchema);

// ============================================
// INICIALIZAR CATEGORÍAS POR DEFECTO
// ============================================
async function initializeDefaultCategories() {
  try {
    const count = await Category.countDocuments();
    if (count > 0) {
      console.log('📂 Categories already initialized');
      return;
    }

    const defaultCategories = [
      // Categorías de Gastos
      { name: 'transporte', type: 'expense', icon: '🚗', color: '#ef4444', isDefault: true },
      { name: 'comida', type: 'expense', icon: '🍔', color: '#f97316', isDefault: true },
      { name: 'servicios', type: 'expense', icon: '💡', color: '#eab308', isDefault: true },
      { name: 'entretenimiento', type: 'expense', icon: '🎬', color: '#ec4899', isDefault: true },
      { name: 'salud', type: 'expense', icon: '⚕️', color: '#06b6d4', isDefault: true },
      { name: 'educacion', type: 'expense', icon: '📚', color: '#8b5cf6', isDefault: true },
      { name: 'compras', type: 'expense', icon: '🛍️', color: '#d946ef', isDefault: true },
      { name: 'otros', type: 'expense', icon: '📝', color: '#6b7280', isDefault: true },
      
      // Categorías de Ingresos
      { name: 'salario', type: 'income', icon: '💼', color: '#10b981', isDefault: true },
      { name: 'freelance', type: 'income', icon: '💻', color: '#059669', isDefault: true },
      { name: 'inversiones', type: 'income', icon: '📈', color: '#84cc16', isDefault: true },
      { name: 'otros-ingresos', type: 'income', icon: '💰', color: '#22c55e', isDefault: true }
    ];

    await Category.insertMany(defaultCategories);
    console.log('✅ Default categories created');
  } catch (error) {
    console.error('❌ Error initializing categories:', error);
  }
}

module.exports = {
  Transaction,
  Category,
  Account,
  User,
  Session,
  initializeDefaultCategories
};
