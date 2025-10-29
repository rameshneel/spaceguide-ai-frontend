import { create } from "zustand";
import { subscriptionService } from "../services/subscription";

const useSubscriptionStore = create((set, get) => ({
  plans: [],
  currentSubscription: null,
  usage: null,
  loading: false,
  error: null,

  // Get all plans
  fetchPlans: async () => {
    try {
      set({ loading: true, error: null });
      const data = await subscriptionService.getPlans();
      set({ plans: data.plans, loading: false });
      return data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Get current subscription
  fetchCurrentSubscription: async () => {
    try {
      set({ loading: true });
      const data = await subscriptionService.getSubscription();
      set({ currentSubscription: data.subscription, loading: false });
      return data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Get usage
  fetchUsage: async (params) => {
    try {
      set({ loading: true });
      const data = await subscriptionService.getUsage(params);
      set({ usage: data, loading: false });
      return data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Start trial
  startTrial: async () => {
    try {
      set({ loading: true, error: null });
      const data = await subscriptionService.startTrial();
      set({ currentSubscription: data.subscription, loading: false });
      return data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Upgrade subscription
  upgrade: async (planId, billingCycle) => {
    try {
      set({ loading: true, error: null });
      const data = await subscriptionService.upgrade(planId, billingCycle);
      set({ currentSubscription: data.subscription, loading: false });
      return data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Cancel subscription
  cancel: async () => {
    try {
      set({ loading: true, error: null });
      const data = await subscriptionService.cancel();
      set({ currentSubscription: data.subscription, loading: false });
      return data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Update subscription locally
  updateSubscription: (subscription) => {
    set({ currentSubscription: subscription });
  },
}));

export default useSubscriptionStore;
