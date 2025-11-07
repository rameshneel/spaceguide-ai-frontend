import { X, AlertTriangle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import logger from "../utils/logger";
import { TIMING } from "../constants/timing";

const UpgradeLimitModal = ({ isOpen, onClose, usageData }) => {
  const modalRef = useRef(null);
  const previousActiveElementRef = useRef(null);

  // Store the previously focused element when modal opens
  useEffect(() => {
    if (isOpen) {
      previousActiveElementRef.current = document.activeElement;
      // Focus the modal container when it opens
      setTimeout(() => {
        if (modalRef.current) {
          modalRef.current.focus();
        }
      }, TIMING.MODAL_FOCUS_DELAY);
    } else {
      // Return focus to the previously focused element when modal closes
      if (previousActiveElementRef.current) {
        previousActiveElementRef.current.focus();
      }
    }
  }, [isOpen]);

  // Handle Escape key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        logger.debug("Escape key pressed, closing modal");
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  // Extract usage data with proper fallbacks
  const used = usageData?.usage?.used || usageData?.used || 0;
  const limit = usageData?.usage?.limit || usageData?.limit || 0;
  const percentage =
    usageData?.usage?.percentage || usageData?.percentage || 100;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={(e) => {
          // Only close on backdrop click if user explicitly clicks (not programmatic)
          if (e.target === e.currentTarget) {
            logger.debug("Backdrop clicked, closing modal");
            onClose();
          }
        }}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          ref={modalRef}
          className="relative bg-white rounded-xl shadow-2xl max-w-md w-full transform transition-all"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          tabIndex={-1}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Content */}
          <div className="p-6 sm:p-8">
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="bg-red-100 rounded-full p-3">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </div>

            {/* Title */}
            <h2
              id="modal-title"
              className="text-2xl font-bold text-center text-gray-900 mb-2"
            >
              Daily Limit Reached
            </h2>

            {/* Message */}
            <p className="text-center text-gray-600 mb-6">
              You've used{" "}
              <span className="font-semibold text-red-600">
                {percentage}% ({used.toLocaleString()} /{" "}
                {limit.toLocaleString()} words)
              </span>{" "}
              of your daily word limit.
            </p>

            {/* Usage bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Usage</span>
                <span className="font-medium">{percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-300"
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
            </div>

            {/* Upgrade message */}
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-primary-800 text-center">
                <strong>Upgrade your plan</strong> to unlock more words and
                continue generating content!
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/upgrade-plans"
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                onClick={onClose}
              >
                View Plans
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                onClick={onClose}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

UpgradeLimitModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  usageData: PropTypes.shape({
    service: PropTypes.string,
    usage: PropTypes.shape({
      used: PropTypes.number,
      limit: PropTypes.number,
      percentage: PropTypes.number,
      remaining: PropTypes.number,
    }),
    used: PropTypes.number,
    limit: PropTypes.number,
    percentage: PropTypes.number,
    message: PropTypes.string,
    limitExceeded: PropTypes.bool,
    timestamp: PropTypes.instanceOf(Date),
  }),
};

export default UpgradeLimitModal;
