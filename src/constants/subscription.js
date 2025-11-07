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

/**
 * Fallback plans used when API fails to load subscription plans
 * This ensures the UI always has plan data to display
 */
export const FALLBACK_PLANS = [
  {
    _id: "free",
    name: "free",
    displayName: "Free Plan",
    price: { monthly: 0 },
    isPopular: false,
    features: {
      aiTextWriter: { wordsPerDay: 500 },
      aiImageGenerator: { imagesPerDay: 3 },
      aiSearch: { searchesPerDay: 10 },
      aiChatbot: { messagesPerDay: 20 },
    },
  },
  {
    _id: "basic",
    name: "basic",
    displayName: "Basic Plan",
    price: { monthly: 29 },
    isPopular: true,
    features: {
      aiTextWriter: { wordsPerDay: 10000 },
      aiImageGenerator: { imagesPerDay: 25 },
      aiSearch: { searchesPerDay: 100 },
      aiChatbot: { messagesPerDay: 500 },
    },
  },
  {
    _id: "pro",
    name: "pro",
    displayName: "Pro Plan",
    price: { monthly: 79 },
    isPopular: false,
    features: {
      aiTextWriter: { wordsPerDay: 50000 },
      aiImageGenerator: { imagesPerDay: 150 },
      aiSearch: { searchesPerDay: 500 },
      aiChatbot: { messagesPerDay: 3000 },
    },
  },
];

export default {
  SUBSCRIPTION_TYPES,
  SUBSCRIPTION_LIMITS,
  BILLING_CYCLES,
  FALLBACK_PLANS,
};
