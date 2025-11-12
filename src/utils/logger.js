/**
 * Logging utility for development and production
 * In production, only errors and warnings are logged
 * In development, all logs are shown
 *
 * Best Practices:
 * - Use logger instead of console.* directly
 * - Errors and warnings are always logged (even in production)
 * - Info and debug logs are only shown in development
 * - Can be extended to send logs to external services (Sentry, LogRocket, etc.)
 */

const isDev = import.meta.env.DEV;
const isProd = import.meta.env.PROD;

export const logger = {
  /**
   * Log info messages (development only)
   * @param {...any} args - Arguments to log
   */
  info: (...args) => {
    if (isDev) {
      console.log("[INFO]", ...args);
    }
  },

  /**
   * Log debug messages (development only)
   * @param {...any} args - Arguments to log
   */
  debug: (...args) => {
    if (isDev) {
      console.debug("[DEBUG]", ...args);
    }
  },

  /**
   * Log warnings (always logged)
   * @param {...any} args - Arguments to log
   */
  warn: (...args) => {
    console.warn("[WARN]", ...args);

    // In production, you could send to error tracking service
    if (isProd && window.Sentry) {
      window.Sentry.captureMessage(args.join(" "), "warning");
    }
  },

  /**
   * Log errors (always logged)
   * @param {...any} args - Arguments to log
   */
  error: (...args) => {
    console.error("[ERROR]", ...args);

    // In production, send to error tracking service if available
    if (isProd && window.Sentry) {
      const error =
        args.find((arg) => arg instanceof Error) || new Error(args.join(" "));
      window.Sentry.captureException(error);
    }
  },

  /**
   * Log with custom level
   * @param {string} level - Log level (log, info, warn, error, debug)
   * @param {...any} args - Arguments to log
   */
  log: (level, ...args) => {
    if (level === "error" || level === "warn") {
      console[level](`[${level.toUpperCase()}]`, ...args);

      // Send to error tracking in production
      if (isProd && window.Sentry && level === "error") {
        const error =
          args.find((arg) => arg instanceof Error) || new Error(args.join(" "));
        window.Sentry.captureException(error);
      }
    } else if (isDev) {
      console[level](`[${level.toUpperCase()}]`, ...args);
    }
  },

  /**
   * Group related logs together (development only)
   * @param {string} label - Group label
   * @param {Function} fn - Function to execute within the group
   */
  group: (label, fn) => {
    if (isDev) {
      console.group(label);
      try {
        fn();
      } finally {
        console.groupEnd();
      }
    } else {
      fn();
    }
  },
};

export default logger;
