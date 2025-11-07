import PropTypes from "prop-types";
import { AlertCircle } from "lucide-react";
import Modal from "../common/Modal";

/**
 * Delete Chatbot Confirmation Modal
 */
const DeleteChatbotModal = ({ isOpen, onClose, chatbot, onConfirm }) => {
  if (!chatbot) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-md"
      showCloseButton={false}
    >
      <div className="p-6">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
          Delete Chatbot?
        </h2>
        <p className="text-gray-600 text-center mb-6">
          Are you sure you want to delete "{chatbot.name}"? This action cannot
          be undone.
        </p>
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </Modal>
  );
};

DeleteChatbotModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  chatbot: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }),
  onConfirm: PropTypes.func.isRequired,
};

export default DeleteChatbotModal;
