// routes/auth.js
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

const router = express.Router();

// ===== Schemas =====
// User Schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  apiKey: {
    type: String,
    unique: true,
    sparse: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  },
  metadata: {
    lastLoginIP: String,
    loginCount: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Session Schema
const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  token: {
    type: String,
    required: true
  },
  refreshToken: {
    type: String,
    required: true
  },
  userAgent: {
    type: String
  },
  ipAddress: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// AuthLog Schema
const authLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  action: {
    type: String,
    enum: ['login', 'logout', 'register', 'password_reset', 'token_refresh'],
    required: true
  },
  success: {
    type: Boolean,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  errorMessage: {
    type: String
  }
}, {
  timestamps: true
});

// Models
const User = mongoose.models.User || mongoose.model('User', userSchema);
const Session = mongoose.models.Session || mongoose.model('Session', sessionSchema);
const AuthLog = mongoose.models.AuthLog || mongoose.model('AuthLog', authLogSchema);

/**
 * POST /api/auth/login
 * Login endpoint - authenticates user and returns JWT tokens
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Validar campos requeridos
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // 2. Buscar usuario
    const user = await User.findOne({
      email: email.toLowerCase(),
      isActive: true
    });

    if (!user) {
      // Log failed attempt
      await AuthLog.create({
        userId: null,
        action: 'login',
        success: false,
        timestamp: new Date(),
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        errorMessage: 'User not found'
      });

      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // 3. Verificar contraseña
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      // Log failed attempt
      await AuthLog.create({
        userId: user._id,
        action: 'login',
        success: false,
        timestamp: new Date(),
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        errorMessage: 'Invalid password'
      });

      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // 4. Generar tokens
    const accessToken = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
      { expiresIn: '7d' }
    );

    // 5. Guardar sesión
    await Session.create({
      userId: user._id,
      token: accessToken,
      refreshToken: refreshToken,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
      isActive: true,
      expiresAt: new Date(Date.now() + 3600000), // 1 hora
      createdAt: new Date(),
      lastActivity: new Date()
    });

    // 6. Log de autenticación exitosa
    await AuthLog.create({
      userId: user._id,
      action: 'login',
      success: true,
      timestamp: new Date(),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    // 7. Actualizar último login
    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          lastLogin: new Date(),
          'metadata.lastLoginIP': req.ip
        },
        $inc: {
          'metadata.loginCount': 1
        }
      }
    );

    // 8. Respuesta exitosa
    return res.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error',
      details: error.message
    });
  }
});

/**
 * POST /api/auth/register
 * Register new user
 */
router.post('/register', async (req, res) => {
  const { name, email, password, username } = req.body;

  try {
    // 1. Validar campos requeridos
    if (!name || !email || !password || !username) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required'
      });
    }

    // 2. Verificar si el usuario ya existe
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: username.toLowerCase() }
      ]
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User already exists'
      });
    }

    // 3. Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Crear usuario
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      password: hashedPassword,
      role: 'user',
      isActive: true
    });

    // 5. Log de registro
    await AuthLog.create({
      userId: user._id,
      action: 'register',
      success: true,
      timestamp: new Date(),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    // 6. Respuesta exitosa
    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        username: user.username,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error',
      details: error.message
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  try {
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required'
      });
    }

    // 1. Verificar refresh token
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || 'your-refresh-secret'
    );

    // 2. Buscar sesión activa
    const session = await Session.findOne({
      refreshToken,
      userId: decoded.userId,
      isActive: true
    });

    if (!session) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token'
      });
    }

    // 3. Buscar usuario
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'User not found or inactive'
      });
    }

    // 4. Generar nuevo access token
    const newAccessToken = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    // 5. Actualizar sesión
    await Session.updateOne(
      { _id: session._id },
      {
        $set: {
          token: newAccessToken,
          expiresAt: new Date(Date.now() + 3600000),
          lastActivity: new Date()
        }
      }
    );

    // 6. Log de refresh
    await AuthLog.create({
      userId: user._id,
      action: 'token_refresh',
      success: true,
      timestamp: new Date(),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return res.json({
      success: true,
      accessToken: newAccessToken
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(401).json({
      success: false,
      error: 'Invalid refresh token',
      details: error.message
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout user and invalidate session
 */
router.post('/logout', async (req, res) => {
  const { token } = req.body;

  try {
    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token is required'
      });
    }

    // 1. Invalidar sesión
    const session = await Session.findOneAndUpdate(
      { token },
      { $set: { isActive: false } }
    );

    if (session) {
      // 2. Log de logout
      await AuthLog.create({
        userId: session.userId,
        action: 'logout',
        success: true,
        timestamp: new Date(),
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
    }

    return res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error',
      details: error.message
    });
  }
});

export default router;
