/**
 * Local Storage Utility Functions
 * Centralized management of localStorage operations
 */

const STORAGE_KEYS = {
  accessToken: "accessToken",
  refreshToken: "refreshToken",
  user: "user",
};

/**
 * Get item from localStorage
 * @param {string} key - Storage key
 * @returns {string|null}
 */
export const getStorageItem = (key) => {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error(`Error getting ${key} from localStorage:`, error);
    return null;
  }
};

/**
 * Set item in localStorage
 * @param {string} key - Storage key
 * @param {string} value - Value to store
 */
export const setStorageItem = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.error(`Error setting ${key} in localStorage:`, error);
  }
};

/**
 * Remove item from localStorage
 * @param {string} key - Storage key
 */
export const removeStorageItem = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing ${key} from localStorage:`, error);
  }
};

/**
 * Clear all auth-related items from localStorage
 */
export const clearAuthStorage = () => {
  Object.values(STORAGE_KEYS).forEach((key) => {
    removeStorageItem(key);
  });
};

/**
 * Get access token
 * @returns {string|null}
 */
export const getAccessToken = () => {
  return getStorageItem(STORAGE_KEYS.accessToken);
};

/**
 * Set access token
 * @param {string} token - Access token
 */
export const setAccessToken = (token) => {
  setStorageItem(STORAGE_KEYS.accessToken, token);
};

/**
 * Get refresh token
 * @returns {string|null}
 */
export const getRefreshToken = () => {
  return getStorageItem(STORAGE_KEYS.refreshToken);
};

/**
 * Set refresh token
 * @param {string} token - Refresh token
 */
export const setRefreshToken = (token) => {
  setStorageItem(STORAGE_KEYS.refreshToken, token);
};

/**
 * Set both tokens
 * @param {string} accessToken - Access token
 * @param {string} refreshToken - Refresh token
 */
export const setTokens = (accessToken, refreshToken) => {
  setAccessToken(accessToken);
  setRefreshToken(refreshToken);
};

/**
 * Clear all tokens
 */
export const clearTokens = () => {
  removeStorageItem(STORAGE_KEYS.accessToken);
  removeStorageItem(STORAGE_KEYS.refreshToken);
};

export default {
  getStorageItem,
  setStorageItem,
  removeStorageItem,
  clearAuthStorage,
  getAccessToken,
  setAccessToken,
  getRefreshToken,
  setRefreshToken,
  setTokens,
  clearTokens,
};
