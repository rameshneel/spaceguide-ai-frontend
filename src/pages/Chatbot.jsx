import { useState, useEffect, useCallback } from "react";
import {
  MessageSquare,
  Loader,
  Plus,
  X,
  Upload,
  FileText,
  Code,
  Trash2,
  Copy,
  Check,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Eye,
  BarChart3,
  FileUp,
  Type,
} from "lucide-react";
import { aiServices } from "../services/aiServices";
import { toast } from "react-hot-toast";
import logger from "../utils/logger";
import { authService } from "../services/auth";
import UpgradeLimitModal from "../components/UpgradeLimitModal";
import { TIMING } from "../constants/timing";
import { CHATBOT_CONSTANTS } from "../constants/chatbot";

/**
 * AI Chatbot Builder Page
 * Create, train, and manage chatbots for your website
 *
 * Features:
 * - Create chatbots with templates
 * - Train chatbots with files (PDF/TXT) or text
 * - Get widget code to embed on website
 * - Manage chatbots (view, edit, delete)
 * - View chatbot statistics
 */
const Chatbot = () => {
  // Chatbots list
  const [chatbots, setChatbots] = useState([]);
  const [chatbotsLoading, setChatbotsLoading] = useState(true);
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTrainModal, setShowTrainModal] = useState(false);
  const [showWidgetModal, setShowWidgetModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [selectedChatbot, setSelectedChatbot] = useState(null);

  // Preview chat
  const [previewMessages, setPreviewMessages] = useState([]);
  const [previewInput, setPreviewInput] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewSessionId, setPreviewSessionId] = useState(null);
  const [widgetExpanded, setWidgetExpanded] = useState(false);

  // Documents
  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [editingDocument, setEditingDocument] = useState(null);
  const [editDocumentText, setEditDocumentText] = useState("");
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [documentSearch, setDocumentSearch] = useState("");

  // Create form
  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    template: "",
    systemPrompt: "",
    temperature: CHATBOT_CONSTANTS.DEFAULT_TEMPERATURE,
    maxTokens: CHATBOT_CONSTANTS.DEFAULT_MAX_TOKENS,
  });

  // Training
  const [trainingFile, setTrainingFile] = useState(null);
  const [trainingText, setTrainingText] = useState("");
  const [trainingType, setTrainingType] = useState("file"); // "file" or "text"
  const [trainingLoading, setTrainingLoading] = useState(false);

  // Widget code
  const [widgetCode, setWidgetCode] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);

  // Usage
  const [usageData, setUsageData] = useState(null);
  const [limitExceededData, setLimitExceededData] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Load chatbots and templates on mount
  useEffect(() => {
    loadChatbots();
    loadTemplates();
    loadUsageData();
  }, []);

  // Load chatbots
  const loadChatbots = async () => {
    try {
      setChatbotsLoading(true);
      const data = await aiServices.getChatbots();
      const chatbotsList = data?.chatbots || data || [];
      setChatbots(chatbotsList);
    } catch (error) {
      logger.error("Failed to load chatbots:", error);
      toast.error("Failed to load chatbots");
    } finally {
      setChatbotsLoading(false);
    }
  };

  // Load templates
  const loadTemplates = async () => {
    try {
      setTemplatesLoading(true);
      const data = await aiServices.getChatbotTemplates();
      const templatesList = data?.templates || data || [];
      setTemplates(templatesList);
    } catch (error) {
      logger.error("Failed to load templates:", error);
    } finally {
      setTemplatesLoading(false);
    }
  };

  // Load usage data
  const loadUsageData = useCallback(async () => {
    try {
      const data = await authService.getDetailedUsage();
      setUsageData(data);
    } catch (error) {
      if (error?.response?.status !== 429) {
        logger.error("Failed to load usage data:", error);
      }
    }
  }, []);

  // Load documents
  const loadDocuments = useCallback(
    async (chatbotId) => {
      if (!chatbotId) return;
      try {
        setDocumentsLoading(true);
        const data = await aiServices.getChatbotDocuments(
          chatbotId,
          CHATBOT_CONSTANTS.DOCUMENT_LIMIT,
          CHATBOT_CONSTANTS.DOCUMENT_OFFSET,
          documentSearch || null
        );
        setDocuments(data?.documents || data || []);
      } catch (error) {
        logger.error("Failed to load documents:", error);
        toast.error("Failed to load documents");
      } finally {
        setDocumentsLoading(false);
      }
    },
    [documentSearch]
  );

  // Reload documents when search changes (debounced)
  useEffect(() => {
    if (showDocumentsModal && selectedChatbot) {
      const timer = setTimeout(() => {
        loadDocuments(selectedChatbot.id);
      }, TIMING.DOCUMENT_SEARCH_DEBOUNCE);
      return () => clearTimeout(timer);
    }
  }, [documentSearch, showDocumentsModal, selectedChatbot, loadDocuments]);

  // Handle create chatbot
  const handleCreate = async () => {
    if (!createForm.name.trim()) {
      toast.error("Please enter a chatbot name");
      return;
    }

    try {
      const selectedTemplate = templates.find(
        (t) => t.id === createForm.template || t.key === createForm.template
      );

      const config = {
        systemPrompt:
          createForm.systemPrompt ||
          selectedTemplate?.config?.systemPrompt ||
          "You are a helpful assistant.",
        temperature:
          createForm.temperature || CHATBOT_CONSTANTS.DEFAULT_TEMPERATURE,
        maxTokens: createForm.maxTokens || CHATBOT_CONSTANTS.DEFAULT_MAX_TOKENS,
      };

      const response = await aiServices.createChatbot({
        name: createForm.name.trim(),
        description: createForm.description.trim() || undefined,
        template: createForm.template || undefined,
        config,
      });

      toast.success("Chatbot created successfully!");
      setShowCreateModal(false);
      setCreateForm({
        name: "",
        description: "",
        template: "",
        systemPrompt: "",
        temperature: CHATBOT_CONSTANTS.DEFAULT_TEMPERATURE,
        maxTokens: CHATBOT_CONSTANTS.DEFAULT_MAX_TOKENS,
      });
      loadChatbots();
      loadUsageData();
    } catch (error) {
      logger.error("Failed to create chatbot:", error);
      const errorMessage =
        error?.response?.data?.message || "Failed to create chatbot";
      toast.error(errorMessage);

      // Check if limit exceeded
      if (
        errorMessage.toLowerCase().includes("limit") ||
        error?.response?.status === 403
      ) {
        setLimitExceededData({
          service: "ai_chatbot_builder",
          message: errorMessage,
        });
        setShowModal(true);
      }
    }
  };

  // Handle train chatbot
  const handleTrain = async () => {
    if (!selectedChatbot) return;

    try {
      setTrainingLoading(true);

      if (trainingType === "file") {
        if (!trainingFile) {
          toast.error("Please select a file");
          setTrainingLoading(false);
          return;
        }
        await aiServices.trainChatbotFile(selectedChatbot.id, trainingFile);
        toast.success("Training started! Your chatbot will be ready soon.");
      } else {
        if (!trainingText.trim()) {
          toast.error("Please enter training text");
          setTrainingLoading(false);
          return;
        }
        await aiServices.trainChatbotText(selectedChatbot.id, trainingText);
        toast.success("Training started! Your chatbot will be ready soon.");
      }

      setShowTrainModal(false);
      setTrainingFile(null);
      setTrainingText("");
      loadChatbots();
    } catch (error) {
      logger.error("Failed to train chatbot:", error);
      const errorMessage =
        error?.response?.data?.message || "Failed to train chatbot";
      toast.error(errorMessage);
    } finally {
      setTrainingLoading(false);
    }
  };

  // Handle get widget code
  const handleGetWidgetCode = async (chatbot) => {
    try {
      const data = await aiServices.getWidgetCode(chatbot.id);
      setWidgetCode(data?.widget || data);
      setSelectedChatbot(chatbot);
      setShowWidgetModal(true);
    } catch (error) {
      logger.error("Failed to get widget code:", error);
      toast.error("Failed to get widget code");
    }
  };

  // Handle copy code
  const handleCopyCode = useCallback(async (code, type) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(type);
      toast.success("Code copied to clipboard!");
      setTimeout(() => setCopiedCode(null), TIMING.COPY_FEEDBACK_TIMEOUT);
    } catch (error) {
      logger.error("Failed to copy to clipboard:", error);
      toast.error("Failed to copy code. Please copy manually.");
    }
  }, []);

  // Handle delete chatbot
  const handleDelete = async () => {
    if (!selectedChatbot) return;

    try {
      await aiServices.deleteChatbot(selectedChatbot.id);
      toast.success("Chatbot deleted successfully");
      setShowDeleteModal(false);
      setSelectedChatbot(null);
      loadChatbots();
      loadUsageData();
    } catch (error) {
      logger.error("Failed to delete chatbot:", error);
      toast.error("Failed to delete chatbot");
    }
  };

  // Handle preview - load widget code
  const handlePreviewOpen = async (chatbot) => {
    try {
      // Get widget code
      const data = await aiServices.getWidgetCode(chatbot.id);
      setWidgetCode(data?.widget || data);
      setSelectedChatbot(chatbot);
      setShowPreviewModal(true);
    } catch (error) {
      logger.error("Failed to load widget code:", error);
      toast.error("Failed to load widget preview");
    }
  };

  // Handle preview chat send (not used anymore but keeping for compatibility)
  const handlePreviewSend = async () => {
    if (!previewInput.trim() || previewLoading || !selectedChatbot) return;

    const userMessage = previewInput.trim();
    setPreviewInput("");

    // Add user message
    const userMsg = {
      id: `user-${Date.now()}`,
      role: "user",
      content: userMessage,
      timestamp: new Date().toISOString(),
    };
    setPreviewMessages((prev) => [...prev, userMsg]);

    // Show loading
    const loadingMsg = {
      id: `loading-${Date.now()}`,
      role: "assistant",
      content: "",
      loading: true,
      timestamp: new Date().toISOString(),
    };
    setPreviewMessages((prev) => [...prev, loadingMsg]);

    try {
      setPreviewLoading(true);
      const result = await aiServices.queryChatbot(
        selectedChatbot.id,
        userMessage,
        previewSessionId
      );

      // Update session ID
      if (result.sessionId && result.sessionId !== previewSessionId) {
        setPreviewSessionId(result.sessionId);
      }

      // Remove loading and add response
      setPreviewMessages((prev) => {
        const filtered = prev.filter((msg) => msg.id !== loadingMsg.id);
        return [
          ...filtered,
          {
            id: `bot-${Date.now()}`,
            role: "assistant",
            content: result.response,
            timestamp: new Date().toISOString(),
            sources: result.sources,
          },
        ];
      });
    } catch (error) {
      logger.error("Failed to send preview message:", error);
      toast.error("Failed to get response");
      setPreviewMessages((prev) =>
        prev.filter((msg) => msg.id !== loadingMsg.id)
      );
    } finally {
      setPreviewLoading(false);
    }
  };

  // Handle update document
  const handleUpdateDocument = async () => {
    if (!selectedChatbot || !editingDocument || !editDocumentText.trim())
      return;

    try {
      await aiServices.updateChatbotDocument(
        selectedChatbot.id,
        editingDocument.id,
        editDocumentText.trim()
      );
      toast.success("Document updated successfully");
      setEditingDocument(null);
      setEditDocumentText("");
      loadDocuments(selectedChatbot.id);
      loadChatbots(); // Refresh chatbot stats
    } catch (error) {
      logger.error("Failed to update document:", error);
      toast.error("Failed to update document");
    }
  };

  // Handle delete documents
  const handleDeleteDocuments = async () => {
    if (!selectedChatbot || selectedDocuments.length === 0) return;

    try {
      await aiServices.deleteChatbotDocuments(
        selectedChatbot.id,
        selectedDocuments
      );
      toast.success(`${selectedDocuments.length} document(s) deleted`);
      setSelectedDocuments([]);
      loadDocuments(selectedChatbot.id);
      loadChatbots(); // Refresh chatbot stats
    } catch (error) {
      logger.error("Failed to delete documents:", error);
      toast.error("Failed to delete documents");
    }
  };

  // Handle template select
  const handleTemplateSelect = (templateId) => {
    const template = templates.find(
      (t) => t.id === templateId || t.key === templateId
    );
    if (template) {
      setCreateForm({
        ...createForm,
        template: templateId,
        systemPrompt: template.config?.systemPrompt || createForm.systemPrompt,
        temperature:
          template.config?.temperature || CHATBOT_CONSTANTS.DEFAULT_TEMPERATURE,
        maxTokens:
          template.config?.maxTokens || CHATBOT_CONSTANTS.DEFAULT_MAX_TOKENS,
      });
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "training":
        return "bg-yellow-500";
      case "inactive":
        return "bg-gray-400";
      default:
        return "bg-gray-400";
    }
  };

  // Usage percentage - use actual chatbots count if available, otherwise use usage data
  const chatbotsCount =
    chatbots.length || usageData?.usage?.aiChatbot?.chatbotsUsed || 0;
  const chatbotsLimit = usageData?.usage?.aiChatbot?.chatbotsLimit || 5;
  const usagePercentage = Math.round((chatbotsCount / chatbotsLimit) * 100);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        {/* Title Section */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
              AI Chatbot Builder
            </h1>
            <p className="text-gray-600 text-sm sm:text-base mt-1">
              Create and train chatbots for your website
            </p>
          </div>
        </div>

        {/* Usage Stats and Action Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          {/* Usage Stats - Enhanced Card Design */}
          {usageData?.usage?.aiChatbot && (
            <div className="flex-1 bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center shadow-sm">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Chatbot Usage
                    </span>
                    <span className="text-base font-bold text-gray-900">
                      {chatbots.length ||
                        usageData.usage.aiChatbot.chatbotsUsed ||
                        0}{" "}
                      / {usageData.usage.aiChatbot.chatbotsLimit || 0}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        usagePercentage >= 100
                          ? "bg-gradient-to-r from-red-500 to-red-600"
                          : usagePercentage >= 80
                          ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                          : "bg-gradient-to-r from-green-500 to-emerald-500"
                      }`}
                      style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                    />
                  </div>
                  {usagePercentage >= 80 && usagePercentage < 100 && (
                    <p className="text-xs text-orange-600 mt-1.5 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {usagePercentage}% used - Consider upgrading
                    </p>
                  )}
                  {usagePercentage >= 100 && (
                    <p className="text-xs text-red-600 mt-1.5 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Limit reached - Upgrade to create more
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Create Button */}
          <div className="flex-shrink-0">
            <button
              onClick={() => {
                setShowCreateModal(true);
                loadTemplates();
              }}
              disabled={usagePercentage >= 100}
              className="btn-primary flex items-center space-x-2 whitespace-nowrap w-full sm:w-auto justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-5 h-5" />
              <span>Create Chatbot</span>
            </button>
          </div>
        </div>
      </div>

      {/* Chatbots Grid */}
      {chatbotsLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : chatbots.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-200">
          <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No chatbots yet
          </h3>
          <p className="text-gray-600 mb-6">
            Create your first chatbot to get started
          </p>
          <button
            onClick={() => {
              setShowCreateModal(true);
              loadTemplates();
            }}
            className="btn-primary inline-flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Create Your First Chatbot</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {chatbots.map((chatbot) => (
            <div
              key={chatbot.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
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
                  onClick={() => handlePreviewOpen(chatbot)}
                  className="flex-1 px-3 py-2 text-sm bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors flex items-center justify-center space-x-1"
                  disabled={chatbot.status !== "active"}
                  title="Preview chatbot widget"
                >
                  <Eye className="w-4 h-4" />
                  <span>Preview</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedChatbot(chatbot);
                    loadDocuments(chatbot.id);
                    setShowDocumentsModal(true);
                  }}
                  className="flex-1 px-3 py-2 text-sm bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors flex items-center justify-center space-x-1"
                  title="View and manage documents"
                >
                  <FileText className="w-4 h-4" />
                  <span>Documents</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedChatbot(chatbot);
                    setShowTrainModal(true);
                  }}
                  className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center space-x-1"
                  disabled={chatbot.status === "training"}
                  title="Train chatbot"
                >
                  <Upload className="w-4 h-4" />
                  <span>Train</span>
                </button>
                <button
                  onClick={() => handleGetWidgetCode(chatbot)}
                  className="flex-1 px-3 py-2 text-sm bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors flex items-center justify-center space-x-1"
                  title="Get widget code"
                >
                  <Code className="w-4 h-4" />
                  <span>Widget</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedChatbot(chatbot);
                    setShowDeleteModal(true);
                  }}
                  className="px-3 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  title="Delete chatbot"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Chatbot Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                Create New Chatbot
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chatbot Name *
                </label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, name: e.target.value })
                  }
                  placeholder="My Support Bot"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={createForm.description}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="Customer support chatbot for my website"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Template */}
              {templates.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template (Optional)
                  </label>
                  <select
                    value={createForm.template}
                    onChange={(e) => handleTemplateSelect(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select a template...</option>
                    {templates.map((template) => (
                      <option
                        key={template.id || template.key}
                        value={template.id || template.key}
                      >
                        {template.name} - {template.description}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* System Prompt */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  System Prompt
                </label>
                <textarea
                  value={createForm.systemPrompt}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      systemPrompt: e.target.value,
                    })
                  }
                  placeholder="You are a helpful assistant..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Config */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Temperature (0-2)
                  </label>
                  <input
                    type="number"
                    min={CHATBOT_CONSTANTS.MIN_TEMPERATURE}
                    max={CHATBOT_CONSTANTS.MAX_TEMPERATURE}
                    step="0.1"
                    value={createForm.temperature}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        temperature: parseFloat(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Tokens
                  </label>
                  <input
                    type="number"
                    min={CHATBOT_CONSTANTS.MIN_TOKENS}
                    max={CHATBOT_CONSTANTS.MAX_TOKENS}
                    value={createForm.maxTokens}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        maxTokens: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button onClick={handleCreate} className="btn-primary px-4 py-2">
                Create Chatbot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Train Chatbot Modal */}
      {showTrainModal && selectedChatbot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                Train {selectedChatbot.name}
              </h2>
              <button
                onClick={() => {
                  setShowTrainModal(false);
                  setTrainingFile(null);
                  setTrainingText("");
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Training Type */}
              <div className="flex space-x-2 mb-4">
                <button
                  onClick={() => setTrainingType("file")}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                    trainingType === "file"
                      ? "bg-primary-600 text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  <FileUp className="w-4 h-4 inline mr-2" />
                  Upload File (PDF/TXT)
                </button>
                <button
                  onClick={() => setTrainingType("text")}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                    trainingType === "text"
                      ? "bg-primary-600 text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  <Type className="w-4 h-4 inline mr-2" />
                  Enter Text
                </button>
              </div>

              {trainingType === "file" ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload File (PDF or TXT, max{" "}
                    {CHATBOT_CONSTANTS.MAX_FILE_SIZE_MB}MB)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <input
                      type="file"
                      accept=".pdf,.txt"
                      onChange={(e) => setTrainingFile(e.target.files[0])}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <Upload className="w-12 h-12 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600">
                        {trainingFile
                          ? trainingFile.name
                          : "Click to upload or drag and drop"}
                      </span>
                    </label>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Training Text
                  </label>
                  <textarea
                    value={trainingText}
                    onChange={(e) => setTrainingText(e.target.value)}
                    placeholder="Enter text content to train your chatbot..."
                    rows={10}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowTrainModal(false);
                  setTrainingFile(null);
                  setTrainingText("");
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleTrain}
                disabled={trainingLoading}
                className="btn-primary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {trainingLoading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin inline mr-2" />
                    Training...
                  </>
                ) : (
                  "Start Training"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Widget Code Modal */}
      {showWidgetModal && widgetCode && selectedChatbot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Widget Code - {selectedChatbot.name}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Copy and paste this code into your website
                </p>
              </div>
              <button
                onClick={() => {
                  setShowWidgetModal(false);
                  setWidgetCode(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Script Code */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Script Code (Recommended)
                  </label>
                  <button
                    onClick={() =>
                      handleCopyCode(widgetCode.code?.script, "script")
                    }
                    className="flex items-center space-x-1 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    {copiedCode === "script" ? (
                      <>
                        <Check className="w-4 h-4 text-green-600" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-xs">
                  <code>{widgetCode.code?.script || widgetCode.script}</code>
                </pre>
              </div>

              {/* Iframe Code */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Iframe Code
                  </label>
                  <button
                    onClick={() =>
                      handleCopyCode(widgetCode.code?.iframe, "iframe")
                    }
                    className="flex items-center space-x-1 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    {copiedCode === "iframe" ? (
                      <>
                        <Check className="w-4 h-4 text-green-600" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-xs">
                  <code>{widgetCode.code?.iframe || widgetCode.iframe}</code>
                </pre>
              </div>

              {/* Widget URL */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Widget URL
                  </label>
                  <button
                    onClick={() => handleCopyCode(widgetCode.url, "url")}
                    className="flex items-center space-x-1 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    {copiedCode === "url" ? (
                      <>
                        <Check className="w-4 h-4 text-green-600" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <code className="text-xs break-all">{widgetCode.url}</code>
                </div>
              </div>

              {/* API Key */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    API Key
                  </label>
                  <button
                    onClick={() => handleCopyCode(widgetCode.apiKey, "apiKey")}
                    className="flex items-center space-x-1 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    {copiedCode === "apiKey" ? (
                      <>
                        <Check className="w-4 h-4 text-green-600" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <code className="text-xs break-all">{widgetCode.apiKey}</code>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedChatbot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
                Delete Chatbot?
              </h2>
              <p className="text-gray-600 text-center mb-6">
                Are you sure you want to delete "{selectedChatbot.name}"? This
                action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedChatbot(null);
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Widget Modal */}
      {showPreviewModal && selectedChatbot && widgetCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Widget Preview - {selectedChatbot.name}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  See how your chatbot widget looks on a website
                </p>
              </div>
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  setWidgetCode(null);
                  setPreviewMessages([]);
                  setPreviewSessionId(null);
                  setWidgetExpanded(false);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-hidden">
              {/* Widget Preview */}
              <div className="p-6 bg-gray-100 flex items-center justify-center h-full">
                <div className="relative w-full h-full max-w-2xl mx-auto">
                  {/* Professional Simulated Website */}
                  <div className="absolute inset-0 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
                    {/* Professional Website Header */}
                    <div className="h-20 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 shadow-md">
                      <div className="h-full flex items-center justify-between px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                            <span className="text-indigo-600 font-bold text-lg">
                              SG
                            </span>
                          </div>
                          <div>
                            <h3 className="text-white font-bold text-lg">
                              SpaceGuideAI
                            </h3>
                            <p className="text-purple-100 text-xs">
                              AI-Powered Solutions
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <button className="text-white/90 hover:text-white text-sm font-medium transition-colors">
                            Home
                          </button>
                          <button className="text-white/90 hover:text-white text-sm font-medium transition-colors">
                            Services
                          </button>
                          <button className="text-white/90 hover:text-white text-sm font-medium transition-colors">
                            Contact
                          </button>
                          <button className="px-4 py-2 bg-white text-indigo-600 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors shadow-sm">
                            Get Started
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Hero Section */}
                    <div className="h-[calc(100%-5rem)] overflow-y-auto bg-gradient-to-b from-gray-50 via-white to-gray-50">
                      {/* Hero Banner */}
                      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-16 px-8">
                        <div className="max-w-3xl mx-auto text-center">
                          <h1 className="text-4xl font-bold mb-4">
                            Transform Your Business with AI
                          </h1>
                          <p className="text-xl text-indigo-100 mb-8">
                            Powerful AI solutions for text generation, image
                            creation, and intelligent chatbots
                          </p>
                          <div className="flex items-center justify-center space-x-4">
                            <button className="px-6 py-3 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-gray-50 transition-colors shadow-lg">
                              Start Free Trial
                            </button>
                            <button className="px-6 py-3 bg-indigo-700 text-white rounded-lg font-semibold hover:bg-indigo-800 transition-colors border border-indigo-500">
                              Learn More
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Features Section */}
                      <div className="py-12 px-8">
                        <div className="max-w-6xl mx-auto">
                          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
                            Why Choose Us?
                          </h2>
                          <div className="grid grid-cols-3 gap-6">
                            {/* Feature 1 */}
                            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4">
                                <Sparkles className="w-6 h-6 text-white" />
                              </div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                AI Text Writer
                              </h3>
                              <p className="text-sm text-gray-600">
                                Create high-quality content in seconds with our
                                advanced AI writing assistant
                              </p>
                            </div>

                            {/* Feature 2 */}
                            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
                              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mb-4">
                                <MessageSquare className="w-6 h-6 text-white" />
                              </div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Smart Chatbots
                              </h3>
                              <p className="text-sm text-gray-600">
                                Build intelligent chatbots that understand and
                                assist your customers 24/7
                              </p>
                            </div>

                            {/* Feature 3 */}
                            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
                              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mb-4">
                                <BarChart3 className="w-6 h-6 text-white" />
                              </div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Analytics Dashboard
                              </h3>
                              <p className="text-sm text-gray-600">
                                Track performance and insights with detailed
                                analytics and reporting
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* CTA Section */}
                      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 py-12 px-8 border-y border-indigo-100">
                        <div className="max-w-4xl mx-auto text-center">
                          <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            Ready to Get Started?
                          </h2>
                          <p className="text-gray-600 mb-6">
                            Join thousands of businesses using AI to transform
                            their operations
                          </p>
                          <button className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg">
                            Start Your Free Trial Today
                          </button>
                        </div>
                      </div>

                      {/* Info Banner */}
                      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mx-8 my-8 rounded-r-lg">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <MessageSquare className="w-5 h-5 text-blue-600 mt-0.5" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-blue-800">
                              <strong>💬 Need Help?</strong> Click the chat icon
                              in the bottom-right corner to speak with our AI
                              assistant!
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Professional Chatbot Widget */}
                  {widgetCode.url && (
                    <>
                      {/* Floating Chat Button */}
                      {!widgetExpanded && (
                        <button
                          onClick={() => setWidgetExpanded(true)}
                          className="absolute bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 flex items-center justify-center z-50 group animate-bounce"
                          aria-label="Open chatbot"
                          style={{
                            animation: "bounce 2s infinite",
                          }}
                        >
                          <MessageSquare className="w-7 h-7 text-white group-hover:scale-110 transition-transform" />
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse" />
                        </button>
                      )}

                      {/* Chat Window */}
                      {widgetExpanded && (
                        <div className="absolute bottom-6 right-6 w-96 h-[600px] bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col z-50 animate-in slide-in-from-bottom-5 duration-300">
                          {/* Chat Header */}
                          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-xl p-4 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg">
                                <MessageSquare className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <h4 className="text-white font-semibold text-base">
                                  {selectedChatbot?.name || "Chatbot"}
                                </h4>
                                <p className="text-xs text-blue-100 flex items-center">
                                  <span className="w-2 h-2 bg-green-400 rounded-full mr-1.5 animate-pulse" />
                                  Online
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setWidgetExpanded(false);
                                setPreviewMessages([]);
                                setPreviewSessionId(null);
                              }}
                              className="w-8 h-8 flex items-center justify-center text-white hover:bg-white/20 rounded-lg transition-colors"
                              aria-label="Minimize chat"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>

                          {/* Messages Area */}
                          <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-gray-50 to-white">
                            {previewMessages.length === 0 ? (
                              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
                                  <MessageSquare className="w-10 h-10 text-white" />
                                </div>
                                <h5 className="text-xl font-bold text-gray-900 mb-2">
                                  Welcome! 👋
                                </h5>
                                <p className="text-sm text-gray-600 max-w-xs leading-relaxed">
                                  {selectedChatbot?.description ||
                                    "How can I help you today?"}
                                </p>
                                <div className="mt-6 flex flex-wrap gap-2 justify-center">
                                  <button
                                    onClick={() => {
                                      setPreviewInput("Hello");
                                      handlePreviewSend();
                                    }}
                                    className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                  >
                                    Say Hello
                                  </button>
                                  <button
                                    onClick={() => {
                                      setPreviewInput("What can you do?");
                                      handlePreviewSend();
                                    }}
                                    className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                  >
                                    What can you do?
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                {previewMessages.map((msg) => (
                                  <div
                                    key={msg.id}
                                    className={`flex ${
                                      msg.role === "user"
                                        ? "justify-end"
                                        : "justify-start"
                                    }`}
                                  >
                                    <div
                                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                                        msg.role === "user"
                                          ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md"
                                          : "bg-white text-gray-900 border border-gray-200 shadow-sm"
                                      }`}
                                    >
                                      {msg.loading ? (
                                        <div className="flex items-center space-x-2">
                                          <div className="flex space-x-1">
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                                            <div
                                              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                              style={{ animationDelay: "0.1s" }}
                                            />
                                            <div
                                              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                              style={{ animationDelay: "0.2s" }}
                                            />
                                          </div>
                                          <span className="text-sm">
                                            Typing...
                                          </span>
                                        </div>
                                      ) : (
                                        <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                          {msg.content}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Chat Input */}
                          <div className="p-4 bg-white border-t border-gray-200 rounded-b-xl">
                            <div className="flex items-end space-x-2">
                              <textarea
                                value={previewInput}
                                onChange={(e) =>
                                  setPreviewInput(e.target.value)
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handlePreviewSend();
                                  }
                                }}
                                placeholder="Type your message..."
                                disabled={
                                  previewLoading ||
                                  selectedChatbot?.status !== "active"
                                }
                                rows={2}
                                className="flex-1 resize-none border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                              />
                              <button
                                onClick={handlePreviewSend}
                                disabled={
                                  !previewInput.trim() ||
                                  previewLoading ||
                                  selectedChatbot?.status !== "active"
                                }
                                className="w-11 h-11 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center justify-center"
                              >
                                {previewLoading ? (
                                  <Loader className="w-5 h-5 animate-spin" />
                                ) : (
                                  <MessageSquare className="w-5 h-5" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Documents Modal */}
      {showDocumentsModal && selectedChatbot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Documents - {selectedChatbot.name}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Manage training documents
                </p>
              </div>
              <button
                onClick={() => {
                  setShowDocumentsModal(false);
                  setDocuments([]);
                  setSelectedDocuments([]);
                  setEditingDocument(null);
                  setDocumentSearch("");
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search and Actions */}
            <div className="p-4 border-b border-gray-200 flex items-center space-x-3">
              <input
                type="text"
                placeholder="Search documents..."
                value={documentSearch}
                onChange={(e) => setDocumentSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    loadDocuments(selectedChatbot.id);
                  }
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                onClick={() => loadDocuments(selectedChatbot.id)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              {selectedDocuments.length > 0 && (
                <button
                  onClick={handleDeleteDocuments}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete Selected ({selectedDocuments.length})
                </button>
              )}
            </div>

            {/* Documents List */}
            <div className="flex-1 overflow-y-auto p-6">
              {documentsLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader className="w-8 h-8 animate-spin text-primary-600" />
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-20">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No documents found</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Train your chatbot to add documents
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      {editingDocument?.id === doc.id ? (
                        <div className="space-y-3">
                          <textarea
                            value={editDocumentText}
                            onChange={(e) =>
                              setEditDocumentText(e.target.value)
                            }
                            rows={6}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => {
                                setEditingDocument(null);
                                setEditDocumentText("");
                              }}
                              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleUpdateDocument}
                              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="text-xs text-gray-500 mb-1">
                                ID: {doc.id}
                              </div>
                              {doc.metadata?.source && (
                                <div className="text-xs text-gray-500 mb-2">
                                  Source: {doc.metadata.source}
                                </div>
                              )}
                              <p className="text-sm text-gray-900 line-clamp-3">
                                {doc.text || doc.content || "No content"}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                              <input
                                type="checkbox"
                                checked={selectedDocuments.includes(doc.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedDocuments([
                                      ...selectedDocuments,
                                      doc.id,
                                    ]);
                                  } else {
                                    setSelectedDocuments(
                                      selectedDocuments.filter(
                                        (id) => id !== doc.id
                                      )
                                    );
                                  }
                                }}
                                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end space-x-2 mt-3">
                            <button
                              onClick={() => {
                                setEditingDocument(doc);
                                setEditDocumentText(
                                  doc.text || doc.content || ""
                                );
                              }}
                              className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                setSelectedDocuments([doc.id]);
                                handleDeleteDocuments();
                              }}
                              className="px-3 py-1 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Limit Modal */}
      {showModal && limitExceededData && (
        <UpgradeLimitModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          limitData={limitExceededData}
        />
      )}
    </div>
  );
};

export default Chatbot;
