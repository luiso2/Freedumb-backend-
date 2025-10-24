const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectMongoDB = async () => {
  try {
    // Opciones de conexión modernas (sin las deprecadas)
    const options = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    await mongoose.connect(process.env.MONGODB_URI, options);
    
    logger.info('✅ MongoDB connected successfully');
    console.log('✅ MongoDB connected successfully');
    console.log('📊 Database:', mongoose.connection.name);
  } catch (error) {
    logger.error('❌ MongoDB connection error:', error);
    console.error('❌ MongoDB connection error:', error.message);
    
    // Mostrar detalles del error sin exponer credenciales
    if (error.message.includes('Authentication failed')) {
      console.error('⚠️  Verifica las credenciales de MongoDB en el archivo .env');
      console.error('⚠️  Asegúrate de que MONGODB_URI esté correctamente configurado');
    }
    
    process.exit(1);
  }
};

// Event listeners
mongoose.connection.on('connected', () => {
  logger.info('MongoDB connection established');
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

mongoose.connection.on('error', (error) => {
  logger.error('MongoDB error:', error);
});

mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB reconnected');
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  logger.info('MongoDB connection closed due to app termination');
  process.exit(0);
});

module.exports = { connectMongoDB };
