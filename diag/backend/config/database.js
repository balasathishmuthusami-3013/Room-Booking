/**
 * database.js — MongoDB Atlas connection (production-ready)
 */
const mongoose = require('mongoose');
const logger   = require('../utils/logger');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!uri) {
    logger.error('❌ MONGODB_URI is not defined in environment variables');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri, {
      // Modern Mongoose (v7+) no longer needs useNewUrlParser / useUnifiedTopology
      serverSelectionTimeoutMS: 10000,   // Fail fast if Atlas unreachable
      socketTimeoutMS:          45000,
      maxPoolSize:              10,
      retryWrites:              true,
    });

    logger.info(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    logger.error(`❌ MongoDB connection failed: ${err.message}`);
    process.exit(1);
  }
};

// Handle disconnections after initial connection
mongoose.connection.on('disconnected', () => {
  logger.warn('⚠️  MongoDB disconnected — attempting reconnect...');
});
mongoose.connection.on('reconnected', () => {
  logger.info('✅ MongoDB reconnected');
});

module.exports = connectDB;
