import { Clock, TrendingUp, Activity } from "lucide-react";

const UsageStatsCards = ({ detailedUsage, recentActivityCount }) => {
  const usageStats = [
    {
      icon: <Clock className="w-5 h-5" />,
      label: "Today's Usage",
      value: detailedUsage?.usage?.aiTextWriter?.wordsUsed || 0,
      max: detailedUsage?.usage?.aiTextWriter?.wordsLimit || 1000,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      label: "This Month",
      value: detailedUsage?.usage?.aiTextWriter?.wordsUsed || 0,
      max: null,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      icon: <Activity className="w-5 h-5" />,
      label: "Total Requests",
      value: recentActivityCount || 0,
      max: null,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {usageStats.map((stat, index) => (
        <div key={index} className={`card ${stat.bgColor}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">{stat.label}</p>
              <p className={`text-3xl font-bold mt-2 ${stat.color || ""}`}>
                {stat.value}
              </p>
              {stat.max && (
                <p className="text-gray-500 text-sm mt-1">of {stat.max}</p>
              )}
            </div>
            <div className={stat.color || "text-primary-600"}>{stat.icon}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default UsageStatsCards;
