import { BrowserRouter as Router } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useSocket } from "./hooks/useSocket";
import ErrorBoundary from "./components/ErrorBoundary";
import NetworkStatusIndicator from "./components/NetworkStatusIndicator";

// Routes Configuration
import AppRoutes from "./config/routes";

// Stripe
const getStripePromise = () => {
  const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  if (!stripeKey) return null;

  // Validate that it's a publishable key, not a secret key
  if (stripeKey.startsWith("sk_")) {
    console.error(
      "❌ STRIPE KEY ERROR:",
      "You're using a SECRET key (sk_...) in the frontend!",
      "\nPlease use PUBLISHABLE key (pk_test_... or pk_live_...)",
      "\nGet it from: https://dashboard.stripe.com/apikeys"
    );
    return null;
  }

  return loadStripe(stripeKey);
};

const stripePromise = getStripePromise();

function App() {
  // Initialize Socket.IO connection for authenticated users
  useSocket();

  const appContent = (
    <ErrorBoundary>
      <Router>
        {/* Global Network Status Indicator */}
        <NetworkStatusIndicator />

        <AppRoutes />

        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#363636",
              color: "#fff",
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: "#10b981",
                secondary: "#fff",
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: "#ef4444",
                secondary: "#fff",
              },
            },
          }}
        />
      </Router>
    </ErrorBoundary>
  );

  // Conditionally wrap with Stripe Elements only if key exists
  if (stripePromise) {
    return <Elements stripe={stripePromise}>{appContent}</Elements>;
  }

  return appContent;
}

export default App;
