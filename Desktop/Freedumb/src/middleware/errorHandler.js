const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  // Errores de validación de Mongoose
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      error: 'Validation Error',
      message: errors.join(', ')
    });
  }

  // Error de duplicado (email único)
  if (err.code === 11000) {
    return res.status(409).json({
      error: 'Conflict',
      message: 'Email already registered'
    });
  }

  // Error de Cast (ID inválido)
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid ID format'
    });
  }

  // Error genérico
  res.status(err.statusCode || 500).json({
    error: err.name || 'Internal Server Error',
    message: err.message || 'An unexpected error occurred',
    timestamp: new Date().toISOString()
  });
};

module.exports = errorHandler;
