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

    // Handle 401 unauthorized - automatically refresh token
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isRefreshRequest &&
      !isLogoutRequest
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
          console.log("🔄 Refresh token expired. Redirecting to login...");
        }

        // Clear auth store
        try {
          const { useAuthStore } = await import("../store/useAuthStore");
          await useAuthStore.getState().logout();
        } catch (e) {
          console.error("Failed to clear auth store:", e);
        }

        // Redirect to login
        if (!window.location.pathname.includes("/login")) {
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

export default api;
