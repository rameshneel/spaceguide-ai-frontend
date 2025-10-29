import api from "./api";

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
    const token = localStorage.getItem("accessToken");

    try {
      const response = await fetch(
        `${API_BASE_URL}/services/text/generate-stream`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
          credentials: "include", // For cookies
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
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

              // Regular chunk
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
