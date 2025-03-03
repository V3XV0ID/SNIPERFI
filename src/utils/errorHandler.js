/**
 * Centralized error handling utility
 * Logs errors and returns standardized error objects
 */

// Import winston for logging
const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

/**
 * Handle and log errors
 * @param {Error} error - The error object
 * @param {string} context - The context where the error occurred
 * @returns {Object} Standardized error response
 */
export const handleError = (error, context) => {
  logger.error(`Error in ${context}: ${error.message}`, {
    context,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });
  
  return {
    success: false,
    error: error.message || 'An unexpected error occurred',
    context,
    timestamp: new Date().toISOString()
  };
};

/**
 * Async error wrapper for event handlers
 * @param {Function} fn - The async function to wrap
 * @returns {Function} Wrapped function with error handling
 */
export const asyncErrorHandler = (fn) => {
  return async function(...args) {
    try {
      return await fn(...args);
    } catch (error) {
      return handleError(error, fn.name || 'anonymous');
    }
  };
};

export default {
  handleError,
  asyncErrorHandler,
  logger
};