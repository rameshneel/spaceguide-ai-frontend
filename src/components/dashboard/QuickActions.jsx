import { Link } from "react-router-dom";
import { Sparkles, History, Download, Settings } from "lucide-react";
import { toast } from "react-hot-toast";

const QuickActions = () => {
  return (
    <div className="card bg-gradient-to-r from-primary-50 to-purple-50 border-2 border-primary-200">
      <h3 className="text-2xl font-bold mb-4 flex items-center">
        <Sparkles className="w-6 h-6 mr-2 text-primary-600" />
        Quick Actions
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link
          to="/ai-writer"
          className="flex items-center gap-3 p-4 bg-white rounded-lg hover:shadow-lg transition-shadow"
        >
          <Sparkles className="w-6 h-6 text-blue-600" />
          <div>
            <h4 className="font-semibold">Create Content</h4>
            <p className="text-xs text-gray-600">AI Text Writer</p>
          </div>
        </Link>
        <Link
          to="/history"
          className="flex items-center gap-3 p-4 bg-white rounded-lg hover:shadow-lg transition-shadow"
        >
          <History className="w-6 h-6 text-purple-600" />
          <div>
            <h4 className="font-semibold">View History</h4>
            <p className="text-xs text-gray-600">Recent generations</p>
          </div>
        </Link>
        <button
          onClick={() => toast.success("Export feature coming soon!")}
          className="flex items-center gap-3 p-4 bg-white rounded-lg hover:shadow-lg transition-shadow text-left"
        >
          <Download className="w-6 h-6 text-green-600" />
          <div>
            <h4 className="font-semibold">Export Report</h4>
            <p className="text-xs text-gray-600">Download CSV</p>
          </div>
        </button>
        <Link
          to="/profile"
          className="flex items-center gap-3 p-4 bg-white rounded-lg hover:shadow-lg transition-shadow"
        >
          <Settings className="w-6 h-6 text-indigo-600" />
          <div>
            <h4 className="font-semibold">Settings</h4>
            <p className="text-xs text-gray-600">Manage account</p>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default QuickActions;
