const jwt = require('jsonwebtoken');
const { User } = require('../models');

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
        const user = await User.findOne({ 
          $or: [
            { _id: decoded.userId },
            { email: decoded.email }
          ]
        });

        if (!user) {
          console.log('❌ User not found:', decoded.email || decoded.userId);
          return res.status(404).json({
            success: false,
            error: 'User not found',
            code: 'USER_NOT_FOUND'
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
