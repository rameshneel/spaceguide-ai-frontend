import { History as HistoryIcon, FileText, Clock } from "lucide-react";

const History = () => {
  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold mb-8 flex items-center gap-3">
        <HistoryIcon className="w-10 h-10 text-primary-600" />
        Usage History
      </h1>

      <div className="card max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gradient-to-br from-primary-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <HistoryIcon className="w-12 h-12 text-primary-600" />
          </div>
          <h2 className="text-2xl font-bold mb-4">History Coming Soon</h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Your complete usage history and activity logs will be available
            here. Track all your AI-generated content and interactions.
          </p>
          <div className="space-y-2 text-sm text-gray-500">
            <p>📊 Complete usage statistics</p>
            <p>📝 Generated content history</p>
            <p>⏱️ Activity timeline</p>
            <p>💾 Download your history</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default History;
