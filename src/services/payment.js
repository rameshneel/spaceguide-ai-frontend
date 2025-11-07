import api from "./api";

/**
 * Payment Service
 * Handles Stripe payment integration for subscription upgrades
 */
export const paymentService = {
  /**
   * Create payment intent for subscription upgrade
   * @param {string} planId - Subscription plan ID
   * @param {string} billingCycle - 'monthly' or 'yearly'
   * @returns {Promise} Payment intent data with clientSecret
   */
  createPaymentIntent: async (planId, billingCycle = "monthly") => {
    const response = await api.post("/payment/create-intent", {
      planId,
      billingCycle,
    });
    // Backend returns: { statusCode, data: { clientSecret, paymentIntentId, ... }, message, success }
    // Return the nested data object for easier access
    return response.data?.data || response.data;
  },

  /**
   * Confirm payment after Stripe payment succeeds
   * @param {string} paymentIntentId - Stripe payment intent ID
   * @param {string} planId - Subscription plan ID
   * @returns {Promise} Subscription data
   */
  confirmPayment: async (paymentIntentId, planId) => {
    const response = await api.post("/payment/confirm", {
      paymentIntentId,
      planId,
    });
    return response.data;
  },

  /**
   * Check payment status
   * @param {string} paymentIntentId - Stripe payment intent ID
   * @returns {Promise} Payment status data
   */
  checkPaymentStatus: async (paymentIntentId) => {
    const response = await api.get(`/payment/status/${paymentIntentId}`);
    // Backend returns: { statusCode, data: { status, stripeStatus, ... }, message, success }
    return response.data?.data || response.data;
  },

  /**
   * Retry failed/canceled payment
   * @param {string} paymentIntentId - Original payment intent ID
   * @returns {Promise} New payment intent data with clientSecret
   */
  retryPayment: async (paymentIntentId) => {
    const response = await api.post("/payment/retry", {
      paymentIntentId,
    });
    // Backend returns: { statusCode, data: { clientSecret, paymentIntentId, ... }, message, success }
    return response.data?.data || response.data;
  },
};

export default paymentService;
