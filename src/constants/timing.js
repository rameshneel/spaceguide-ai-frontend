/**
 * Timing constants for delays and timeouts
 * Centralized to avoid magic numbers throughout the codebase
 */

export const TIMING = {
  // Modal delays
  MODAL_DELAY: 800, // Delay before showing modal completion message
  MODAL_FOCUS_DELAY: 100, // Delay before focusing modal after open

  // Token refresh delays
  TOKEN_REFRESH_DELAY: 100, // Delay after token refresh to ensure cookies are set

  // Socket.IO delays
  SOCKET_RECONNECT_DELAY: 50, // Delay before Socket.IO reconnection after token refresh
  SOCKET_RECONNECTION_TIMEOUT: 3000, // Timeout for Socket.IO connection attempts

  // Navigation delays
  REDIRECT_AFTER_UPGRADE: 1500, // Delay before redirecting after successful upgrade
  PAGE_RELOAD_DELAY: 1000, // Delay before reloading page after upgrade

  // UI delays
  LOADING_SIMULATION_DELAY: 1000, // Delay for simulating loading states

  // General delays
  STATE_UPDATE_DELAY: 100, // Delay for state updates to propagate

  // Typing animation (AI Writer)
  TYPING_SPEED_MS: 20, // 20ms per update (~50 chars/sec - visible typing speed)
  CHARS_PER_UPDATE: 1, // Characters to reveal per update (smooth one-by-one)
  CATCH_UP_THRESHOLD: 200, // Characters behind before catching up (prevents lag)

  // Chatbot specific
  DOCUMENT_SEARCH_DEBOUNCE: 500, // Debounce delay for document search (ms)
  COPY_FEEDBACK_TIMEOUT: 2000, // Timeout for copy feedback message (ms)

  // Network & API timeouts
  API_REQUEST_TIMEOUT: 30000, // 30 seconds timeout for API requests (ms)
  API_RETRY_DELAY: 1000, // Initial delay before retry (ms)
  API_MAX_RETRIES: 3, // Maximum number of retries for failed requests
};

export default TIMING;
