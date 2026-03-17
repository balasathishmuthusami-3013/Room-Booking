/**
 * config/database.js — MongoDB Connection with retry logic
 */

const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  const options = {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  };

  const connect = async () => {
    try {
      const conn = await mongoose.connect(process.env.MONGODB_URI, options);
      logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
      logger.error(`❌ MongoDB Connection Error: ${error.message}`);
      // Retry after 5 seconds
      setTimeout(connect, 5000);
    }
  };

  await connect();

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected. Attempting reconnect...');
    setTimeout(connect, 5000);
  });

  mongoose.connection.on('error', (err) => {
    logger.error(`MongoDB error: ${err.message}`);
  });
};

module.exports = connectDB;
