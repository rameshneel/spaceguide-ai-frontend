/**
 * Custom event names constants
 * Centralized to avoid typos and ensure consistency
 */

export const EVENTS = {
  // Usage-related events
  USAGE_LIMIT_EXCEEDED: "usage-limit-exceeded",
  USAGE_LIMIT_WARNING: "usage-limit-warning",
  USAGE_WARNING: "usage-warning",
  USAGE_UPDATED: "usage-updated",

  // Authentication events
  TOKEN_REFRESHED: "token-refreshed",
};

export default EVENTS;
