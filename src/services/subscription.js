import api from "./api";

export const subscriptionService = {
  // Get all plans
  getPlans: async () => {
    const response = await api.get("/subscription/plans");
    return response.data;
  },

  // Start trial
  startTrial: async () => {
    const response = await api.post("/subscription/trial/start");
    return response.data;
  },

  // Upgrade subscription
  upgrade: async (planId, billingCycle) => {
    const response = await api.post("/subscription/upgrade", {
      planId,
      billingCycle,
    });
    return response.data;
  },

  // Cancel subscription
  cancel: async () => {
    const response = await api.post("/subscription/cancel");
    return response.data;
  },

  // Get current subscription
  getSubscription: async () => {
    const response = await api.get("/subscription/current");
    return response.data;
  },

  // Get usage statistics
  getUsage: async (params = {}) => {
    const response = await api.get("/subscription/usage", { params });
    return response.data;
  },
};
