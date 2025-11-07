import { useEffect, useRef } from "react";
import socketService from "../services/socketService";
import useAuthStore from "../store/useAuthStore";
import logger from "../utils/logger";
import { getAuthToken } from "../utils/token";
import { EVENTS } from "../constants/events";
import { TIMING } from "../constants/timing";

/**
 * Custom hook for Socket.IO connection
 * Automatically connects when user is authenticated and disconnects on logout
 */
export const useSocket = () => {
  const { user, token } = useAuthStore();
  const hasInitialized = useRef(false);
  const previousTokenRef = useRef(null);

  useEffect(() => {
    // Listen for token refresh events
    const handleTokenRefresh = async (event) => {
      const newToken = event.detail?.token;
      if (newToken && user) {
        logger.info(
          "Token refreshed event received, reconnecting Socket.IO with new token..."
        );

        // Disconnect existing connection immediately
        socketService.disconnect();

        // Reset connection state
        socketService.resetConnectionState();

        // Small delay to ensure disconnect completes
        await new Promise((resolve) =>
          setTimeout(resolve, TIMING.TOKEN_REFRESH_DELAY)
        );

        // Update previous token ref to new token
        previousTokenRef.current = newToken;

        // Connect with new token
        logger.info("Connecting Socket.IO with refreshed token...");
        // Reset retry flag before connecting to allow fresh attempt
        socketService.isRetryingAfterAuthError = false;
        socketService.connect(newToken);

        // Set up one-time listeners for server confirmation (before connection check)
        const handleTokenRefreshed = (data) => {
          logger.info("✅ Token refreshed on server:", data);
          // Remove listener after receiving confirmation
          socketService.off("token_refreshed", handleTokenRefreshed);
        };

        const handleTokenRefreshError = (error) => {
          logger.error("❌ Token refresh failed on server:", error);
          // Remove listener after receiving error
          socketService.off("token_refresh_error", handleTokenRefreshError);
        };

        // Set up listeners immediately (they'll only fire when server responds)
        socketService.on("token_refreshed", handleTokenRefreshed);
        socketService.on("token_refresh_error", handleTokenRefreshError);

        // Wait for connection, then emit refresh_token to server
        let connectionCheckCount = 0;
        const maxConnectionChecks = 50; // 5 seconds max (50 * 100ms)

        const checkConnection = setInterval(() => {
          connectionCheckCount++;

          if (socketService.connected()) {
            clearInterval(checkConnection);
            logger.info(
              "Socket.IO connected, emitting refresh_token to server..."
            );

            // Emit refresh_token event to server to update token on backend
            socketService.emit("refresh_token", { accessToken: newToken });
          } else if (connectionCheckCount >= maxConnectionChecks) {
            // Timeout - clear interval and remove listeners
            clearInterval(checkConnection);
            socketService.off("token_refreshed", handleTokenRefreshed);
            socketService.off("token_refresh_error", handleTokenRefreshError);
            logger.warn("Socket.IO connection timeout after token refresh");
          }
        }, 100);

        // Reset initialization flag to allow reconnection
        hasInitialized.current = false;
      }
    };

    window.addEventListener(EVENTS.TOKEN_REFRESHED, handleTokenRefresh);

    // Get token using utility function
    const accessToken = getAuthToken(token);

    // Check if token changed (login/logout scenario)
    const tokenChanged = previousTokenRef.current !== accessToken;
    previousTokenRef.current = accessToken;

    // Connect if user is authenticated and has token
    if (user && accessToken) {
      // If token changed or not initialized, connect/reconnect
      if (!hasInitialized.current || tokenChanged) {
        logger.info(
          "Initializing Socket.IO connection...",
          tokenChanged ? "(token changed)" : ""
        );

        // Disconnect existing connection if token changed
        if (tokenChanged && hasInitialized.current) {
          socketService.disconnect();
        }

        socketService.resetConnectionState(); // Reset before new connection
        socketService.connect(accessToken);
        hasInitialized.current = true;
      } else if (!socketService.connected() && !socketService.isConnecting) {
        // Only reconnect if not already connecting and disconnected
        // Add small delay to prevent rapid reconnection attempts
        const reconnectTimer = setTimeout(() => {
          if (
            !socketService.connected() &&
            !socketService.isConnecting &&
            user &&
            accessToken
          ) {
            logger.info("Reconnecting Socket.IO...");
            socketService.resetConnectionState(); // Reset before reconnect
            socketService.connect(accessToken);
          }
        }, TIMING.SOCKET_RECONNECTION_TIMEOUT);

        return () => clearTimeout(reconnectTimer);
      }
    } else {
      // Disconnect if user logs out or no token
      if (hasInitialized.current) {
        logger.info("Disconnecting Socket.IO (user logged out or no token)...");
        socketService.disconnect();
        hasInitialized.current = false;
        previousTokenRef.current = null; // Reset token ref
      }
    }

    // Cleanup on unmount
    return () => {
      window.removeEventListener(EVENTS.TOKEN_REFRESHED, handleTokenRefresh);
      // Don't disconnect on unmount - keep connection alive during navigation
      // Only disconnect on explicit logout
    };
  }, [user, token]);

  return {
    socket: socketService,
    isConnected: socketService.connected(),
  };
};

export default useSocket;
