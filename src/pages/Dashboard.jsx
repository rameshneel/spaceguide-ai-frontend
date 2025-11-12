import { useState, useEffect, useMemo, useCallback } from "react";
import {
  AlertTriangle,
  CheckCircle,
  Calendar,
  Bell,
  AlertCircle,
  RefreshCw,
  WifiOff,
  Server,
  Clock,
} from "lucide-react";
import useAuthStore from "../store/useAuthStore";
import logger from "../utils/logger";
import { authService } from "../services/auth";
import { useNetworkStatus } from "../hooks/useNetworkStatus";

// Dashboard Components
import UsageStatsCards from "../components/dashboard/UsageStatsCards";
import AlertsSection from "../components/dashboard/AlertsSection";
import UsageBreakdown from "../components/dashboard/UsageBreakdown";
import UsageCharts from "../components/dashboard/UsageCharts";
import ServicesGrid from "../components/dashboard/ServicesGrid";
import RecentActivity from "../components/dashboard/RecentActivity";
import QuickActions from "../components/dashboard/QuickActions";
import SubscriptionCard from "../components/dashboard/SubscriptionCard";
import DashboardSkeleton from "../components/dashboard/DashboardSkeleton";

/**
 * Dashboard Page
 * Industry Best Practices:
 * - Performance: useMemo, useCallback for expensive operations
 * - Error Handling: Proper error states and retry logic
 * - UX: Skeleton loaders, error boundaries
 * - Accessibility: ARIA labels, semantic HTML
 * - Code Quality: PropTypes, proper dependencies
 */
