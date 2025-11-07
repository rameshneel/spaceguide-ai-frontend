import api, { refreshToken } from "./api";
import logger from "../utils/logger";
import { getAuthToken } from "../utils/token";
import { EVENTS } from "../constants/events";
import { ERROR_MESSAGES } from "../constants/messages";

export const aiServices = {
  // Get AI service options (content types, tones, lengths)
  getServiceOptions: async () => {
    const response = await api.get("/services/text/options");
    return response.data.data || response.data;
  },

  // AI Text Writer (Non-streaming)
  generateText: async (data) => {
    const response = await api.post("/services/text/generate", data);
    return response.data;
  },

  // AI Text Writer with Streaming (SSE)
  generateTextStream: async (data, onChunk, onComplete, onError) => {
    const API_BASE_URL =
      import.meta.env.VITE_API_URL || "http://localhost:5000/api";

    // Helper function to make fetch request with retry logic
    const makeRequest = async (retryCount = 0) => {
      const token = getAuthToken(); // Use utility function

      const response = await fetch(
        `${API_BASE_URL}/services/text/generate-stream`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(data),
          credentials: "include", // For cookies
        }
      );

      // Handle 401 Unauthorized - try to refresh token once
      if (response.status === 401 && retryCount === 0) {
        logger.info("401 Error in SSE request. Attempting to refresh token...");

        const refreshSuccess = await refreshToken();

        if (refreshSuccess) {
          // Retry the request once after successful refresh
          logger.info("Retrying SSE request after token refresh...");
          return makeRequest(1); // Retry with retryCount = 1
        } else {
          // Refresh failed, throw error
          const errorData = await response.json().catch(() => ({
            message: ERROR_MESSAGES.TOKEN_EXPIRED,
          }));
          throw new Error(errorData.message || ERROR_MESSAGES.AUTH_FAILED);
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: `HTTP error! status: ${response.status}`,
        }));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      return response;
    };

    try {
      const response = await makeRequest();

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");

        // Keep the last incomplete line in buffer
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.trim().startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6)); // Remove "data: " prefix

              if (data.error) {
                logger.warn("SSE Error received:", data);

                // Check if it's a limit exceeded error
                const isLimitError =
                  data.limitExceeded ||
                  data.limitWarning ||
                  data.error?.toLowerCase().includes("limit") ||
                  data.error?.toLowerCase().includes("exceeded") ||
                  data.error?.toLowerCase().includes("upgrade");

                if (isLimitError) {
                  logger.warn(
                    "Limit exceeded detected in SSE, emitting event with data:",
                    data
                  );

                  // Emit custom event for upgrade modal with proper structure
                  const eventData = {
                    service: "ai_text_writer",
                    usage: data.usage || {
                      used: data.usage?.used || 0,
                      limit: data.usage?.limit || 0,
                      percentage: data.usage?.percentage || 100,
                      remaining: data.usage?.remaining || 0,
                    },
                    message: data.error || ERROR_MESSAGES.LIMIT_EXCEEDED,
                    limitExceeded: true,
                    timestamp: new Date(),
                  };

                  logger.debug(
                    "SSE: Dispatching usage-limit-exceeded event:",
                    eventData
                  );

                  // Dispatch event immediately (before calling onError)
                  window.dispatchEvent(
                    new CustomEvent(EVENTS.USAGE_LIMIT_EXCEEDED, {
                      detail: eventData,
                    })
                  );

                  // Also call onError to handle UI state
                  onError?.(data.error);
                  return;
                } else {
                  // Not a limit error, just handle normally
                  onError?.(data.error);
                  return;
                }
              }

              if (data.done) {
                onComplete?.(data);
                return;
              }

              // Regular chunk - process immediately (best practice)
              // Throttling happens at animation level, not here
              if (data.chunk !== undefined) {
                onChunk?.(data.chunk, data.partial || "");
              }
            } catch (e) {
              logger.error("Error parsing SSE data:", e);
            }
          }
        }
      }
    } catch (error) {
      onError?.(error.message);
    }
  },

  // AI Image Generator
  generateImage: async (data) => {
    const response = await api.post("/services/image/generate", data);
    return response.data.data || response.data;
  },

  // Get Image Generator Options (Sizes, Qualities, Styles)
  getImageOptions: async () => {
    const response = await api.get("/services/image/options");
    return response.data.data || response.data;
  },

  // Get Image Generation History
  getImageHistory: async (limit = 10, page = 1) => {
    const response = await api.get(
      `/services/image/history?limit=${limit}&page=${page}`
    );
    return response.data.data || response.data;
  },

  // AI Search
  search: async (query) => {
    const response = await api.post("/services/search", { query });
    return response.data;
  },

  // AI Chatbot - Get chatbot templates
  getChatbotTemplates: async () => {
    const response = await api.get("/chatbot/templates");
    return response.data.data || response.data;
  },

  // AI Chatbot - Get user's chatbots
  getChatbots: async () => {
    const response = await api.get("/chatbot");
    return response.data.data || response.data;
  },

  // AI Chatbot - Create chatbot
  createChatbot: async (data) => {
    const response = await api.post("/chatbot", data);
    return response.data.data || response.data;
  },

  // AI Chatbot - Get chatbot by ID
  getChatbot: async (chatbotId) => {
    const response = await api.get(`/chatbot/${chatbotId}`);
    return response.data.data || response.data;
  },

  // AI Chatbot - Update chatbot
  updateChatbot: async (chatbotId, data) => {
    const response = await api.put(`/chatbot/${chatbotId}`, data);
    return response.data.data || response.data;
  },

  // AI Chatbot - Delete chatbot
  deleteChatbot: async (chatbotId) => {
    const response = await api.delete(`/chatbot/${chatbotId}`);
    return response.data.data || response.data;
  },

  // AI Chatbot - Train with file (PDF/TXT)
  trainChatbotFile: async (chatbotId, file) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post(
      `/chatbot/${chatbotId}/train/file`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data.data || response.data;
  },

  // AI Chatbot - Train with text
  trainChatbotText: async (chatbotId, text) => {
    const response = await api.post(`/chatbot/${chatbotId}/train/text`, {
      text,
    });
    return response.data.data || response.data;
  },

  // AI Chatbot - Get widget code
  getWidgetCode: async (chatbotId) => {
    const response = await api.get(`/chatbot/${chatbotId}/widget`);
    return response.data.data || response.data;
  },

  // AI Chatbot - Update widget settings
  updateWidgetSettings: async (chatbotId, settings) => {
    const response = await api.put(`/chatbot/${chatbotId}/widget`, {
      settings,
    });
    return response.data.data || response.data;
  },

  // AI Chatbot - Get documents (training data)
  getChatbotDocuments: async (
    chatbotId,
    limit = 50,
    offset = 0,
    search = null
  ) => {
    const params = new URLSearchParams({ limit, offset });
    if (search) params.append("search", search);
    const response = await api.get(
      `/chatbot/${chatbotId}/documents?${params.toString()}`
    );
    return response.data.data || response.data;
  },

  // AI Chatbot - Update document
  updateChatbotDocument: async (chatbotId, documentId, text) => {
    const response = await api.put(
      `/chatbot/${chatbotId}/documents/${documentId}`,
      {
        text,
      }
    );
    return response.data.data || response.data;
  },

  // AI Chatbot - Delete documents
  deleteChatbotDocuments: async (chatbotId, documentIds) => {
    const response = await api.delete(`/chatbot/${chatbotId}/documents`, {
      data: { documentIds },
    });
    return response.data.data || response.data;
  },

  // AI Chatbot - Query chatbot (for testing)
  queryChatbot: async (chatbotId, query, sessionId = null) => {
    const body = {
      query,
    };
    // Only include sessionId if it's not null/undefined and not empty
    if (sessionId && sessionId.trim()) {
      body.sessionId = sessionId.trim();
    }
    const response = await api.post(`/chatbot/${chatbotId}/query`, body);
    return response.data.data || response.data;
  },

  // AI Chatbot - Get conversation history
  getConversationHistory: async (chatbotId, sessionId = null) => {
    const params = sessionId ? `?sessionId=${sessionId}` : "";
    const response = await api.get(
      `/chatbot/${chatbotId}/conversations${params}`
    );
    return response.data.data || response.data;
  },

  // Get service status
  getServiceStatus: async () => {
    const response = await api.get("/services/status");
    return response.data;
  },

  // Get text generation history
  getTextHistory: async (limit = 10, page = 1) => {
    const response = await api.get(
      `/services/text/history?limit=${limit}&page=${page}`
    );
    return response.data.data || response.data;
  },
};
