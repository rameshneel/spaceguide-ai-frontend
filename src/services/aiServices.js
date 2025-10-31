import api, { refreshToken } from "./api";

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
      const token = localStorage.getItem("accessToken");

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
        console.log(
          "🔄 401 Error in SSE request. Attempting to refresh token..."
        );

        const refreshSuccess = await refreshToken();

        if (refreshSuccess) {
          // Retry the request once after successful refresh
          console.log("🔄 Retrying SSE request after token refresh...");
          return makeRequest(1); // Retry with retryCount = 1
        } else {
          // Refresh failed, throw error
          const errorData = await response.json().catch(() => ({
            message: "Access token expired. Please login again.",
          }));
          throw new Error(errorData.message || "Authentication failed");
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
                onError?.(data.error);
                return;
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
              console.error("Error parsing SSE data:", e);
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
    return response.data;
  },

  // AI Search
  search: async (query) => {
    const response = await api.post("/services/search", { query });
    return response.data;
  },

  // AI Chatbot
  chat: async (message, chatbotId) => {
    const response = await api.post("/services/chatbot/chat", {
      message,
      chatbotId,
    });
    return response.data;
  },

  // Get service status
  getServiceStatus: async () => {
    const response = await api.get("/services/status");
    return response.data;
  },
};
