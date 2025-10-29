import { Link } from "react-router-dom";
import { History, CheckCircle, Activity } from "lucide-react";

const RecentActivity = ({ recentActivity }) => {
  // Format activity timestamp
  const formatTimeAgo = (date) => {
    if (!date) return "Unknown";
    const now = new Date();
    const then = new Date(date);
    const diffInSeconds = Math.floor((now - then) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <History className="w-5 h-5 text-primary-600" />
          Recent Activity
        </h3>
        <Link to="#" className="text-sm text-primary-600 hover:underline">
          View All
        </Link>
      </div>
      <div className="space-y-3">
        {recentActivity && recentActivity.length > 0 ? (
          recentActivity.map((activity, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
            >
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {activity.request?.prompt
                    ? `Generated: "${activity.request.prompt.substring(
                        0,
                        30
                      )}..."`
                    : "Used AI Text Writer"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatTimeAgo(
                    activity.request?.timestamp || activity.createdAt
                  )}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No recent activity</p>
            <p className="text-xs mt-1">
              Start using AI services to see activity
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentActivity;
