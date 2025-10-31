import { Link } from "react-router-dom";
import { Crown, TrendingUp } from "lucide-react";
import useAuthStore from "../../store/useAuthStore";

const SubscriptionCard = () => {
  const { user } = useAuthStore();

  const currentPlan = user?.subscription?.type || "free";
  const planDisplay = {
    free: { name: "Free Plan", color: "text-gray-600", bg: "bg-gray-50" },
    basic: { name: "Basic Plan", color: "text-blue-600", bg: "bg-blue-50" },
    pro: { name: "Pro Plan", color: "text-purple-600", bg: "bg-purple-50" },
  };

  const planInfo = planDisplay[currentPlan] || planDisplay.free;

  return (
    <div className="card bg-gradient-to-br from-white to-gray-50 border-2 border-primary-100 mb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            className={`w-16 h-16 ${planInfo.bg} rounded-xl flex items-center justify-center`}
          >
            <Crown className={`w-8 h-8 ${planInfo.color}`} />
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Current Subscription</p>
            <h3 className={`text-2xl font-bold ${planInfo.color}`}>
              {planInfo.name}
            </h3>
            {currentPlan === "free" && (
              <p className="text-xs text-gray-500 mt-1">
                Upgrade to unlock premium features
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          {currentPlan === "free" ? (
            <Link to="/pricing" className="btn-primary flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Upgrade Now
            </Link>
          ) : (
            <Link
              to="/pricing"
              className="btn-secondary flex items-center gap-2"
            >
              Manage Plan
            </Link>
          )}
        </div>
      </div>

      {/* Quick Plan Comparison - Only for Free Users */}
      {currentPlan === "free" && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Upgrade to Basic</p>
              <p className="text-lg font-bold text-blue-600">
                $29
                <span className="text-sm font-normal text-gray-500">/mo</span>
              </p>
              <Link
                to="/pricing"
                className="text-xs text-primary-600 hover:underline mt-1 inline-block"
              >
                View Details →
              </Link>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Upgrade to Pro</p>
              <p className="text-lg font-bold text-purple-600">
                $79
                <span className="text-sm font-normal text-gray-500">/mo</span>
              </p>
              <Link
                to="/pricing"
                className="text-xs text-primary-600 hover:underline mt-1 inline-block"
              >
                View Details →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionCard;
