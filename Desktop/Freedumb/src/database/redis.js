const Redis = require('ioredis');
const logger = require('../utils/logger');

let redisClient;

const connectRedis = async () => {
  try {
    redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      db: process.env.REDIS_DB || 0,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3
    });

    redisClient.on('connect', () => {
      console.log('Redis connection established');
    });

    redisClient.on('error', (err) => {
      console.error('Redis connection error:', err.message);
    });

    // Test connection
    await redisClient.ping();
    console.log('Redis connected successfully');

    return redisClient;
  } catch (error) {
    console.error('Unable to connect to Redis:', error.message);
    console.warn('Server starting without Redis connection');
    return null;
  }
};

const getRedisClient = () => redisClient;

module.exports = {
  connectRedis,
  getRedisClient,
  redisClient
};