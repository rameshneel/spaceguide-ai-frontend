import api from "./api";

export const authService = {
  // Register user
  register: async (data) => {
    const response = await api.post("/auth/register", data);
    // Backend returns: { statusCode, data: { user, accessToken, refreshToken }, message, success }
    // Extract the nested data object
    return response.data.data || response.data;
  },

  // Login user
  login: async (data) => {
    const response = await api.post("/auth/login", data);
    // Backend returns: { statusCode, data: { user, accessToken, refreshToken }, message, success }
    // Extract the nested data object
    return response.data.data || response.data;
  },

  // Logout user
  logout: async () => {
    const response = await api.post("/auth/logout");
    return response.data;
  },

  // Get current user
  getCurrentUser: async () => {
    const response = await api.get("/auth/profile");
    // Backend returns: { statusCode, data: { user }, message, success }
    return response.data.data || response.data;
  },

  // Update profile
  updateProfile: async (data) => {
    const response = await api.put("/auth/profile", data);
    return response.data;
  },

  // Get user subscription
  getSubscription: async () => {
    const response = await api.get("/subscription/current");
    return response.data;
  },

  // Get subscription usage
  getUsage: async () => {
    const response = await api.get("/subscription/usage");
    return response.data;
  },

  // Get detailed subscription usage (per-service breakdown)
  getDetailedUsage: async () => {
    const response = await api.get("/subscription/usage");
    return response.data.data || response.data;
  },

  // Get recent activity/history
  getRecentActivity: async (limit = 10) => {
    const response = await api.get(`/services/text/history?limit=${limit}`);
    return response.data.data || response.data;
  },
};
