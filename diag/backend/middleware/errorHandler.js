/**
 * middleware/errorHandler.js — Centralized Error Handler
 * Formats all errors consistently for the API response
 */

const logger = require('../utils/logger');

const handleCastError = (err) => ({
  message: `Invalid ${err.path}: ${err.value}`,
  statusCode: 400,
});

const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  return {
    message: `${field} already exists. Please use a different value.`,
    statusCode: 409,
  };
};

const handleValidationError = (err) => ({
  message: Object.values(err.errors).map((e) => e.message).join('. '),
  statusCode: 400,
});

const handleJWTError = () => ({
  message: 'Invalid token. Please log in again.',
  statusCode: 401,
});

const handleJWTExpiredError = () => ({
  message: 'Token expired. Please log in again.',
  statusCode: 401,
});

const errorHandler = (err, req, res, next) => {
  let { statusCode = 500, message, isOperational } = err;

  // Map known Mongoose/JWT errors to user-friendly messages
  let processedError = { message, statusCode };
  if (err.name === 'CastError') processedError = handleCastError(err);
  if (err.code === 11000) processedError = handleDuplicateKeyError(err);
  if (err.name === 'ValidationError') processedError = handleValidationError(err);
  if (err.name === 'JsonWebTokenError') processedError = handleJWTError();
  if (err.name === 'TokenExpiredError') processedError = handleJWTExpiredError();

  // Log non-operational (programming) errors always
  if (!isOperational) {
    logger.error('💥 PROGRAMMING ERROR:', {
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
    });
  }

  const response = {
    status: processedError.statusCode < 500 ? 'fail' : 'error',
    message: processedError.message,
  };

  // Include stack trace in development only
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
    response.originalError = err.message;
  }

  res.status(processedError.statusCode).json(response);
};

module.exports = errorHandler;
