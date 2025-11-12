import { useState, useEffect, lazy, Suspense } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, Loader, ArrowLeft, Crown } from "lucide-react";
import useSubscriptionStore from "../store/useSubscriptionStore";
import useAuthStore from "../store/useAuthStore";
import { toast } from "react-hot-toast";
import logger from "../utils/logger";
import { TIMING } from "../constants/timing";
import { FALLBACK_PLANS } from "../constants/subscription";

// Lazy load PaymentModal to prevent import errors from crashing the page
const PaymentModal = lazy(() => import("../components/payment/PaymentModal"));

/**
 * Upgrade Plans Page
 * Authenticated user upgrade page with payment integration
 */
const UpgradePlans = () => {
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const { plans, fetchPlans, upgrade, fetchCurrentSubscription } =
    useSubscriptionStore();
  const { getCurrentUser, user } = useAuthStore();
  const [useFallback, setUseFallback] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [billingCycle, setBillingCycle] = useState("monthly");
  const navigate = useNavigate();

  useEffect(() => {
    loadPlans();
    // Also fetch current user to ensure subscription data is up to date
    getCurrentUser();
  }, []);

  const loadPlans = async () => {
    try {
      await fetchPlans();
      if (!plans || plans.length === 0) {
        setUseFallback(true);
        logger.warn("Using fallback plans - API returned empty response");
      }
    } catch (error) {
      logger.error("Failed to load plans from API:", error);
      setUseFallback(true);
      toast.error("Could not load plans. Showing default plans.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (plan) => {
    // Free plan handling - direct upgrade, no payment
    if (plan.price?.monthly === 0 || plan.name === "free") {
      try {
        setUpgrading(true);
        await upgrade(plan._id, "monthly");
        await getCurrentUser();
        toast.success("Free plan activated!");
        navigate("/dashboard");
      } catch (error) {
        logger.error("Upgrade error:", error);
        toast.error(
          error?.response?.data?.message || "Failed to activate free plan"
        );
      } finally {
        setUpgrading(false);
      }
      return;
    }

    // Paid plan - show payment modal
    setSelectedPlan(plan);
    setPaymentModalOpen(true);
  };

  const handlePaymentSuccess = async (upgradeResult) => {
    setPaymentModalOpen(false);
    setSelectedPlan(null);

    // Refresh both user data and subscription data
    // Add a small delay to ensure backend has processed the subscription
    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      // Refresh user data first (includes subscription)
      await getCurrentUser();
      logger.info("User data refreshed after payment");

      // Then refresh subscription store
      await fetchCurrentSubscription();
      logger.info("Subscription store refreshed after payment");

      // Log updated subscription for debugging
      const authStore = useAuthStore.getState();
      if (authStore?.user?.subscription) {
        logger.info("Updated subscription:", authStore.user.subscription);
      }
    } catch (error) {
      logger.error("Failed to refresh data after payment:", error);
      // Still continue even if refresh fails - user can manually refresh
      toast.error(
        "Payment successful, but failed to refresh subscription. Please refresh the page."
      );
    }

    // Redirect to dashboard after success
    setTimeout(() => {
      navigate("/dashboard");
    }, TIMING.REDIRECT_AFTER_UPGRADE);
  };

  const getCurrentPlanName = () => {
    // Backend can return either subscription.type or subscription.plan
    // Check both for compatibility
    const planType =
      user?.subscription?.type || user?.subscription?.plan || "free";
    return planType.toLowerCase();
  };

  const isCurrentPlan = (planName) => {
    const currentPlan = getCurrentPlanName();
    const checkPlan = planName?.toLowerCase();
    return currentPlan === checkPlan;
  };

  const isDowngrade = (plan) => {
    const currentPlan = getCurrentPlanName();
    const planHierarchy = { free: 0, basic: 1, pro: 2 };
    return planHierarchy[plan.name] < (planHierarchy[currentPlan] || 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  // Use fallback or actual plans
  const displayPlans =
    useFallback || !plans || plans.length === 0 ? FALLBACK_PLANS : plans;

  return (
    <>
      <div className="max-w-7xl mx-auto">
        <div className="py-6">
          {/* Header with Back Button */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Link
                to="/dashboard"
                className="hover:text-primary-600 transition-colors"
              >
                Overview
              </Link>
              <span>/</span>
              <span className="text-gray-700 font-medium">Upgrade Plans</span>
            </div>
          </div>

          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Upgrade Your Plan</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Choose the perfect plan to unlock more features and higher limits
            </p>

            {/* Current Plan Badge */}
            {user?.subscription && (
              <div className="mt-6 inline-flex items-center gap-2 bg-primary-50 border border-primary-200 rounded-full px-4 py-2">
                <Crown className="w-5 h-5 text-primary-600" />
                <span className="text-sm font-medium text-primary-700">
                  Current Plan:{" "}
                  <span className="capitalize">
                    {user.subscription.type || user.subscription.plan || "Free"}
                  </span>
                </span>
              </div>
            )}
          </div>

          {/* Billing Cycle Toggle */}
          <div className="flex justify-center mb-8">
            <div className="bg-gray-100 rounded-lg p-1 inline-flex">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingCycle === "monthly"
                    ? "bg-white text-primary-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingCycle === "yearly"
                    ? "bg-white text-primary-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Yearly
                <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                  Save 20%
                </span>
              </button>
            </div>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
            {displayPlans.map((plan, index) => {
              const current = isCurrentPlan(plan.name);
              const downgrade = isDowngrade(plan);

              return (
                <div
                  key={plan._id || index}
                  className={`bg-white rounded-xl border-2 p-8 transition-all hover:shadow-xl ${
                    plan.isPopular
                      ? "border-primary-500 scale-105 relative"
                      : current
                      ? "border-green-500"
                      : "border-gray-200"
                  }`}
                >
                  {plan.isPopular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-primary-600 text-white text-xs font-semibold px-4 py-1 rounded-full">
                      Most Popular
                    </div>
                  )}

                  {current && (
                    <div className="absolute top-4 right-4 bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Current Plan
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold mb-2">
                      {plan.displayName || plan.name || `Plan ${index + 1}`}
                    </h3>
                    <div className="mb-4">
                      <span className="text-5xl font-bold">
                        $
                        {billingCycle === "yearly"
                          ? Math.round((plan.price?.monthly || 0) * 12 * 0.8)
                          : plan.price?.monthly || 0}
                      </span>
                      <span className="text-gray-600">
                        {" "}
                        /{billingCycle === "yearly" ? "year" : "month"}
                      </span>
                    </div>
                    {billingCycle === "yearly" && plan.price?.monthly > 0 && (
                      <p className="text-sm text-green-600 font-medium">
                        Save $
                        {Math.round((plan.price?.monthly || 0) * 12 * 0.2)}/year
                      </p>
                    )}
                  </div>

                  {/* Plan Features */}
                  <ul className="space-y-3 mb-8 text-sm">
                    {plan.features?.aiTextWriter && (
                      <li className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">
                          <strong>AI Text Writer:</strong>{" "}
                          {plan.features.aiTextWriter.wordsPerDay?.toLocaleString() ||
                            0}{" "}
                          words/day
                        </span>
                      </li>
                    )}
                    {plan.features?.aiImageGenerator && (
                      <li className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">
                          <strong>AI Image Generator:</strong>{" "}
                          {plan.features.aiImageGenerator.imagesPerDay || 0}{" "}
                          images/day
                        </span>
                      </li>
                    )}
                    {plan.features?.aiSearch && (
                      <li className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">
                          <strong>AI Search:</strong>{" "}
                          {plan.features.aiSearch.searchesPerDay || 0}{" "}
                          searches/day
                        </span>
                      </li>
                    )}
                    {plan.features?.aiChatbot && (
                      <li className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">
                          <strong>AI Chatbot:</strong>{" "}
                          {plan.features.aiChatbot.messagesPerDay || 0}{" "}
                          messages/day
                        </span>
                      </li>
                    )}
                    <li className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Priority Support</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Email Support</span>
                    </li>
                  </ul>

                  <button
                    onClick={() => handleUpgrade(plan)}
                    disabled={upgrading || current}
                    className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                      current
                        ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                        : downgrade
                        ? "bg-gray-100 hover:bg-gray-200 text-gray-800"
                        : plan.isPopular
                        ? "bg-primary-600 hover:bg-primary-700 text-white"
                        : "bg-gray-800 hover:bg-gray-900 text-white"
                    } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                  >
                    {upgrading ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : current ? (
                      <>
                        <Check className="w-4 h-4" />
                        Current Plan
                      </>
                    ) : plan.price?.monthly === 0 ? (
                      "Switch to Free"
                    ) : (
                      `Upgrade to ${plan.displayName}`
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Payment Modal - Lazy loaded with error boundary */}
      {paymentModalOpen && selectedPlan && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white rounded-xl p-8">
                <Loader className="w-8 h-8 animate-spin text-primary-600 mx-auto" />
                <p className="mt-4 text-gray-600">Loading payment form...</p>
              </div>
            </div>
          }
        >
          <PaymentModal
            isOpen={paymentModalOpen}
            onClose={() => {
              setPaymentModalOpen(false);
              setSelectedPlan(null);
            }}
            plan={selectedPlan}
            onSuccess={handlePaymentSuccess}
            billingCycle={billingCycle}
          />
        </Suspense>
      )}
    </>
  );
};

export default UpgradePlans;
