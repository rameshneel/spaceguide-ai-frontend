import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Check, Loader } from "lucide-react";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import useSubscriptionStore from "../store/useSubscriptionStore";
import { toast } from "react-hot-toast";

// Fallback plans if API fails
const FALLBACK_PLANS = [
  {
    _id: "free",
    name: "free",
    displayName: "Free Plan",
    price: { monthly: 0 },
    isPopular: false,
    features: {
      aiTextWriter: { wordsPerDay: 500 },
      aiImageGenerator: { imagesPerDay: 3 },
      aiSearch: { searchesPerDay: 10 },
      aiChatbot: { messagesPerDay: 20 },
    },
  },
  {
    _id: "basic",
    name: "basic",
    displayName: "Basic Plan",
    price: { monthly: 29 },
    isPopular: true,
    features: {
      aiTextWriter: { wordsPerDay: 10000 },
      aiImageGenerator: { imagesPerDay: 25 },
      aiSearch: { searchesPerDay: 100 },
      aiChatbot: { messagesPerDay: 500 },
    },
  },
  {
    _id: "pro",
    name: "pro",
    displayName: "Pro Plan",
    price: { monthly: 79 },
    isPopular: false,
    features: {
      aiTextWriter: { wordsPerDay: 50000 },
      aiImageGenerator: { imagesPerDay: 150 },
      aiSearch: { searchesPerDay: 500 },
      aiChatbot: { messagesPerDay: 3000 },
    },
  },
];

const Pricing = () => {
  const [loading, setLoading] = useState(true);
  const { plans, fetchPlans, upgrade } = useSubscriptionStore();
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      await fetchPlans();
      // Check if plans are empty, use fallback
      if (!plans || plans.length === 0) {
        setUseFallback(true);
        console.warn("Using fallback plans - API returned empty response");
      }
    } catch (error) {
      console.error("Failed to load plans from API:", error);
      setUseFallback(true);
      toast.error("Could not load plans. Showing default plans.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId) => {
    try {
      await upgrade(planId, "monthly");
      toast.success("Subscription upgraded successfully!");
    } catch (error) {
      toast.error("Failed to upgrade subscription");
    }
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
    <div className="min-h-screen flex flex-col">
      <Header />

      <div className="flex-1 py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4">Subscription Plans</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We offer flexible pricing plans so everyone can find one that
              suits their needs.
            </p>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
            {displayPlans.map((plan, index) => (
              <div
                key={plan._id || index}
                className={`pricing-card ${
                  plan.isPopular ? "pricing-card-featured" : ""
                }`}
              >
                {plan.isPopular && (
                  <div className="bg-primary-600 text-white text-xs font-semibold px-3 py-1 rounded-full inline-block mb-4">
                    Most Popular
                  </div>
                )}

                <h3 className="text-2xl font-bold mb-2">
                  {plan.displayName || plan.name || `Plan ${index + 1}`}
                </h3>

                <div className="mb-6">
                  <span className="text-4xl font-bold">
                    ${plan.price?.monthly || 0}
                  </span>
                  <span className="text-gray-600"> /mo</span>
                </div>

                {/* Plan Features */}
                <ul className="space-y-3 mb-8 text-sm">
                  {plan.features?.aiTextWriter && (
                    <li className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">
                        <strong>AI Text Writer:</strong>{" "}
                        {plan.features.aiTextWriter.wordsPerDay || 0} words/day
                      </span>
                    </li>
                  )}
                  {plan.features?.aiImageGenerator && (
                    <li className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">
                        <strong>AI Image:</strong>{" "}
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
                  onClick={() => handleUpgrade(plan._id)}
                  className="btn-primary w-full"
                >
                  {plan.price?.monthly === 0
                    ? "Get Started Free"
                    : "Subscribe Now"}
                </button>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-20 text-center">
            <p className="text-gray-600 mb-6">
              Not sure which plan to choose? Start with our free plan!
            </p>
            <Link to="/register" className="btn-secondary">
              Start Free Trial
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Pricing;
