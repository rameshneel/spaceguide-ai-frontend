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

          // Tokens are stored in httpOnly cookies by backend - no need to store locally
          return data;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
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

          // Tokens are stored in httpOnly cookies by backend - no need to store locally
          return data;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      // Logout
      logout: async () => {
        try {
          await authService.logout();
        } catch (error) {
          console.error("Logout error:", error);
        } finally {
          set({ user: null, token: null });
          // Cookies are cleared by backend on logout
        }
      },

      // Get current user
      getCurrentUser: async () => {
        try {
          const data = await authService.getCurrentUser();
          set({ user: data.user });
          return data;
        } catch (error) {
          console.error("Get current user error:", error);
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
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);

export default useAuthStore;
