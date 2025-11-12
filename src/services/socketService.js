import { io } from "socket.io-client";
import { toast } from "react-hot-toast";
import logger from "../utils/logger";
import { getAuthToken, cleanToken, isValidTokenFormat } from "../utils/token";
import { EVENTS } from "../constants/events";
import { TIMING } from "../constants/timing";
import { ERROR_MESSAGES } from "../constants/messages";

// Socket.IO needs to connect to the root server, not to /api namespace
// So we strip /api from the URL if it exists
const getSocketIOUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  // Remove /api suffix if present (Socket.IO connects to root namespace)
  return apiUrl.replace(/\/api\/?$/, "");
};

const SOCKET_IO_URL = getSocketIOUrl();

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.isConnecting = false; // Prevent multiple simultaneous connections
    this.listeners = new Map(); // Store event listeners for cleanup
    this.connectionAttempts = 0;
    this.maxConnectionAttempts = 3;
    this.lastUsedToken = null; // Track last token used for connection
    this.isRetryingAfterAuthError = false; // Prevent infinite retry loop
  }

  // Check if token is valid (basic JWT format check)
  // Uses utility function from token.js
  isValidToken(token) {
    return isValidTokenFormat(token);
  }

  // Connect to Socket.IO server
  connect(token) {
    // Prevent multiple simultaneous connection attempts
    if (this.isConnecting) {
      logger.debug("Socket.IO connection already in progress...");
      return;
    }

    // If already connected, don't reconnect
    if (this.socket?.connected) {
      logger.debug("Socket already connected");
      return;
    }

    // Disconnect existing connection if any (but not connected)
    if (this.socket && !this.socket.connected) {
      this.disconnect();
    }

    // Get token using utility function
    const accessToken = getAuthToken(token);

    if (!accessToken) {
      logger.warn("No token available for Socket.IO connection");
      return;
    }

    // Remove "Bearer " prefix if present (backend expects clean token)
    const cleanTokenValue = cleanToken(accessToken);

    // Validate token format before attempting connection
    if (!this.isValidToken(cleanTokenValue)) {
      logger.error("Invalid token format for Socket.IO connection");
      this.isConnected = false;
      this.isConnecting = false;
      return;
    }

    // Check network status (but allow localhost connections even if navigator.onLine is false)
    // Note: navigator.onLine can be unreliable, especially for localhost
    const isLocalhost =
      SOCKET_IO_URL.includes("localhost") ||
      SOCKET_IO_URL.includes("127.0.0.1");
    if (typeof navigator !== "undefined" && !navigator.onLine && !isLocalhost) {
      logger.warn(
        "Network appears offline. Skipping Socket.IO connection attempt."
      );
      this.isConnected = false;
      this.isConnecting = false;
      return;
    }

    // Check connection attempts
    if (this.connectionAttempts >= this.maxConnectionAttempts) {
      logger.error(
        `Max connection attempts (${this.maxConnectionAttempts}) reached. Please refresh the page.`
      );
      this.isConnected = false;
      this.isConnecting = false;
      return;
    }

    // Update last used token BEFORE connecting
    this.lastUsedToken = cleanTokenValue;

    this.isConnecting = true;
    this.connectionAttempts++;

    try {
      this.socket = io(SOCKET_IO_URL, {
        transports: ["websocket", "polling"],
        auth: {
          token: cleanTokenValue, // Clean token without Bearer prefix
        },
        extraHeaders: {
          // Also pass in headers as fallback (best practice)
          Authorization: `Bearer ${cleanTokenValue}`,
        },
        autoConnect: true,
        reconnection: false, // Disable auto-reconnection (we handle it manually)
        reconnectionDelay: 2000,
        reconnectionAttempts: 0,
        timeout: TIMING.SOCKET_RECONNECTION_TIMEOUT,
        withCredentials: true, // Include cookies
      });

      this.setupEventHandlers();
      this.isConnected = false; // Will be set to true on connect event
      logger.info(
        `Socket.IO connecting with token... (attempt ${this.connectionAttempts}/${this.maxConnectionAttempts})`
      );
    } catch (error) {
      logger.error("Socket.IO connection error:", error);
      this.isConnected = false;
      this.isConnecting = false;
    }
  }

  // Setup event handlers
  setupEventHandlers() {
    if (!this.socket) return;

    // Connection successful
    this.socket.on("connect", () => {
      logger.info("Socket.IO connected:", this.socket.id);
      this.isConnected = true;
      this.isConnecting = false;
      this.connectionAttempts = 0; // Reset on successful connection
      this.isRetryingAfterAuthError = false; // Reset retry flag on success

      // Update last used token on successful connection
      const currentToken = getAuthToken(); // Use utility function
      if (currentToken) {
        this.lastUsedToken = cleanToken(currentToken);
      }

      // Listen for server token refresh confirmations
      this.socket.on("token_refreshed", (data) => {
        logger.info("✅ Server confirmed token refresh:", data);
      });

      this.socket.on("token_refresh_error", (error) => {
        logger.error("❌ Server token refresh error:", error);
      });
    });

    // Connection error
    this.socket.on("connect_error", (error) => {
      logger.error("Socket.IO connection error:", error.message || error);
      this.isConnected = false;
      this.isConnecting = false;

      // If auth error, check if token refresh is in progress
      if (
        error.message?.includes("Invalid authentication token") ||
        error.message?.includes("Authentication token required")
      ) {
        // Prevent infinite retry loop
        if (this.isRetryingAfterAuthError) {
          logger.warn(
            "Already retrying after auth error, skipping to prevent loop"
          );
          return;
        }

        logger.error(
          "Authentication failed. Waiting for token refresh event (not auto-retrying to prevent loop)..."
        );

        // Don't auto-retry here - let the token-refreshed event handle reconnection
        // This prevents infinite loops
        this.isRetryingAfterAuthError = true;

        // Only reset the flag after a delay, allowing token-refreshed event to handle reconnection
        setTimeout(() => {
          // Check if token changed (was refreshed)
          const currentToken = getAuthToken();
          const tokenChanged =
            currentToken && cleanToken(currentToken) !== this.lastUsedToken;

          if (!tokenChanged) {
            // Token not changed - no refresh happened, stop trying
            logger.error(
              "Token not refreshed. Waiting for token-refreshed event or user login."
            );
            this.isRetryingAfterAuthError = false; // Allow future retries if token actually changes
          } else {
            // Token changed - reset flag to allow connection via token-refreshed event
            logger.info(
              "Token changed detected, but waiting for token-refreshed event to handle reconnection..."
            );
            this.isRetryingAfterAuthError = false;
          }
        }, TIMING.SOCKET_RECONNECTION_TIMEOUT);
      }
    });

    // Disconnected
    this.socket.on("disconnect", (reason) => {
      logger.info("Socket.IO disconnected:", reason);
      this.isConnected = false;
    });

    // Reconnection attempt
    this.socket.on("reconnect_attempt", () => {
      logger.info("Socket.IO reconnecting...");
    });

    // Reconnection successful
    this.socket.on("reconnect", (attemptNumber) => {
      logger.info(`Socket.IO reconnected after ${attemptNumber} attempts`);
      this.isConnected = true;
    });

    // Usage warning (80% threshold)
    this.socket.on("usage_warning", (data) => {
      logger.info("Usage warning received:", data);

      // Show toast notification
      const message =
        data.message ||
        `You've used ${data.usage?.percentage || 0}% of your daily limit`;
      if (data.usage?.percentage >= 95) {
        toast.error(message, {
          duration: 5000,
          icon: "⚠️",
        });
      } else {
        toast(message, {
          duration: 5000,
          icon: "📊",
        });
      }

      // Emit custom event for components to listen
      window.dispatchEvent(
        new CustomEvent(EVENTS.USAGE_WARNING, { detail: data })
      );
    });

    // Usage limit warning (request will exceed limit)
    this.socket.on("usage_limit_warning", (data) => {
      logger.warn("Usage limit warning received:", data);

      toast.error(data.message || ERROR_MESSAGES.LIMIT_WARNING, {
        duration: 6000,
        icon: "⚠️",
      });

      // Emit custom event
      window.dispatchEvent(
        new CustomEvent(EVENTS.USAGE_LIMIT_WARNING, { detail: data })
      );
    });

    // Usage limit exceeded (100% reached)
    this.socket.on("usage_limit_exceeded", (data) => {
      logger.warn("Socket.IO: Usage limit exceeded event received:", data);

      // Show toast notification
      toast.error(data.message || ERROR_MESSAGES.LIMIT_EXCEEDED, {
        duration: 8000,
        icon: "🚫",
      });

      // Emit custom event with proper structure
      const eventData = {
        ...data,
        service: data.service || "ai_text_writer",
        usage: data.usage || {
          used: 0,
          limit: 0,
          percentage: 100,
        },
        limitExceeded: true,
      };

      logger.debug(
        "Socket.IO: Dispatching usage-limit-exceeded event:",
        eventData
      );
      window.dispatchEvent(
        new CustomEvent(EVENTS.USAGE_LIMIT_EXCEEDED, {
          detail: eventData,
        })
      );
    });

    // Usage updated (after generation)
    this.socket.on("usage_updated", (data) => {
      logger.debug("Usage updated:", data);

      // Emit custom event for components to update UI
      window.dispatchEvent(
        new CustomEvent(EVENTS.USAGE_UPDATED, { detail: data })
      );
    });

    // AI service events
    this.socket.on("ai_text_generation_start", (data) => {
      logger.debug("AI text generation started:", data);
    });

    this.socket.on("ai_service_complete", (data) => {
      logger.debug("AI service completed:", data);
    });
  }

  // Disconnect from Socket.IO server
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket.removeAllListeners(); // Clean up all listeners
      this.socket = null;
      this.isConnected = false;
      this.isConnecting = false;
      this.connectionAttempts = 0; // Reset attempts
      logger.info("Socket.IO disconnected");
    }
  }

  // Reset connection state (for retry after token refresh)
  resetConnectionState() {
    this.connectionAttempts = 0;
    this.isConnecting = false;
    this.isConnected = false;
    this.isRetryingAfterAuthError = false; // Reset retry flag
    // Don't reset lastUsedToken - we need to track it to detect token changes
  }

  // Emit event to server
  emit(event, data) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      logger.warn(`Cannot emit ${event}: Socket not connected`);
    }
  }

  // Listen to event from server
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);

      // Store listener for cleanup
      if (!this.listeners.has(event)) {
        this.listeners.set(event, []);
      }
      this.listeners.get(event).push(callback);
    }
  }

  // Remove event listener
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);

      // Remove from listeners map
      if (this.listeners.has(event)) {
        const callbacks = this.listeners.get(event);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    }
  }

  // Check if connected
  connected() {
    return this.isConnected && this.socket?.connected;
  }
}

// Export singleton instance
const socketService = new SocketService();
export default socketService;
