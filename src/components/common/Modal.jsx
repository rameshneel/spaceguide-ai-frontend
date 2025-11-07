import { X } from "lucide-react";
import PropTypes from "prop-types";

/**
 * Reusable Modal Component
 * Provides consistent modal structure across the application
 */
const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = "max-w-2xl",
  showCloseButton = true,
  className = "",
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div
        className={`bg-white rounded-xl shadow-xl ${maxWidth} w-full max-h-[90vh] overflow-y-auto ${className}`}
      >
        {(title || showCloseButton) && (
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <div>
              {title && (
                <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
              )}
              {subtitle && (
                <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
              )}
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  subtitle: PropTypes.string,
  children: PropTypes.node.isRequired,
  maxWidth: PropTypes.string,
  showCloseButton: PropTypes.bool,
  className: PropTypes.string,
};

export default Modal;
