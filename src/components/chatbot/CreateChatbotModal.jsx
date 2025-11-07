import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { CHATBOT_CONSTANTS } from "../../constants/chatbot";
import Modal from "../common/Modal";

/**
 * Create Chatbot Modal Component
 */
const CreateChatbotModal = ({
  isOpen,
  onClose,
  onSubmit,
  templates = [],
  onLoadTemplates,
}) => {
  const [form, setForm] = useState({
    name: "",
    description: "",
    template: "",
    systemPrompt: "",
    temperature: CHATBOT_CONSTANTS.DEFAULT_TEMPERATURE,
    maxTokens: CHATBOT_CONSTANTS.DEFAULT_MAX_TOKENS,
  });

  useEffect(() => {
    if (isOpen && templates.length === 0) {
      onLoadTemplates();
    }
  }, [isOpen]);

  const handleTemplateSelect = (templateId) => {
    const template = templates.find(
      (t) => t.id === templateId || t.key === templateId
    );
    if (template) {
      setForm({
        ...form,
        template: templateId,
        systemPrompt: template.config?.systemPrompt || form.systemPrompt,
        temperature:
          template.config?.temperature || CHATBOT_CONSTANTS.DEFAULT_TEMPERATURE,
        maxTokens:
          template.config?.maxTokens || CHATBOT_CONSTANTS.DEFAULT_MAX_TOKENS,
      });
    }
  };

  const handleSubmit = () => {
    onSubmit(form);
    setForm({
      name: "",
      description: "",
      template: "",
      systemPrompt: "",
      temperature: CHATBOT_CONSTANTS.DEFAULT_TEMPERATURE,
      maxTokens: CHATBOT_CONSTANTS.DEFAULT_MAX_TOKENS,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Chatbot"
      maxWidth="max-w-2xl"
    >
      <div className="p-6 space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Chatbot Name *
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
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
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
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
              value={form.template}
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
            value={form.systemPrompt}
            onChange={(e) => setForm({ ...form, systemPrompt: e.target.value })}
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
              value={form.temperature}
              onChange={(e) =>
                setForm({
                  ...form,
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
              value={form.maxTokens}
              onChange={(e) =>
                setForm({
                  ...form,
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
          onClick={onClose}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
        <button onClick={handleSubmit} className="btn-primary px-4 py-2">
          Create Chatbot
        </button>
      </div>
    </Modal>
  );
};

CreateChatbotModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  templates: PropTypes.array,
  onLoadTemplates: PropTypes.func,
};

export default CreateChatbotModal;
