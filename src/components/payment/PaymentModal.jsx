import { useState, useEffect } from "react";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { X, Loader, CheckCircle, AlertCircle } from "lucide-react";
import PropTypes from "prop-types";
import logger from "../../utils/logger";
import { paymentService } from "../../services/payment";
import { subscriptionService } from "../../services/subscription";
import { toast } from "react-hot-toast";

// Initialize Stripe - only if key exists
const getStripePromise = () => {
  const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  if (!stripeKey) {
    logger.warn("Stripe publishable key not found");
    return null;
  }

  // Validate that it's a publishable key, not a secret key
  if (stripeKey.startsWith("sk_")) {
    logger.error(
      "❌ ERROR: Secret key detected! Frontend should use PUBLISHABLE key (pk_test_ or pk_live_), not SECRET key (sk_test_ or sk_live_).",
      "\n🔴 STRIPE KEY ERROR:",
      "You're using a SECRET key in the frontend. This is a security risk!",
      "\nPlease update your .env file:",
      "\n- Use PUBLISHABLE key: pk_test_... or pk_live_...",
      "\n- Get it from: https://dashboard.stripe.com/apikeys"
    );
    return null;
  }

  if (!stripeKey.startsWith("pk_")) {
    logger.warn(
      "Stripe key format looks incorrect. Expected pk_test_... or pk_live_..."
    );
  }

  try {
    return loadStripe(stripeKey);
  } catch (error) {
    logger.error("Failed to initialize Stripe:", error);
    return null;
  }
};

const stripePromise = getStripePromise();

/**
 * Payment Form Component (inside Stripe Elements)
 */
