import { useState, useEffect, useCallback } from "react";
import {
  History,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  Copy,
  ExternalLink,
} from "lucide-react";
import logger from "../utils/logger";
import { Link } from "react-router-dom";
import { aiServices } from "../services/aiServices";
import { toast } from "react-hot-toast";

const AIWriterHistoryPanel = ({ onLoadHistory }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch recent history
  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const data = await aiServices.getTextHistory(5, 1); // Last 5 items
      setHistory(data?.history || []);
    } catch (error) {
      logger.error("Failed to fetch history:", error);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load history on mount and refresh after new generation
  useEffect(() => {
    fetchHistory();

    // Expose refresh function globally for AIWriter to call after generation
    window.refreshHistoryPanel = fetchHistory;

    return () => {
      delete window.refreshHistoryPanel;
    };
  }, [fetchHistory]);

  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return "Unknown";
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Get content preview
  const getPreview = (content) => {
    if (!content) return "No content";
    const text = typeof content === "string" ? content : content.content || "";
    return text.length > 50 ? text.substring(0, 50) + "..." : text;
  };

  // Handle load history item
  const handleLoad = (item) => {
    const content = item.response?.data?.content || "";
    if (content && onLoadHistory) {
      onLoadHistory(content, item.request?.prompt || "");
      toast.success("History item loaded");
    }
  };

  // Handle copy
  const handleCopy = async (content) => {
    try {
      const text =
        typeof content === "string" ? content : content.content || "";
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy");
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 bg-primary-600 text-white p-4 rounded-full shadow-lg hover:bg-primary-700 transition-all duration-300 flex items-center gap-2 ${
          isOpen ? "translate-x-0" : "translate-x-0"
        }`}
        aria-label={isOpen ? "Close history" : "Open history"}
      >
        <History className="w-5 h-5" aria-hidden="true" />
        {!isOpen && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {history.length > 0 ? history.length : ""}
          </span>
        )}
      </button>

      {/* Slide-in Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-2xl z-40 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
            <div className="flex items-center gap-2">
              <History
                className="w-5 h-5 text-primary-600"
                aria-hidden="true"
              />
              <h3 className="font-semibold text-lg">Recent History</h3>
              {history.length > 0 && (
                <span className="bg-primary-100 text-primary-600 text-xs font-medium px-2 py-1 rounded-full">
                  {history.length}
                </span>
              )}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close history"
            >
              <ChevronUp className="w-5 h-5 text-gray-600 rotate-90" />
            </button>
          </div>

          {/* History List - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-3">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                  <span className="ml-2 text-sm text-gray-600">Loading...</span>
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-8">
                  <FileText
                    className="w-12 h-12 text-gray-300 mx-auto mb-2"
                    aria-hidden="true"
                  />
                  <p className="text-sm text-gray-500">No history yet</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Your generated content will appear here
                  </p>
                </div>
              ) : (
                <>
                  {history.map((item, index) => {
                    const content = item.response?.data?.content || "";
                    const prompt = item.request?.prompt || "No prompt";
                    const contentType =
                      item.request?.type ||
                      item.request?.parameters?.contentType ||
                      "Text";
                    const timestamp = item.request?.timestamp || item.createdAt;

                    return (
                      <div
                        key={item._id || index}
                        className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-primary-300 transition-colors cursor-pointer group"
                        onClick={() => handleLoad(item)}
                      >
                        {/* Content Type Badge */}
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-1 rounded">
                            {typeof contentType === "string"
                              ? contentType
                                  .replace(/_/g, " ")
                                  .replace(/\b\w/g, (l) => l.toUpperCase())
                              : "Text"}
                          </span>
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" aria-hidden="true" />
                            {formatTime(timestamp)}
                          </span>
                        </div>

                        {/* Prompt Preview */}
                        <p
                          className="text-xs text-gray-600 mb-2 line-clamp-1"
                          title={prompt}
                        >
                          <span className="font-medium">Prompt:</span>{" "}
                          {getPreview(prompt)}
                        </p>

                        {/* Content Preview */}
                        <p
                          className="text-sm text-gray-700 mb-3 line-clamp-2"
                          title={content}
                        >
                          {getPreview(content)}
                        </p>

                        {/* Actions */}
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLoad(item);
                            }}
                            className="flex-1 text-xs px-2 py-1 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors flex items-center justify-center gap-1"
                            title="Load this content"
                          >
                            <FileText className="w-3 h-3" aria-hidden="true" />
                            Load
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(content);
                            }}
                            className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                            title="Copy to clipboard"
                          >
                            <Copy className="w-3 h-3" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* View All Link */}
                  <Link
                    to="/history"
                    className="flex text-center text-sm text-primary-600 hover:text-primary-700 font-medium mt-4 pt-4 border-t border-gray-200 items-center justify-center gap-1 transition-colors"
                  >
                    View All History
                    <ExternalLink className="w-4 h-4" aria-hidden="true" />
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Backdrop overlay when drawer is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-30"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
};

export default AIWriterHistoryPanel;
