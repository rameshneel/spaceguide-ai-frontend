/**
 * Logging utility for development and production
 * In production, only errors and warnings are logged
 * In development, all logs are shown
 */

const isDev = import.meta.env.DEV;

export const logger = {
  /**
   * Log info messages (development only)
   */
  info: (...args) => {
    if (isDev) {
      console.log(...args);
    }
  },

  /**
   * Log debug messages (development only)
   */
  debug: (...args) => {
    if (isDev) {
      console.debug(...args);
    }
  },

  /**
   * Log warnings (always logged)
   */
  warn: (...args) => {
    console.warn(...args);
  },

  /**
   * Log errors (always logged)
   */
  error: (...args) => {
    console.error(...args);
  },

  /**
   * Log with custom level
   */
  log: (level, ...args) => {
    if (level === "error" || level === "warn") {
      console[level](...args);
    } else if (isDev) {
      console[level](...args);
    }
  },
};

export default logger;
