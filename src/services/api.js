import axios from "axios";
import { toast } from "react-hot-toast";
import logger from "../utils/logger";
import { EVENTS } from "../constants/events";
import { TIMING } from "../constants/timing";
import { ERROR_MESSAGES } from "../constants/messages";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Token refresh queue to prevent multiple simultaneous refresh calls
let isRefreshing = false;
let failedQueue = [];

// Process queued requests after token refresh
const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

/**
 * Detect network error type and return user-friendly error message
 * Industry best practice: Categorize errors for better UX
 */
const getNetworkErrorMessage = (error) => {
  // Check if browser is offline
  if (!navigator.onLine) {
    return {
      message: ERROR_MESSAGES.NO_INTERNET,
      type: "NO_INTERNET",
      userFriendly: true,
    };
  }

  // Network error (no response from server)
  if (!error.response) {
    // Check error code for specific network issues
    const errorCode = error.code;
    const errorMessage = error.message?.toLowerCase() || "";

    // Connection refused (server down)
    if (
      errorCode === "ECONNREFUSED" ||
      errorCode === "ERR_NETWORK" ||
      errorMessage.includes("network error") ||
      errorMessage.includes("connection refused")
    ) {
      return {
        message: ERROR_MESSAGES.CONNECTION_REFUSED,
        type: "SERVER_DOWN",
        userFriendly: true,
      };
    }

    // Timeout errors
    if (
      errorCode === "ECONNABORTED" ||
      errorCode === "ETIMEDOUT" ||
      errorCode === "TIMEOUT" ||
      errorMessage.includes("timeout")
    ) {
      return {
        message: ERROR_MESSAGES.REQUEST_TIMEOUT,
        type: "TIMEOUT",
        userFriendly: true,
      };
    }

    // Generic network error
    return {
      message: ERROR_MESSAGES.NETWORK_ERROR,
      type: "NETWORK_ERROR",
      userFriendly: true,
    };
  }

  // HTTP error responses
  const status = error.response.status;

  // Server errors (5xx)
  if (status >= 500) {
    return {
      message: ERROR_MESSAGES.SERVER_DOWN,
      type: "SERVER_ERROR",
      userFriendly: true,
    };
  }

  // Gateway timeout
  if (status === 504) {
    return {
      message: ERROR_MESSAGES.REQUEST_TIMEOUT,
      type: "TIMEOUT",
      userFriendly: true,
    };
  }

  // Service unavailable
  if (status === 503) {
    return {
      message: ERROR_MESSAGES.SERVER_DOWN,
      type: "SERVICE_UNAVAILABLE",
      userFriendly: true,
    };
  }

  // Return null if it's not a network error (let default handling work)
  return null;
};

// Create axios instance with credentials for cookies
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Important: This allows cookies to be sent/received
  timeout: TIMING.API_REQUEST_TIMEOUT, // 30 seconds timeout
});

