// src/utils/logger.js
// Centralized logging utility - disables console.log in production

const isDevelopment = process.env.NODE_ENV === 'development';

const logger = {
  // Only log in development
  log: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  
  // Always log errors
  error: (...args) => {
    console.error(...args);
  },
  
  // Always log warnings
  warn: (...args) => {
    console.warn(...args);
  },
  
  // Debug logs - only in development
  debug: (...args) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },
  
  // Info logs - only in development  
  info: (...args) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
};

export default logger;
