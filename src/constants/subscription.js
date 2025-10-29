/**
 * Subscription Plan Constants
 */

export const SUBSCRIPTION_TYPES = {
  FREE: "free",
  BASIC: "basic",
  PRO: "pro",
  ENTERPRISE: "enterprise",
};

export const SUBSCRIPTION_LIMITS = {
  [SUBSCRIPTION_TYPES.FREE]: {
    textGeneration: 500,
    imageGeneration: 3,
    chatbotMessages: 20,
    searches: 10,
    features: ["Basic AI Text", "Limited Images", "Basic Chatbot"],
  },
  [SUBSCRIPTION_TYPES.BASIC]: {
    textGeneration: 5000,
    imageGeneration: 30,
    chatbotMessages: 200,
    searches: 100,
    features: ["Unlimited AI Text", "More Images", "Advanced Chatbot"],
  },
  [SUBSCRIPTION_TYPES.PRO]: {
    textGeneration: 50000,
    imageGeneration: 300,
    chatbotMessages: 2000,
    searches: 1000,
    features: ["Unlimited Everything", "Priority Support", "API Access"],
  },
};

export const BILLING_CYCLES = {
  MONTHLY: "monthly",
  YEARLY: "yearly",
};

export default {
  SUBSCRIPTION_TYPES,
  SUBSCRIPTION_LIMITS,
  BILLING_CYCLES,
};
