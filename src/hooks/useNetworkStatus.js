import { useState, useEffect } from "react";
import logger from "../utils/logger";

/**
 * Custom hook to monitor network connectivity status
 * Industry best practice: Use browser's online/offline API
 *
 * @returns {Object} Network status object with isOnline and wasOffline flags
 */
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    // Handle online event
    const handleOnline = () => {
      logger.info("Network connection restored");
      setIsOnline(true);
      if (wasOffline) {
        // Connection was restored after being offline
        setWasOffline(false);
        // Optionally reload page or refresh data
        // window.location.reload();
      }
    };

    // Handle offline event
    const handleOffline = () => {
      logger.warn("Network connection lost");
      setIsOnline(false);
      setWasOffline(true);
    };

    // Add event listeners
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [wasOffline]);

  return { isOnline, wasOffline };
};

export default useNetworkStatus;
