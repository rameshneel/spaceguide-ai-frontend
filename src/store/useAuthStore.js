import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authService } from "../services/auth";

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      loading: false,
      error: null,

      // Login
      login: async (credentials) => {
        try {
          set({ loading: true, error: null });
          const data = await authService.login(credentials);

          set({
            user: data.user,
            token: data.accessToken, // Store for reference only (cookies handle auth)
            loading: false,
          });

          // Store token in localStorage for Socket.IO connection
          // auth.js already stores it, but ensure it's synced
          if (data.accessToken) {
            localStorage.setItem("accessToken", data.accessToken);
          }

          return data;
        } catch (error) {
          // Extract proper error message from axios error response
          const errorMessage =
            error?.userFriendlyMessage || // Use interceptor's user-friendly message if available
            error?.response?.data?.message ||
            error?.message ||
            "Login failed. Please try again.";
          set({ error: errorMessage, loading: false });
          // Re-throw error, preserving all properties set by interceptor
          // This ensures Login component can check if interceptor already handled it
          error.message = errorMessage; // Update message but preserve other properties
          throw error; // Re-throw original error to preserve userFriendlyMessage, errorType, etc.
        }
      },

      // Register
      register: async (userData) => {
        try {
          set({ loading: true, error: null });
          const data = await authService.register(userData);

          set({
            user: data.user,
            token: data.accessToken, // Store for reference only (cookies handle auth)
            loading: false,
          });

          // Store token in localStorage for Socket.IO connection
          // auth.js already stores it, but ensure it's synced
          if (data.accessToken) {
            localStorage.setItem("accessToken", data.accessToken);
          }

          return data;
        } catch (error) {
          // Extract proper error message from axios error response
          const errorMessage =
            error?.userFriendlyMessage || // Use interceptor's user-friendly message if available
            error?.response?.data?.message ||
            error?.message ||
            "Registration failed. Please try again.";
          set({ error: errorMessage, loading: false });
          // Re-throw error, preserving all properties set by interceptor
          error.message = errorMessage; // Update message but preserve other properties
          throw error; // Re-throw original error to preserve userFriendlyMessage, errorType, etc.
        }
      },

      // Logout
      logout: async () => {
        try {
          await authService.logout();
        } catch (error) {
          // Logout errors are expected if token is already expired - no need to log
        } finally {
          set({ user: null, token: null });
          // Clear localStorage token (used for Socket.IO)
          localStorage.removeItem("accessToken");
          // Cookies are cleared by backend on logout
        }
      },

      // Get current user
      getCurrentUser: async () => {
        try {
          const response = await authService.getCurrentUser();
          // API returns: { statusCode, data: { user: { subscription, _id, email, ... } }, message, success }
          // authService.getCurrentUser returns response.data.data which is the user object
          const userData = response?.user || response?.data?.user || response;
          if (userData) {
            set({ user: userData });
          }
          return response;
        } catch (error) {
          // Silently fail - user might not be authenticated
          return null;
        }
      },

      // Update user
      updateUser: (userData) => {
        set({ user: { ...get().user, ...userData } });
      },

      // Check if authenticated
      isAuthenticated: () => {
        return !!get().token && !!get().user;
      },

      // Clear auth state (helper for external use - e.g., API interceptors)
      clearAuth: () => {
        set({ user: null, token: null, error: null });
        // Also clear localStorage token
        localStorage.removeItem("accessToken");
      },

      // Update token (for token refresh scenarios)
      updateToken: (newToken) => {
        set({ token: newToken });
        // Also update localStorage
        if (newToken) {
          localStorage.setItem("accessToken", newToken);
        } else {
          localStorage.removeItem("accessToken");
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);

export default useAuthStore;
