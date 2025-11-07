import { useEffect, useState, useRef } from "react";
import { WifiOff, Wifi } from "lucide-react";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { toast } from "react-hot-toast";

/**
 * Network Status Indicator Component
 * Shows a banner when network connection is lost/restored
 * Industry best practice: Non-intrusive network status feedback
 */
const NetworkStatusIndicator = () => {
  const { isOnline, wasOffline } = useNetworkStatus();
  const [showBanner, setShowBanner] = useState(false);
  const toastIdRef = useRef(null); // Use ref instead of state to prevent re-renders
  const hasShownOfflineToast = useRef(false); // Track if we've already shown offline toast

  useEffect(() => {
    if (!isOnline) {
      // Show banner when going offline
      setShowBanner(true);

      // Show toast notification ONLY ONCE when going offline
      if (!hasShownOfflineToast.current) {
        const toastId = "network-offline-toast"; // Fixed ID to prevent duplicates
        hasShownOfflineToast.current = true;

        // Check if toast.isActive exists and is a function (version compatibility)
        const isToastActive =
          typeof toast.isActive === "function"
            ? toast.isActive(toastId)
            : false;

        // Only show toast if not already active (or if isActive not available, rely on hasShownOfflineToast)
        if (!isToastActive) {
          const id = toast.error(
            "No internet connection. Some features may not work.",
            {
              id: toastId, // Use fixed ID
              duration: Infinity, // Keep until connection restored
              icon: <WifiOff className="w-5 h-5" />,
            }
          );
          toastIdRef.current = id;
        }
      }
    } else {
      // Hide banner when coming back online
      setShowBanner(false);

      // Always dismiss offline toast when internet comes back (regardless of wasOffline flag)
      const toastId = "network-offline-toast";

      // Try multiple ways to dismiss the toast to ensure it's removed
      if (typeof toast.isActive === "function" && toast.isActive(toastId)) {
        toast.dismiss(toastId);
      } else if (toastIdRef.current) {
        // Fallback: dismiss by ref if isActive not available
        toast.dismiss(toastIdRef.current);
      } else {
        // Last resort: dismiss by ID directly
        toast.dismiss(toastId);
      }

      // Reset flags only if we had shown the offline toast
      if (hasShownOfflineToast.current) {
        hasShownOfflineToast.current = false;
        toastIdRef.current = null;

        // Show success toast only if we were previously offline
        if (wasOffline) {
          toast.success("Internet connection restored!", {
            duration: 3000,
            icon: <Wifi className="w-5 h-5" />,
          });
        }
      }
    }
  }, [isOnline, wasOffline]); // Removed toastId from dependencies

  // Don't render banner if online
  if (isOnline || !showBanner) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-orange-500 text-white px-4 py-2 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
        <WifiOff className="w-5 h-5" />
        <span className="text-sm font-medium">
          No internet connection. Please check your network.
        </span>
      </div>
    </div>
  );
};

export default NetworkStatusIndicator;
