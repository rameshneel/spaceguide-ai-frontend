/**
 * Error and user message constants
 * Centralized for consistency and easy translation in future
 */

export const ERROR_MESSAGES = {
  // AI Writer errors
  GENERATION_FAILED: "Failed to generate text. Please try again.",
  OPTIONS_LOAD_FAILED: "Failed to load options. Please refresh the page.",
  PROMPT_REQUIRED: "Please enter a prompt to continue.",
  STREAMING_ERROR: "Streaming error occurred. Please try again.",

  // Network errors
  NETWORK_ERROR: "Network error. Please check your connection.",
  NO_INTERNET:
    "No internet connection. Please check your network and try again.",
  SERVER_DOWN:
    "Server is currently unavailable. Please try again later or contact support.",
  CONNECTION_REFUSED:
    "Unable to connect to server. The server may be down or unreachable.",
  REQUEST_TIMEOUT:
    "Request timed out. The server is taking too long to respond. Please try again.",
  CONNECTION_TIMEOUT:
    "Connection timeout. Please check your internet connection and try again.",

  // Authentication errors
  AUTH_FAILED: "Authentication failed. Please login again.",
  TOKEN_EXPIRED: "Session expired. Please login again.",
  TOKEN_REFRESH_FAILED: "Failed to refresh session. Please login again.",

  // Usage limit errors
  LIMIT_EXCEEDED: "Daily word limit reached. Please upgrade your plan.",
  LIMIT_WARNING: "You're approaching your daily word limit.",
  INSUFFICIENT_WORDS: "Insufficient words remaining for this request.",

  // Generic errors
  SOMETHING_WENT_WRONG: "Something went wrong. Please try again.",
  UNKNOWN_ERROR: "An unknown error occurred.",
};

export const SUCCESS_MESSAGES = {
  TEXT_GENERATED: (words) => `Text generated! (${words || 0} words)`,
  TEXT_COPIED: "Text copied to clipboard!",
  SETTINGS_SAVED: "Settings saved successfully.",
};

export const INFO_MESSAGES = {
  LOADING: "Loading...",
  GENERATING: "Generating...",
  STREAMING: "Streaming...",
};

export default {
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  INFO_MESSAGES,
};
