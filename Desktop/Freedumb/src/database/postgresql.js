const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

let sequelize;

const connectPostgreSQL = async () => {
  try {
    sequelize = new Sequelize(
      process.env.DB_NAME || 'freedumb_db',
      process.env.DB_USER || 'freedumb_user',
      process.env.DB_PASSWORD || 'password',
      {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: false,
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        }
      }
    );

    // Test the connection
    await sequelize.authenticate();
    console.log('PostgreSQL connection established successfully');

    // Sync models
    await sequelize.sync({ alter: true });
    console.log('Database models synchronized');

    return sequelize;
  } catch (error) {
    console.error('Unable to connect to PostgreSQL:', error.message);
    // Don't throw error to allow server to start without database
    console.warn('Server starting without PostgreSQL connection');
    return null;
  }
};

const getSequelize = () => sequelize;

module.exports = {
  connectPostgreSQL,
  getSequelize,
  sequelize
};