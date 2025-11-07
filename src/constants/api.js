/**
 * API Endpoint Constants
 */

const API_BASE = "/api";

export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    REGISTER: `${API_BASE}/auth/register`,
    LOGIN: `${API_BASE}/auth/login`,
    LOGOUT: `${API_BASE}/auth/logout`,
    PROFILE: `${API_BASE}/auth/profile`,
    REFRESH: `${API_BASE}/auth/refresh`,
  },

  // Subscription
  SUBSCRIPTION: {
    PLANS: `${API_BASE}/subscription/plans`,
    CURRENT: `${API_BASE}/subscription/current`,
    USAGE: `${API_BASE}/subscription/usage`,
    START_TRIAL: `${API_BASE}/subscription/trial/start`,
    UPGRADE: `${API_BASE}/subscription/upgrade`,
    CANCEL: `${API_BASE}/subscription/cancel`,
  },

  // AI Services
  AI: {
    TEXT_GENERATE: `${API_BASE}/ai/text/generate`,
    IMAGE_GENERATE: `${API_BASE}/ai/image/generate`,
    SEARCH: `${API_BASE}/ai/search`,
    CHAT: `${API_BASE}/ai/chat`,
    STATUS: `${API_BASE}/ai/service-status`,
  },

  // Chatbot
  CHATBOT: {
    LIST: `${API_BASE}/chatbot`,
    GET: (id) => `${API_BASE}/chatbot/${id}`,
    QUERY: (id) => `${API_BASE}/chatbot/${id}/query`,
    CONVERSATIONS: (id) => `${API_BASE}/chatbot/${id}/conversations`,
  },
};

export default API_ENDPOINTS;
