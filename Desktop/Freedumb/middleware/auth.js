const jwt = require('jsonwebtoken');
const { User, Session } = require('../models');

/**
 * Middleware para validar JWT token
 */
async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'NO_TOKEN'
      });
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      console.error('❌ JWT_SECRET not configured');
      return res.status(500).json({
        success: false,
        error: 'Server configuration error',
        code: 'CONFIG_ERROR'
      });
    }

    jwt.verify(token, JWT_SECRET, async (err, decoded) => {
      if (err) {
        console.log('❌ Invalid token:', err.message);
        return res.status(403).json({
          success: false,
          error: 'Invalid or expired token',
          code: 'INVALID_TOKEN'
        });
      }

      try {
        // 🔧 Log para debug - ver qué contiene el token
        console.log('🔍 Token decoded:', JSON.stringify(decoded, null, 2));

        // 🔧 Buscar usuario por múltiples campos posibles
        let user = null;

        // Intentar buscar por diferentes campos del JWT
        if (decoded.userId) {
          console.log('🔍 Buscando por userId:', decoded.userId);
          user = await User.findById(decoded.userId);
        }

        if (!user && decoded.user_id) {
          console.log('🔍 Buscando por user_id:', decoded.user_id);
          user = await User.findById(decoded.user_id);
        }

        if (!user && decoded.id) {
          console.log('🔍 Buscando por id:', decoded.id);
          user = await User.findById(decoded.id);
        }

        if (!user && decoded.email) {
          console.log('🔍 Buscando por email:', decoded.email);
          user = await User.findOne({ email: decoded.email });
        }

        if (!user && decoded.sub) {
          console.log('🔍 Buscando por sub:', decoded.sub);
          // 'sub' es el estándar JWT para user ID
          user = await User.findOne({
            $or: [
              { googleId: decoded.sub }
            ]
          });
        }

        // 🔧 Si aún no encontramos usuario, buscar por el campo user.sub
        if (!user && decoded.user && decoded.user.sub) {
          console.log('🔍 Buscando por user.sub:', decoded.user.sub);
          user = await User.findOne({ googleId: decoded.user.sub });
        }

        if (!user) {
          console.log('❌ User not found. Token payload:', JSON.stringify(decoded, null, 2));
          return res.status(404).json({
            success: false,
            error: 'User not found',
            code: 'USER_NOT_FOUND',
            debug: process.env.NODE_ENV !== 'production' ? decoded : undefined
          });
        }

        if (!user.isActive) {
          console.log('❌ User inactive:', decoded.email);
          return res.status(403).json({
            success: false,
            error: 'User account is inactive',
            code: 'USER_INACTIVE'
          });
        }

        req.user = user;
        req.userId = user._id.toString();

        // Actualizar última actividad de la sesión (sin await para no bloquear)
        Session.findOneAndUpdate(
          { token: token, userId: user._id, isActive: true },
          { lastActivity: new Date() }
        ).catch(err => console.log('⚠️  Error updating session activity:', err.message));

        console.log('✅ Authenticated user:', user.email);
        next();

      } catch (dbError) {
        console.error('❌ Database error:', dbError);
        return res.status(500).json({
          success: false,
          error: 'Database error',
          code: 'DB_ERROR'
        });
      }
    });

  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication error',
      code: 'AUTH_ERROR'
    });
  }
}

module.exports = { authenticateToken };