const PaymentForm = ({
  plan,
  onSuccess,
  onCancel,
  billingCycle = "monthly",
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [paymentIntentId, setPaymentIntentId] = useState(null);
  const [requiresAction, setRequiresAction] = useState(false);

  useEffect(() => {
    // Create payment intent when component mounts
    const createIntent = async () => {
      try {
        setProcessing(true);
        const data = await paymentService.createPaymentIntent(
          plan._id,
          billingCycle
        );
        // Payment service now returns the data object directly
        if (!data?.clientSecret) {
          throw new Error("Client secret not found in response");
        }
        setClientSecret(data.clientSecret);
        // Store paymentIntentId for status checks and retry
        if (data.paymentIntentId) {
          setPaymentIntentId(data.paymentIntentId);
        }
        logger.info("Payment intent created successfully", {
          planId: plan._id,
          amount: data.amount,
          planType: data.planType,
          paymentIntentId: data.paymentIntentId,
        });
      } catch (err) {
        logger.error("Failed to create payment intent:", err);
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to initialize payment"
        );
        toast.error("Failed to initialize payment");
      } finally {
        setProcessing(false);
      }
    };

    if (plan && plan.price?.monthly > 0) {
      createIntent();
    }
  }, [plan, billingCycle]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Get card element
      const cardElement = elements.getElement(CardElement);

      // Confirm payment with Stripe
      const { error: stripeError, paymentIntent } =
        await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
          },
        });

      if (stripeError) {
        setError(stripeError.message);
        toast.error(stripeError.message);
        setProcessing(false);
        return;
      }

      // Store paymentIntentId if not already stored
      if (paymentIntent?.id && !paymentIntentId) {
        setPaymentIntentId(paymentIntent.id);
      }

      // Handle different payment statuses
      if (paymentIntent.status === "requires_action") {
        // 3D Secure or other action required
        setRequiresAction(true);
        logger.info("Payment requires action (3D Secure)", {
          paymentIntentId: paymentIntent.id,
          nextAction: paymentIntent.next_action,
        });
        toast.info("Please complete the authentication step");

        // Stripe handles the action automatically via confirmCardPayment
        // The paymentIntent will be updated after action completion
        // Poll for status update after action
        const checkActionStatus = async () => {
          try {
            if (paymentIntent.id) {
              // Wait a bit for Stripe to process the action
              await new Promise((resolve) => setTimeout(resolve, 3000));

              const statusData = await paymentService.checkPaymentStatus(
                paymentIntent.id
              );

              if (statusData?.stripeStatus === "succeeded") {
                setRequiresAction(false);
                await handlePaymentSuccess(paymentIntent.id);
              } else if (statusData?.stripeStatus === "requires_action") {
                // Still requires action, check again
                setTimeout(checkActionStatus, 2000);
              } else if (statusData?.stripeStatus === "failed") {
                setRequiresAction(false);
                throw new Error(statusData?.error?.message || "Payment failed");
              } else {
                // Still processing, check again
                setTimeout(checkActionStatus, 2000);
              }
            }
          } catch (statusError) {
            logger.error("Error checking action status:", statusError);
            setRequiresAction(false);
            setError("Failed to complete authentication. Please try again.");
            setProcessing(false);
          }
        };

        // Start checking after a delay
        setTimeout(checkActionStatus, 3000);
        return;
      }

      if (paymentIntent.status === "processing") {
        // Payment is processing (async payment method)
        logger.info("Payment is processing", {
          paymentIntentId: paymentIntent.id,
        });
        toast.info("Payment is processing. Please wait...");

        // Poll for status update
        const checkStatus = async () => {
          try {
            if (paymentIntent.id) {
              const statusData = await paymentService.checkPaymentStatus(
                paymentIntent.id
              );
              if (statusData?.stripeStatus === "succeeded") {
                // Payment succeeded, continue with upgrade
                await handlePaymentSuccess(paymentIntent.id);
              } else if (statusData?.stripeStatus === "requires_action") {
                setRequiresAction(true);
              } else if (statusData?.stripeStatus === "failed") {
                throw new Error(statusData?.error?.message || "Payment failed");
              } else {
                // Still processing, check again after delay
                setTimeout(checkStatus, 2000);
              }
            }
          } catch (statusError) {
            logger.error("Error checking payment status:", statusError);
            setError(
              "Failed to check payment status. Please refresh the page."
            );
            setProcessing(false);
          }
        };

        // Start polling after a short delay
        setTimeout(checkStatus, 2000);
        return;
      }

      if (paymentIntent.status === "succeeded") {
        // Payment succeeded, now upgrade subscription
        await handlePaymentSuccess(paymentIntent.id);
      }
    } catch (err) {
      logger.error("Payment error:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Payment failed. Please try again."
      );
      toast.error(
        err?.response?.data?.message || "Payment failed. Please try again."
      );
    } finally {
      setProcessing(false);
    }
  };

  // Handle successful payment (extracted for reuse)
  const handlePaymentSuccess = async (intentId) => {
    try {
      logger.info("Payment succeeded, upgrading subscription...", {
        paymentIntentId: intentId,
      });

      // Confirm payment on backend
      await paymentService.confirmPayment(intentId, plan._id);

      // Call upgrade API
      try {
        const upgradeResult = await subscriptionService.upgrade(
          plan._id,
          billingCycle
        );
        toast.success("Payment successful! Subscription upgraded 🎉");
        onSuccess(upgradeResult);
      } catch (upgradeError) {
        // If upgrade fails because subscription already exists, treat as success
        // This can happen if the upgrade was already processed
        if (
          upgradeError?.response?.data?.message?.includes(
            "already have an active subscription"
          )
        ) {
          logger.info(
            "Subscription already upgraded, refreshing data...",
            upgradeError
          );
          toast.success(
            "Payment successful! Your subscription is already active 🎉"
          );
          // Still call onSuccess to refresh data
          onSuccess({ subscription: { plan: plan.name || plan.type } });
        } else {
          // For other errors, throw to be caught by outer catch
          throw upgradeError;
        }
      }
    } catch (err) {
      logger.error("Error in handlePaymentSuccess:", err);
      throw err;
    }
  };

  // Handle payment retry
  const handleRetry = async () => {
    if (!paymentIntentId) {
      toast.error("No payment to retry");
      return;
    }

    try {
      setProcessing(true);
      setError(null);
      setRequiresAction(false);

      logger.info("Retrying payment...", { paymentIntentId });

      // Retry payment - creates new payment intent
      const retryData = await paymentService.retryPayment(paymentIntentId);

      if (!retryData?.clientSecret) {
        throw new Error("Failed to create retry payment intent");
      }

      setClientSecret(retryData.clientSecret);
      if (retryData.paymentIntentId) {
        setPaymentIntentId(retryData.paymentIntentId);
      }

      toast.success("Payment retry initiated. Please try again.");
    } catch (err) {
      logger.error("Payment retry error:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to retry payment"
      );
      toast.error(err?.response?.data?.message || "Failed to retry payment");
    } finally {
      setProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "#424770",
        "::placeholder": {
          color: "#aab7c4",
        },
      },
      invalid: {
        color: "#9e2146",
      },
    },
  };

  if (!stripePromise) {
    return (
      <div className="p-6">
        <p className="text-red-600">
          Stripe is not configured. Please contact support.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Plan Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-gray-700">
            {plan.displayName}
          </span>
          <span className="text-lg font-bold text-primary-600">
            ${plan.price?.monthly || 0}/month
          </span>
        </div>
        <p className="text-sm text-gray-500">
          Billing cycle: {billingCycle === "monthly" ? "Monthly" : "Yearly"}
        </p>
      </div>

      {/* Card Element */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card Information
        </label>
        <div className="border border-gray-300 rounded-lg p-4 bg-white">
          <CardElement options={cardElementOptions} />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Requires Action Message (3D Secure) */}
      {requiresAction && (
        <div className="flex items-center gap-2 text-blue-600 text-sm bg-blue-50 p-3 rounded-lg">
          <AlertCircle className="w-4 h-4" />
          <span>
            Please complete the authentication step in the popup window.
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={processing}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        {error && paymentIntentId && (
          <button
            type="button"
            onClick={handleRetry}
            disabled={processing}
            className="flex-1 px-4 py-2 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors disabled:opacity-50"
          >
            Retry Payment
          </button>
        )}
        <button
          type="submit"
          disabled={!stripe || processing || !clientSecret || requiresAction}
          className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {processing ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              Pay ${plan.price?.monthly || 0}
            </>
          )}
        </button>
      </div>

      <p className="text-xs text-gray-500 text-center">
        Your payment is secure and encrypted. We never store your card details.
      </p>
    </form>
  );
};

PaymentForm.propTypes = {
  plan: PropTypes.object.isRequired,
  onSuccess: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  billingCycle: PropTypes.string,
};

/**
 * Payment Modal Component
 */
const PaymentModal = ({ isOpen, onClose, plan, onSuccess, billingCycle }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen || !plan) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Complete Payment</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {(() => {
            try {
              const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

              if (!stripeKey) {
                logger.warn("Stripe publishable key not configured");
                return (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">
                      Payment processing is not configured. Please contact
                      support.
                    </p>
                    <button
                      onClick={onClose}
                      className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                      Close
                    </button>
                  </div>
                );
              }

              if (!stripePromise) {
                logger.error("Stripe promise initialization failed");
                return (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">
                      Failed to initialize payment system. Please refresh the
                      page or contact support.
                    </p>
                    <button
                      onClick={onClose}
                      className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                      Close
                    </button>
                  </div>
                );
              }

              return (
                <Elements stripe={stripePromise}>
                  <PaymentForm
                    plan={plan}
                    onSuccess={onSuccess}
                    onCancel={onClose}
                    billingCycle={billingCycle}
                  />
                </Elements>
              );
            } catch (error) {
              logger.error("Error rendering payment form:", error);
              return (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    An error occurred while loading payment form. Please refresh
                    the page.
                  </p>
                  {import.meta.env.DEV && error?.message && (
                    <p className="text-sm text-gray-500 mb-4 font-mono">
                      {error.message}
                    </p>
                  )}
                  <button
                    onClick={onClose}
                    className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              );
            }
          })()}
        </div>
      </div>
    </div>
  );
};

PaymentModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  plan: PropTypes.object,
  onSuccess: PropTypes.func.isRequired,
  billingCycle: PropTypes.string,
};

export default PaymentModal;