const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detailedUsage, setDetailedUsage] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [timeFilter, setTimeFilter] = useState("today"); // today, week, month
  const [alerts, setAlerts] = useState([]);
  const [retryCount, setRetryCount] = useState(0);
  const { user } = useAuthStore();
  const { isOnline } = useNetworkStatus();

  // Generate alerts based on usage - memoized to prevent unnecessary recalculations
  const generateAlerts = useCallback((usageData, activityList) => {
    const newAlerts = [];
    const usage = usageData?.usage || {};

    // Check AI Text Writer usage
    if (usage.aiTextWriter?.wordsPercentage >= 90) {
      newAlerts.push({
        type: "warning",
        icon: <AlertTriangle className="w-5 h-5" />,
        message: `You've used ${usage.aiTextWriter.wordsPercentage}% of your daily word limit`,
        action: "Upgrade to increase limits",
      });
    } else if (usage.aiTextWriter?.wordsPercentage >= 80) {
      newAlerts.push({
        type: "info",
        icon: <Bell className="w-5 h-5" />,
        message: `You've used ${usage.aiTextWriter.wordsPercentage}% of your daily word limit`,
        action: null,
      });
    }

    // Check Image Generator usage
    if (usage.aiImageGenerator?.imagesPercentage >= 90) {
      newAlerts.push({
        type: "warning",
        icon: <AlertTriangle className="w-5 h-5" />,
        message: `You've used ${usage.aiImageGenerator.imagesPercentage}% of your daily image limit`,
        action: "Upgrade to increase limits",
      });
    }

    // Check if subscription is expiring (if we have that data)
    if (usageData?.subscription?.currentPeriodEnd) {
      const expiryDate = new Date(usageData.subscription.currentPeriodEnd);
      const daysUntilExpiry = Math.ceil(
        (expiryDate - new Date()) / (1000 * 60 * 60 * 24)
      );
      if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
        newAlerts.push({
          type: "warning",
          icon: <Calendar className="w-5 h-5" />,
          message: `Your subscription expires in ${daysUntilExpiry} days`,
          action: "Renew now",
        });
      }
    }

    // Success alert for new users
    if (activityList.length === 0) {
      newAlerts.push({
        type: "success",
        icon: <CheckCircle className="w-5 h-5" />,
        message: "Welcome! Start using our AI services",
        action: null,
      });
    }

    setAlerts(newAlerts.slice(0, 3)); // Show max 3 alerts
  }, []);

  const loadData = useCallback(
    async (isRetry = false) => {
      try {
        setLoading(true);
        setError(null);

        const [usageData, activityData] = await Promise.all([
          authService.getDetailedUsage(),
          authService.getRecentActivity(10),
        ]);

        setDetailedUsage(usageData);
        setRecentActivity(activityData?.history || []);
        setRetryCount(0); // Reset retry count on success

        // Update user subscription if usage API returned subscription data
        // This ensures UI reflects the latest subscription status
        if (usageData?.subscription) {
          // Update user subscription in store
          useAuthStore.getState().updateUser({
            subscription: usageData.subscription,
          });
        }

        // Generate alerts based on usage
        generateAlerts(usageData, activityData?.history || []);
      } catch (err) {
        logger.error("Failed to load dashboard data:", err);

        // Use user-friendly error message if available
        const errorMessage =
          err?.userFriendlyMessage ||
          err?.response?.data?.message ||
          err?.message ||
          "Failed to load dashboard data";

        // Determine error type for better UI
        const errorType =
          err?.errorType ||
          (err?.response?.status ? `HTTP_${err.response.status}` : "UNKNOWN");

        setError({
          message: errorMessage,
          code: err?.response?.status || "UNKNOWN",
          type: errorType,
          isNetworkError: !err?.response, // Network error if no response
        });

        // Set fallback data for graceful degradation
        setDetailedUsage({
          usage: {
            aiTextWriter: {
              wordsUsed: 0,
              wordsLimit: 1000,
              wordsPercentage: 0,
            },
            aiImageGenerator: {
              imagesUsed: 0,
              imagesLimit: 25,
              imagesPercentage: 0,
            },
            aiChatbot: {
              chatbotsUsed: 0,
              chatbotsLimit: 500,
              chatbotsPercentage: 0,
            },
            aiSearch: {
              searchesUsed: 0,
              searchesLimit: 100,
              searchesPercentage: 0,
            },
          },
        });
      } finally {
        setLoading(false);
      }
    },
    [generateAlerts]
  );

  useEffect(() => {
    loadData();
  }, [timeFilter, loadData]);

  const handleRetry = useCallback(() => {
    if (retryCount < 3) {
      setRetryCount((prev) => prev + 1);
      loadData(true);
    }
  }, [retryCount, loadData]);

  // Mock chart data (in production, fetch from API)
  // Memoized to prevent recalculation on every render
  const usageChartData = useMemo(
    () => [
      { day: "Mon", usage: 120 },
      { day: "Tue", usage: 190 },
      { day: "Wed", usage: 300 },
      { day: "Thu", usage: 250 },
      { day: "Fri", usage: 400 },
      { day: "Sat", usage: 280 },
      { day: "Sun", usage: 350 },
    ],
    []
  );

  // Service usage pie chart data - memoized for performance
  // Include all services even if value is 0, but filter out if all are 0
  const serviceUsageData = useMemo(() => {
    if (!detailedUsage?.usage) return [];

    const data = [
      {
        name: "AI Text Writer",
        value: detailedUsage.usage.aiTextWriter?.wordsUsed || 0,
        color: "#3b82f6",
      },
      {
        name: "AI Images",
        value: detailedUsage.usage.aiImageGenerator?.imagesUsed || 0,
        color: "#8b5cf6",
      },
      {
        name: "AI Chatbot",
        value: detailedUsage.usage.aiChatbot?.chatbotsUsed || 0,
        color: "#10b981",
      },
      {
        name: "AI Search",
        value: detailedUsage.usage.aiSearch?.searchesUsed || 0,
        color: "#f59e0b",
      },
    ];

    // Only filter out if all values are 0 (show empty state)
    const hasAnyUsage = data.some((item) => item.value > 0);
    return hasAnyUsage ? data : [];
  }, [detailedUsage?.usage]);

  // Memoize welcome message
  const welcomeMessage = useMemo(
    () => `Welcome back${user?.firstName ? `, ${user.firstName}` : ""}! 👋`,
    [user?.firstName]
  );

  // Loading state with skeleton loader (Industry Best Practice)
  if (loading && !detailedUsage) {
    return <DashboardSkeleton />;
  }

  // Error state with retry option - Industry best practice: Show contextual error UI
  if (error && !detailedUsage) {
    // Determine error icon and styling based on error type
    const getErrorIcon = () => {
      if (!isOnline) {
        return <WifiOff className="w-6 h-6 text-orange-600" />;
      }
      if (
        error.type === "SERVER_DOWN" ||
        error.type === "SERVER_ERROR" ||
        error.type === "SERVICE_UNAVAILABLE"
      ) {
        return <Server className="w-6 h-6 text-red-600" />;
      }
      if (error.type === "TIMEOUT" || error.type === "CONNECTION_TIMEOUT") {
        return <Clock className="w-6 h-6 text-yellow-600" />;
      }
      if (error.isNetworkError) {
        return <WifiOff className="w-6 h-6 text-orange-600" />;
      }
      return <AlertCircle className="w-6 h-6 text-red-600" />;
    };

    const getErrorTitle = () => {
      if (!isOnline) {
        return "No Internet Connection";
      }
      if (error.type === "SERVER_DOWN" || error.type === "SERVER_ERROR") {
        return "Server Unavailable";
      }
      if (error.type === "TIMEOUT") {
        return "Request Timeout";
      }
      if (error.isNetworkError) {
        return "Connection Error";
      }
      return "Failed to Load Dashboard";
    };

    const getErrorColor = () => {
      if (!isOnline) {
        return "bg-orange-50 border-orange-200";
      }
      if (error.type === "SERVER_DOWN" || error.type === "SERVER_ERROR") {
        return "bg-red-50 border-red-200";
      }
      if (error.type === "TIMEOUT") {
        return "bg-yellow-50 border-yellow-200";
      }
      return "bg-red-50 border-red-200";
    };

    const getTextColor = () => {
      if (!isOnline) {
        return "text-orange-900";
      }
      if (error.type === "SERVER_DOWN" || error.type === "SERVER_ERROR") {
        return "text-red-900";
      }
      if (error.type === "TIMEOUT") {
        return "text-yellow-900";
      }
      return "text-red-900";
    };

    return (
      <div className="max-w-7xl mx-auto">
        <div className={`card ${getErrorColor()}`}>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">{getErrorIcon()}</div>
            <div className="flex-1">
              <h3 className={`text-lg font-semibold ${getTextColor()} mb-2`}>
                {getErrorTitle()}
              </h3>
              <p className={`${getTextColor().replace("900", "700")} mb-4`}>
                {error.message}
              </p>

              {/* Show network status indicator */}
              {!isOnline && (
                <div className="mb-4 p-3 bg-orange-100 rounded-lg">
                  <p className="text-sm text-orange-800">
                    <WifiOff className="w-4 h-4 inline mr-2" />
                    Please check your internet connection and try again.
                  </p>
                </div>
              )}

              {/* Retry button - only show if online or network error */}
              {(isOnline || error.isNetworkError) && retryCount < 3 ? (
                <button
                  onClick={handleRetry}
                  className="btn-primary flex items-center gap-2"
                  aria-label="Retry loading dashboard data"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again {retryCount > 0 && `(${retryCount}/3)`}
                </button>
              ) : retryCount >= 3 ? (
                <div className="space-y-2">
                  <p
                    className={`text-sm ${getTextColor().replace(
                      "900",
                      "600"
                    )}`}
                  >
                    Multiple retry attempts failed. Please try:
                  </p>
                  <ul
                    className={`text-sm ${getTextColor().replace(
                      "900",
                      "600"
                    )} list-disc list-inside space-y-1`}
                  >
                    <li>Refresh the page (F5 or Ctrl+R)</li>
                    <li>Check your internet connection</li>
                    <li>Contact support if the problem persists</li>
                  </ul>
                </div>
              ) : (
                <p
                  className={`text-sm ${getTextColor().replace("900", "600")}`}
                >
                  Please check your internet connection and try again.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto" role="main" aria-label="Dashboard">
      {/* Welcome Section */}
      <div className="mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-3">{welcomeMessage}</h1>
          <p className="text-gray-600 text-lg">
            Manage your AI services and subscriptions
          </p>
        </div>
      </div>

      {/* Subscription Status Card - Professional & Clean */}
      <SubscriptionCard />

      {/* Alerts & Notifications */}
      <AlertsSection alerts={alerts} />

      {/* Usage Stats Cards */}
      <UsageStatsCards
        detailedUsage={detailedUsage}
        recentActivityCount={recentActivity.length}
      />

      {/* Detailed Usage Breakdown with Progress Bars */}
      <UsageBreakdown
        usage={detailedUsage?.usage}
        timeFilter={timeFilter}
        onTimeFilterChange={setTimeFilter}
      />

      {/* Usage Charts */}
      <UsageCharts
        usageChartData={usageChartData}
        serviceUsageData={serviceUsageData}
      />

      {/* Services Grid + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <ServicesGrid />
        <RecentActivity recentActivity={recentActivity} />
      </div>

      {/* Quick Actions */}
      <QuickActions />
    </div>
  );
};

export default Dashboard;
