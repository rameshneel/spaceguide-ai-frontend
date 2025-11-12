import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, Loader } from "lucide-react";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import useSubscriptionStore from "../store/useSubscriptionStore";
import useAuthStore from "../store/useAuthStore";
import { toast } from "react-hot-toast";
import logger from "../utils/logger";
import { FALLBACK_PLANS } from "../constants/subscription";

/**
 * Public Pricing Page
 * Marketing-focused pricing page for non-authenticated users
 */
const PublicPricing = () => {
  const [loading, setLoading] = useState(true);
  const { plans, fetchPlans } = useSubscriptionStore();
  const { isAuthenticated } = useAuthStore();
  const [useFallback, setUseFallback] = useState(false);
  const navigate = useNavigate();

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

  useEffect(() => {
    loadPlans();

    // If user is authenticated, redirect to upgrade-plans
    if (isAuthenticated()) {
      navigate("/upgrade-plans", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const handleGetStarted = (planId) => {
    // Redirect to register with plan preference
    navigate("/register", {
      state: { preferredPlan: planId, returnTo: "/upgrade-plans" },
    });
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
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white">
      <Header />

      {/* Hero Section */}
      <div className="flex-1 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Choose the perfect plan for your needs. Start free, upgrade when
              you're ready.
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                No credit card required
              </span>
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                Cancel anytime
              </span>
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                14-day money-back guarantee
              </span>
            </div>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
            {displayPlans.map((plan, index) => (
              <div
                key={plan._id || index}
                className={`bg-white rounded-xl shadow-lg p-8 border-2 transition-all hover:shadow-xl ${
                  plan.isPopular
                    ? "border-primary-500 scale-105 relative"
                    : "border-gray-200"
                }`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-primary-600 text-white text-xs font-semibold px-4 py-1 rounded-full">
                    Most Popular
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">
                    {plan.displayName || plan.name || `Plan ${index + 1}`}
                  </h3>
                  <div className="mb-4">
                    <span className="text-5xl font-bold">
                      ${plan.price?.monthly || 0}
                    </span>
                    <span className="text-gray-600"> /month</span>
                  </div>
                  {plan.price?.monthly === 0 && (
                    <p className="text-sm text-gray-500">Forever free</p>
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
                  onClick={() => handleGetStarted(plan._id)}
                  className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                    plan.isPopular
                      ? "bg-primary-600 hover:bg-primary-700 text-white"
                      : plan.price?.monthly === 0
                      ? "bg-gray-100 hover:bg-gray-200 text-gray-800"
                      : "bg-gray-800 hover:bg-gray-900 text-white"
                  }`}
                >
                  {plan.price?.monthly === 0
                    ? "Get Started Free"
                    : "Get Started"}
                </button>
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div className="text-center bg-white rounded-xl shadow-lg p-12 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              Join thousands of users who are already using SpaceGuideAI to
              create amazing content.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-8 rounded-lg transition-colors"
              >
                Start Free Trial
              </Link>
              <Link
                to="/login"
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-8 rounded-lg transition-colors"
              >
                Login to Your Account
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default PublicPricing;
