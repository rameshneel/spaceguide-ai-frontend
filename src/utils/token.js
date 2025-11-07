/**
 * Token utility functions
 * Centralized token retrieval logic to avoid code duplication
 */

/**
 * Get authentication token from multiple sources
 * Priority: tokenFromStore > Zustand localStorage > direct localStorage
 *
 * @param {string|null} tokenFromStore - Token from Zustand store (optional)
 * @returns {string|null} - The authentication token or null if not found
 */
export const getAuthToken = (tokenFromStore = null) => {
  // First priority: token from store/parameter
  if (tokenFromStore) {
    return tokenFromStore;
  }

  // Second priority: Try Zustand persisted storage
  try {
    const authStorage = localStorage.getItem("auth-storage");
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      return parsed?.state?.token || null;
    }
  } catch (e) {
    // Ignore parse errors - try next source
  }

  // Third priority: Direct localStorage (for Socket.IO compatibility)
  return localStorage.getItem("accessToken");
};

/**
 * Clean token by removing "Bearer " prefix if present
 *
 * @param {string} token - The token to clean
 * @returns {string} - Clean token without Bearer prefix
 */
export const cleanToken = (token) => {
  if (!token || typeof token !== "string") return "";
  return token.replace(/^Bearer\s+/i, "");
};

/**
 * Validate token format (basic JWT format check)
 *
 * @param {string} token - The token to validate
 * @returns {boolean} - True if token format is valid
 */
export const isValidTokenFormat = (token) => {
  if (!token || typeof token !== "string") return false;

  const cleanTokenValue = cleanToken(token);

  // JWT tokens have 3 parts separated by dots
  const parts = cleanTokenValue.split(".");
  if (parts.length !== 3) return false;

  // Check if parts are base64-like (basic validation)
  try {
    // Try to decode first two parts (header and payload)
    atob(parts[0]);
    atob(parts[1]);
    // Third part (signature) doesn't need decoding check
    return true;
  } catch (e) {
    return false;
  }
};

export default {
  getAuthToken,
  cleanToken,
  isValidTokenFormat,
};
