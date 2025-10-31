import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Loader,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Bell,
} from "lucide-react";
import useAuthStore from "../store/useAuthStore";
import { authService } from "../services/auth";

// Dashboard Components
import UsageStatsCards from "../components/dashboard/UsageStatsCards";
import AlertsSection from "../components/dashboard/AlertsSection";
import UsageBreakdown from "../components/dashboard/UsageBreakdown";
import UsageCharts from "../components/dashboard/UsageCharts";
import ServicesGrid from "../components/dashboard/ServicesGrid";
import RecentActivity from "../components/dashboard/RecentActivity";
import QuickActions from "../components/dashboard/QuickActions";
import SubscriptionCard from "../components/dashboard/SubscriptionCard";

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [detailedUsage, setDetailedUsage] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [timeFilter, setTimeFilter] = useState("today"); // today, week, month
  const [alerts, setAlerts] = useState([]);
  const { user } = useAuthStore();

  useEffect(() => {
    loadData();
  }, [timeFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usageData, activityData] = await Promise.all([
        authService.getDetailedUsage(),
        authService.getRecentActivity(10),
      ]);

      setDetailedUsage(usageData);
      setRecentActivity(activityData?.history || []);

      // Generate alerts based on usage
      generateAlerts(usageData, activityData?.history || []);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      // Set fallback data
      setDetailedUsage({
        usage: {
          aiTextWriter: { wordsUsed: 0, wordsLimit: 1000, wordsPercentage: 0 },
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
  };

  // Generate alerts based on usage
  const generateAlerts = (usageData, activityList) => {
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
    if (activityList.length === 0 && !loading) {
      newAlerts.push({
        type: "success",
        icon: <CheckCircle className="w-5 h-5" />,
        message: "Welcome! Start using our AI services",
        action: null,
      });
    }

    setAlerts(newAlerts.slice(0, 3)); // Show max 3 alerts
  };

  // Mock chart data (in production, fetch from API)
  const usageChartData = [
    { day: "Mon", usage: 120 },
    { day: "Tue", usage: 190 },
    { day: "Wed", usage: 300 },
    { day: "Thu", usage: 250 },
    { day: "Fri", usage: 400 },
    { day: "Sat", usage: 280 },
    { day: "Sun", usage: 350 },
  ];

  // Service usage pie chart data
  const serviceUsageData = detailedUsage?.usage
    ? [
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
      ].filter((item) => item.value > 0)
    : [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-3">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ""}! 👋
          </h1>
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
