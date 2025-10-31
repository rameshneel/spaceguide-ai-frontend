import axios from "axios";
import { toast } from "react-hot-toast";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Create axios instance with credentials for cookies
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Important: This allows cookies to be sent/received
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
      console.log("🔍 401 Error detected:", {
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

      console.log("🔄 Access token expired. Attempting to refresh token...");

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

        console.log("✅ Token refresh successful");

        // If refresh successful (status 200), retry original request with new cookies
        if (refreshResponse.status === 200 || refreshResponse.data?.success) {
          // Small delay to ensure cookies are set
          await new Promise((resolve) => setTimeout(resolve, 100));

          // Create new request config to retry
          const retryConfig = {
            ...originalRequest,
            _retry: false, // Reset retry flag for the retry
          };

          return api(retryConfig);
        } else {
          throw new Error("Token refresh failed - invalid response");
        }
      } catch (refreshError) {
        console.error("❌ Token refresh failed:", refreshError);

        // If refresh endpoint itself returns 401, user needs to login
        if (refreshError.response?.status === 401) {
          console.log(
            "🔄 Refresh token expired. Logging out and redirecting to login..."
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
            console.log(
              "Logout API call skipped (token expired):",
              logoutError.message
            );
          }
        } catch (e) {
          console.error("Failed to clear auth store:", e);
          // Fallback: Clear localStorage directly if store access fails
          try {
            localStorage.removeItem("auth-storage");
          } catch (storageError) {
            console.error("Failed to clear localStorage:", storageError);
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

    // Don't show error toast for 401 (handled by refresh logic above)
    // or for network errors
    const message =
      error.response?.data?.message || error.message || "Something went wrong";

    if (error.response?.status !== 401 && message !== "Network Error") {
      // Only show toast if not already showing one
      const toastId = `error-${message}`;
      if (!toast.isActive(toastId)) {
        toast.error(message, { id: toastId });
      }
    }

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
      console.log("✅ Token refresh successful");
      // Small delay to ensure cookies are set
      await new Promise((resolve) => setTimeout(resolve, 100));
      return true;
    }
    return false;
  } catch (refreshError) {
    console.error("❌ Token refresh failed:", refreshError);

    // If refresh endpoint itself returns 401, immediately logout
    if (refreshError.response?.status === 401) {
      console.log("🔄 Refresh token expired. Logging out and redirecting...");

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
          console.log(
            "Logout API call skipped (token expired):",
            logoutError.message
          );
        }
      } catch (e) {
        console.error("Failed to clear auth store:", e);
        try {
          localStorage.removeItem("auth-storage");
        } catch (storageError) {
          console.error("Failed to clear localStorage:", storageError);
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