// Request interceptor - No need to manually add token since cookies are used
api.interceptors.request.use(
  (config) => {
    // Cookies are automatically sent with withCredentials: true
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Debug logging
    if (error.response?.status === 401) {
      logger.debug("401 Error detected:", {
        url: originalRequest?.url,
        method: originalRequest?.method,
        hasRetry: originalRequest?._retry,
      });
    }

    // Skip refresh logic if this is already a refresh request or logout
    const requestUrl = originalRequest?.url || originalRequest?._fullPath || "";
    const isRefreshRequest =
      requestUrl.includes("/auth/tokens/refresh") ||
      requestUrl.includes("/auth/refresh");
    const isLogoutRequest = requestUrl.includes("/auth/logout");
    const isLoginRequest = requestUrl.includes("/auth/login");
    const isRegisterRequest = requestUrl.includes("/auth/register");

    // Handle 401 unauthorized - automatically refresh token
    // BUT: If refresh endpoint itself returns 401, immediately logout
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isRefreshRequest &&
      !isLogoutRequest &&
      !isLoginRequest &&
      !isRegisterRequest
    ) {
      originalRequest._retry = true;

      // If token refresh is already in progress, queue this request
      if (isRefreshing) {
        logger.debug(
          "Token refresh already in progress, queueing request:",
          originalRequest.url
        );
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, config: originalRequest });
        })
          .then((token) => {
            // Retry the original request after token refresh
            const retryConfig = {
              ...originalRequest,
              _retry: false, // Reset retry flag for the retry
            };
            return api(retryConfig);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      // Start token refresh process
      isRefreshing = true;
      logger.info(
        "Access token expired. Attempting to refresh token (queueing other requests)..."
      );

      try {
        // Try to refresh token using cookies (sent automatically)
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/auth/tokens/refresh`,
          {},
          {
            withCredentials: true,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        logger.info("Token refresh successful");

        // If refresh successful (status 200), extract and store new tokens
        if (refreshResponse.status === 200 || refreshResponse.data?.success) {
          // Extract new accessToken from response
          const newAccessToken =
            refreshResponse.data?.data?.accessToken ||
            refreshResponse.data?.accessToken;

          const newRefreshToken =
            refreshResponse.data?.data?.refreshToken ||
            refreshResponse.data?.refreshToken;

          if (newAccessToken) {
            // Store new accessToken in localStorage for Socket.IO
            localStorage.setItem("accessToken", newAccessToken);
            logger.debug(
              "New accessToken stored in localStorage from interceptor"
            );

            // Update Zustand store token
            try {
              const { default: useAuthStore } = await import(
                "../store/useAuthStore"
              );
              const store = useAuthStore.getState();
              if (store.updateToken) {
                store.updateToken(newAccessToken);
                logger.debug("Token updated in Zustand store from interceptor");
              } else {
                // Fallback: Update directly if method doesn't exist
                useAuthStore.setState({ token: newAccessToken });
                logger.debug(
                  "Token updated in Zustand store (fallback method)"
                );
              }

              // Store refreshToken if provided
              if (newRefreshToken) {
                const { setRefreshToken } = await import("../utils/storage");
                setRefreshToken(newRefreshToken);
              }

              // Emit event to trigger Socket.IO reconnection with new token
              setTimeout(() => {
                logger.debug(
                  "Dispatching token-refreshed event for Socket.IO reconnection (from interceptor)..."
                );
                window.dispatchEvent(
                  new CustomEvent(EVENTS.TOKEN_REFRESHED, {
                    detail: { token: newAccessToken },
                  })
                );
              }, TIMING.SOCKET_RECONNECT_DELAY);
            } catch (e) {
              logger.warn("Failed to update auth store on token refresh:", e);
              // Still dispatch event even if store update fails
              setTimeout(() => {
                logger.debug(
                  "Dispatching token-refreshed event (store update failed)..."
                );
                window.dispatchEvent(
                  new CustomEvent(EVENTS.TOKEN_REFRESHED, {
                    detail: { token: newAccessToken },
                  })
                );
              }, TIMING.SOCKET_RECONNECT_DELAY);
            }
          }

          // Small delay to ensure cookies are set
          await new Promise((resolve) =>
            setTimeout(resolve, TIMING.TOKEN_REFRESH_DELAY)
          );

          // Process queued requests
          processQueue(null, newAccessToken);
          isRefreshing = false;

          // Retry the original request
          const retryConfig = {
            ...originalRequest,
            _retry: false, // Reset retry flag for the retry
          };

          return api(retryConfig);
        } else {
          throw new Error("Token refresh failed - invalid response");
        }
      } catch (refreshError) {
        logger.error("Token refresh failed:", refreshError);

        // Process queue with error
        processQueue(refreshError, null);
        isRefreshing = false;

        // If refresh endpoint itself returns 401, user needs to login
        if (refreshError.response?.status === 401) {
          logger.info(
            "Refresh token expired. Logging out and redirecting to login..."
          );
        }

        // IMMEDIATELY clear auth store and redirect
        // Use logout method from store for proper cleanup
        try {
          const { default: useAuthStore } = await import(
            "../store/useAuthStore"
          );
          const store = useAuthStore.getState();

          // Clear state using store's clearAuth method (best practice)
          // This ensures proper cleanup and triggers component re-renders
          if (store.clearAuth) {
            store.clearAuth();
          } else {
            // Fallback: Use Zustand's setState
            useAuthStore.setState({ user: null, token: null });
          }

          // Try logout API call to clear backend cookies
          // Wrap in try-catch since token might already be expired
          try {
            await store.logout();
          } catch (logoutError) {
            // Expected if token already expired - just log and continue
            logger.debug(
              "Logout API call skipped (token expired):",
              logoutError.message
            );
          }
        } catch (e) {
          logger.error("Failed to clear auth store:", e);
          // Fallback: Clear localStorage directly if store access fails
          try {
            localStorage.removeItem("auth-storage");
          } catch (storageError) {
            logger.error("Failed to clear localStorage:", storageError);
          }
        }

        // Redirect to login page using window.location for immediate effect
        // This ensures complete page reload and clears any stale state
        const currentPath = window.location.pathname;
        if (
          !currentPath.includes("/login") &&
          !currentPath.includes("/register")
        ) {
          // Use window.location.href for hard redirect (best practice for auth failures)
          // This ensures complete cleanup of React state and routing
          window.location.href = "/login";
        }

        return Promise.reject(refreshError);
      }
    }

    // Detect network errors and get user-friendly message
    const networkError = getNetworkErrorMessage(error);

    // Extract error message from response
    let message;
    let errorType = "UNKNOWN";

    if (networkError) {
      // Use network error message
      message = networkError.message;
      errorType = networkError.type;

      // Log network error details for debugging
      logger.error(`Network error detected: ${errorType}`, {
        code: error.code,
        message: error.message,
        url: originalRequest?.url,
      });
    } else {
      // Use backend error message or fallback
      message =
        error.response?.data?.message ||
        error.message ||
        ERROR_MESSAGES.SOMETHING_WENT_WRONG;
      errorType = error.response?.status
        ? `HTTP_${error.response.status}`
        : "UNKNOWN";
    }

    // Show error toast for:
    // 1. Login/Register 401 errors (invalid credentials) - user needs to see this
    // 2. All non-401 errors (including network errors)
    // 3. Network errors should always be shown
    const shouldShowToast =
      (error.response?.status === 401 &&
        (isLoginRequest || isRegisterRequest)) ||
      error.response?.status !== 401 ||
      networkError !== null; // Always show network errors

    if (shouldShowToast) {
      // Skip toast for rate limiting (429) - too noisy
      if (error.response?.status === 429) {
        // Rate limit - don't show toast, just log
        logger.warn("Rate limit exceeded (429)");
        return Promise.reject(error);
      }

      // Show toast for other errors
      // Use consistent toast ID to prevent duplicates
      // For network errors, use same ID regardless of endpoint (all network errors are same)
      // For other errors, include URL to differentiate between different API endpoints
      const requestUrl = originalRequest?.url || "";

      // Special handling for NO_INTERNET - NetworkStatusIndicator already shows toast
      // Skip showing duplicate toast for NO_INTERNET errors
      if (networkError && networkError.type === "NO_INTERNET") {
        // NetworkStatusIndicator component already handles this, skip duplicate
        logger.debug(
          "Skipping NO_INTERNET toast - NetworkStatusIndicator handles it"
        );
      } else {
        const toastId = networkError
          ? `error-${errorType}` // Same ID for all network errors
          : `error-${errorType}-${requestUrl}`; // Different ID per endpoint for other errors

        try {
          // Check if toast is already active to prevent duplicates
          if (typeof toast.isActive === "function") {
            if (!toast.isActive(toastId)) {
              toast.error(message, {
                id: toastId,
                duration: networkError ? 6000 : 4000, // Longer duration for network errors
              });
              logger.debug("Toast shown:", { toastId, message, errorType });
            } else {
              // Toast already showing, skip duplicate
              logger.debug(
                "Toast already active, skipping duplicate:",
                toastId
              );
            }
          } else {
            // Fallback: just show toast without checking (for older versions)
            toast.error(message, {
              id: toastId,
              duration: networkError ? 6000 : 4000,
            });
          }
        } catch (toastError) {
          // Fallback: if toast.isActive throws, just show the error
          logger.warn("Toast error:", toastError);
          toast.error(message, { duration: networkError ? 6000 : 4000 });
        }
      }
    }

    // Attach error type to error object for component-level handling
    error.errorType = errorType;
    error.userFriendlyMessage = message;

    return Promise.reject(error);
  }
);

/**
 * Refresh token helper function (reusable for fetch requests)
 * @returns {Promise<boolean>} Returns true if refresh successful, false otherwise
 */
export const refreshToken = async () => {
  const API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  try {
    const refreshResponse = await axios.post(
      `${API_BASE_URL}/auth/tokens/refresh`,
      {},
      {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (refreshResponse.status === 200 || refreshResponse.data?.success) {
      logger.info("Token refresh successful");

      // Store new accessToken in localStorage for Socket.IO
      const newAccessToken =
        refreshResponse.data?.data?.accessToken ||
        refreshResponse.data?.accessToken;
      if (newAccessToken) {
        // Store in localStorage FIRST (Socket.IO reads from here)
        localStorage.setItem("accessToken", newAccessToken);
        logger.debug("New accessToken stored in localStorage");

        // Update Zustand store token
        try {
          const { default: useAuthStore } = await import(
            "../store/useAuthStore"
          );
          const store = useAuthStore.getState();
          if (store.updateToken) {
            store.updateToken(newAccessToken);
            logger.debug("Token updated in Zustand store");
          } else {
            // Fallback: Update directly if method doesn't exist
            useAuthStore.setState({ token: newAccessToken });
            logger.debug("Token updated in Zustand store (fallback method)");
          }

          // Emit event to trigger Socket.IO reconnection with new token
          // Small delay to ensure token is stored and store is updated
          setTimeout(() => {
            logger.debug(
              "Dispatching token-refreshed event for Socket.IO reconnection..."
            );
            window.dispatchEvent(
              new CustomEvent(EVENTS.TOKEN_REFRESHED, {
                detail: { token: newAccessToken },
              })
            );
          }, TIMING.SOCKET_RECONNECT_DELAY);
        } catch (e) {
          logger.warn("Failed to update auth store on token refresh:", e);
          // Still dispatch event even if store update fails
          setTimeout(() => {
            logger.debug(
              "Dispatching token-refreshed event (store update failed)..."
            );
            window.dispatchEvent(
              new CustomEvent(EVENTS.TOKEN_REFRESHED, {
                detail: { token: newAccessToken },
              })
            );
          }, TIMING.SOCKET_RECONNECT_DELAY);
        }
      }

      // Small delay to ensure cookies are set
      await new Promise((resolve) =>
        setTimeout(resolve, TIMING.TOKEN_REFRESH_DELAY)
      );
      return true;
    }
    return false;
  } catch (refreshError) {
    logger.error("Token refresh failed:", refreshError);

    // If refresh endpoint itself returns 401, immediately logout
    if (refreshError.response?.status === 401) {
      logger.info("Refresh token expired. Logging out and redirecting...");

      try {
        const { default: useAuthStore } = await import("../store/useAuthStore");
        const store = useAuthStore.getState();

        // Clear state using store's clearAuth method (best practice)
        if (store.clearAuth) {
          store.clearAuth();
        } else {
          useAuthStore.setState({ user: null, token: null });
        }

        // Try logout API call to clear backend cookies
        try {
          await store.logout();
        } catch (logoutError) {
          logger.debug(
            "Logout API call skipped (token expired):",
            logoutError.message
          );
        }
      } catch (e) {
        logger.error("Failed to clear auth store:", e);
        try {
          localStorage.removeItem("auth-storage");
        } catch (storageError) {
          logger.error("Failed to clear localStorage:", storageError);
        }
      }

      // Force redirect to login page
      const currentPath = window.location.pathname;
      if (
        !currentPath.includes("/login") &&
        !currentPath.includes("/register")
      ) {
        window.location.href = "/login";
      }
    }

    return false;
  }
};

export default api;
