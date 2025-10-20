const cron = require('node-cron');
const logger = require('../utils/logger');

const startCronJobs = () => {
  // Daily backup at 2 AM
  cron.schedule('0 2 * * *', () => {
    logger.info('Running daily backup...');
    // Implement backup logic here
  });

  // Check for budget alerts every hour
  cron.schedule('0 * * * *', () => {
    logger.info('Checking budget alerts...');
    // Implement budget alert logic here
  });

  // Update investment prices every 15 minutes (during market hours)
  cron.schedule('*/15 * * * *', () => {
    const now = new Date();
    const hour = now.getHours();

    // Only run during market hours (9:30 AM - 4:00 PM EST)
    if (hour >= 9 && hour <= 16) {
      logger.info('Updating investment prices...');
      // Implement price update logic here
    }
  });

  // Send daily summary at 9 PM
  cron.schedule('0 21 * * *', () => {
    logger.info('Sending daily summaries...');
    // Implement daily summary logic here
  });

  // Clean up old logs weekly
  cron.schedule('0 3 * * 0', () => {
    logger.info('Cleaning up old logs...');
    // Implement log cleanup logic here
  });

  logger.info('Cron jobs initialized');
};

module.exports = {
  startCronJobs
};