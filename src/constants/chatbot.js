/**
 * Chatbot-specific constants
 * Centralized constants for chatbot-related values
 */

export const CHATBOT_CONSTANTS = {
  // Document management
  DOCUMENT_LIMIT: 100, // Maximum documents to fetch per request
  DOCUMENT_OFFSET: 0, // Default offset for pagination

  // Token limits
  MIN_TOKENS: 50, // Minimum tokens allowed
  MAX_TOKENS: 4000, // Maximum tokens allowed
  DEFAULT_MAX_TOKENS: 500, // Default max tokens

  // Temperature limits
  MIN_TEMPERATURE: 0, // Minimum temperature
  MAX_TEMPERATURE: 2, // Maximum temperature
  DEFAULT_TEMPERATURE: 0.7, // Default temperature

  // File upload
  MAX_FILE_SIZE_MB: 10, // Maximum file size for training files
};

export default CHATBOT_CONSTANTS;
