import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Check, Loader, Sparkles } from "lucide-react";
import useSubscriptionStore from "../../store/useSubscriptionStore";
import useAuthStore from "../../store/useAuthStore";
import { toast } from "react-hot-toast";

// Fallback plans (same as Pricing page)
const FALLBACK_PLANS = [
  {
    _id: "free",
    name: "free",
    displayName: "Free",
    price: { monthly: 0 },
    isPopular: false,
  },
  {
    _id: "basic",
    name: "basic",
    displayName: "Basic",
    price: { monthly: 29 },
    isPopular: true,
  },
  {
    _id: "pro",
    name: "pro",
    displayName: "Pro",
    price: { monthly: 79 },
    isPopular: false,
  },
];

const PricingOverview = () => {
  const { plans, fetchPlans, upgrade } = useSubscriptionStore();
  const { getCurrentUser, user, isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      await fetchPlans();
      if (!plans || plans.length === 0) {
        setUseFallback(true);
      }
    } catch (error) {
      console.error("Failed to load plans:", error);
      setUseFallback(true);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId) => {
    if (!isAuthenticated()) {
      toast.error("Please login to upgrade");
      return;
    }

    try {
      setUpgrading(true);
      const selectedPlan =
        plans.find((p) => p._id === planId) ||
        FALLBACK_PLANS.find((p) => p._id === planId);

      if (selectedPlan?.price?.monthly === 0 || selectedPlan?.name === "free") {
        toast.success("Free plan activated!");
        await getCurrentUser();
        return;
      }

      const result = await upgrade(planId, "monthly");
      if (result) {
        await getCurrentUser();
        toast.success("Subscription upgraded successfully! 🎉");
        // Refresh to show updated plan
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (error) {
      console.error("Upgrade error:", error);
      toast.error(
        error?.response?.data?.message || error?.message || "Failed to upgrade"
      );
    } finally {
      setUpgrading(false);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-12">
          <Loader className="w-6 h-6 animate-spin text-primary-600" />
        </div>
      </div>
    );
  }

  const displayPlans =
    useFallback || !plans || plans.length === 0 ? FALLBACK_PLANS : plans;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary-600" />
            Subscription Plans
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            Upgrade to unlock more features
          </p>
        </div>
        <Link
          to="/pricing"
          className="text-sm text-primary-600 hover:underline font-medium"
        >
          View All Plans →
        </Link>
      </div>

      {/* Compact Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {displayPlans.slice(0, 3).map((plan, index) => (
          <div
            key={plan._id || index}
            className={`border-2 rounded-lg p-4 transition-all ${
              plan.isPopular
                ? "border-primary-500 bg-primary-50"
                : "border-gray-200 hover:border-primary-300"
            } ${
              user?.subscription?.type === plan.name
                ? "ring-2 ring-primary-300"
                : ""
            }`}
          >
            {plan.isPopular && (
              <div className="text-xs font-semibold text-primary-600 mb-2">
                ⭐ Most Popular
              </div>
            )}

            <div className="flex items-baseline justify-between mb-3">
              <h3 className="font-bold text-lg">
                {plan.displayName || plan.name}
              </h3>
              <div>
                <span className="text-2xl font-bold">
                  ${plan.price?.monthly || 0}
                </span>
                <span className="text-gray-600 text-sm">/mo</span>
              </div>
            </div>

            <button
              onClick={() => handleUpgrade(plan._id)}
              className={`w-full py-2 rounded-lg font-medium text-sm transition-colors ${
                user?.subscription?.type === plan.name
                  ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                  : plan.isPopular
                  ? "bg-primary-600 text-white hover:bg-primary-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              disabled={upgrading || user?.subscription?.type === plan.name}
            >
              {upgrading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader className="w-4 h-4 animate-spin" />
                  Processing...
                </span>
              ) : user?.subscription?.type === plan.name ? (
                "Current Plan ✓"
              ) : plan.price?.monthly === 0 ? (
                "Current"
              ) : (
                "Upgrade"
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PricingOverview;
