import {
  MessageSquare,
  Eye,
  FileText,
  Upload,
  Code,
  Trash2,
} from "lucide-react";
import PropTypes from "prop-types";

/**
 * Chatbot Card Component
 * Displays individual chatbot information with action buttons
 */
const ChatbotCard = ({
  chatbot,
  onPreview,
  onDocuments,
  onTrain,
  onWidget,
  onDelete,
  getStatusColor,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="text-lg font-semibold text-gray-900">
              {chatbot.name}
            </h3>
            <div
              className={`w-2 h-2 rounded-full ${getStatusColor(
                chatbot.status
              )}`}
            />
          </div>
          {chatbot.description && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {chatbot.description}
            </p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <div className="text-gray-500">Documents</div>
          <div className="font-semibold text-gray-900">
            {chatbot.trainingData?.totalDocuments || 0}
          </div>
        </div>
        <div>
          <div className="text-gray-500">Status</div>
          <div className="font-semibold capitalize text-gray-900">
            {chatbot.status}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onPreview(chatbot)}
          className="flex-1 px-3 py-2 text-sm bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors flex items-center justify-center space-x-1"
          disabled={chatbot.status !== "active"}
          title="Preview chatbot widget"
        >
          <Eye className="w-4 h-4" />
          <span>Preview</span>
        </button>
        <button
          onClick={() => onDocuments(chatbot)}
          className="flex-1 px-3 py-2 text-sm bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors flex items-center justify-center space-x-1"
          title="View and manage documents"
        >
          <FileText className="w-4 h-4" />
          <span>Documents</span>
        </button>
        <button
          onClick={() => onTrain(chatbot)}
          className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center space-x-1"
          disabled={chatbot.status === "training"}
          title="Train chatbot"
        >
          <Upload className="w-4 h-4" />
          <span>Train</span>
        </button>
        <button
          onClick={() => onWidget(chatbot)}
          className="flex-1 px-3 py-2 text-sm bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors flex items-center justify-center space-x-1"
          title="Get widget code"
        >
          <Code className="w-4 h-4" />
          <span>Widget</span>
        </button>
        <button
          onClick={() => onDelete(chatbot)}
          className="px-3 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
          title="Delete chatbot"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

ChatbotCard.propTypes = {
  chatbot: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    status: PropTypes.string.isRequired,
    trainingData: PropTypes.shape({
      totalDocuments: PropTypes.number,
    }),
  }).isRequired,
  onPreview: PropTypes.func.isRequired,
  onDocuments: PropTypes.func.isRequired,
  onTrain: PropTypes.func.isRequired,
  onWidget: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  getStatusColor: PropTypes.func.isRequired,
};

export default ChatbotCard;
