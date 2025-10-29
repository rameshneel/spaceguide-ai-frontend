import {
  Sparkles,
  Image,
  MessageSquare,
  Search,
  BarChart3,
} from "lucide-react";

const UsageBreakdown = ({ usage, timeFilter, onTimeFilterChange }) => {
  const services = [
    {
      name: "AI Text Writer",
      icon: <Sparkles className="w-5 h-5 text-blue-600" />,
      used: usage?.aiTextWriter?.wordsUsed || 0,
      limit: usage?.aiTextWriter?.wordsLimit || 0,
      percentage: usage?.aiTextWriter?.wordsPercentage || 0,
      unit: "words",
    },
    {
      name: "AI Image Generator",
      icon: <Image className="w-5 h-5 text-purple-600" />,
      used: usage?.aiImageGenerator?.imagesUsed || 0,
      limit: usage?.aiImageGenerator?.imagesLimit || 0,
      percentage: usage?.aiImageGenerator?.imagesPercentage || 0,
      unit: "images",
    },
    {
      name: "AI Chatbot",
      icon: <MessageSquare className="w-5 h-5 text-green-600" />,
      used: usage?.aiChatbot?.chatbotsUsed || 0,
      limit: usage?.aiChatbot?.chatbotsLimit || 0,
      percentage: usage?.aiChatbot?.chatbotsPercentage || 0,
      unit: "messages",
    },
    {
      name: "AI Search",
      icon: <Search className="w-5 h-5 text-orange-600" />,
      used: usage?.aiSearch?.searchesUsed || 0,
      limit: usage?.aiSearch?.searchesLimit || 0,
      percentage: usage?.aiSearch?.searchesPercentage || 0,
      unit: "searches",
    },
  ];

  return (
    <div className="card mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary-600" />
          Usage Breakdown
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => onTimeFilterChange("today")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              timeFilter === "today"
                ? "bg-primary-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Today
          </button>
          <button
            onClick={() => onTimeFilterChange("week")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              timeFilter === "week"
                ? "bg-primary-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => onTimeFilterChange("month")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              timeFilter === "month"
                ? "bg-primary-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            30 Days
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {services.map((service, index) => (
          <div key={index}>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                {service.icon}
                <span className="font-semibold">{service.name}</span>
              </div>
              <span className="text-sm text-gray-600">
                {service.used} / {service.limit} {service.unit} (
                {service.percentage}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  service.percentage >= 90
                    ? "bg-red-500"
                    : service.percentage >= 70
                    ? "bg-yellow-500"
                    : index === 0
                    ? "bg-blue-500"
                    : index === 1
                    ? "bg-purple-500"
                    : index === 2
                    ? "bg-green-500"
                    : "bg-orange-500"
                }`}
                style={{
                  width: `${Math.min(service.percentage, 100)}%`,
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UsageBreakdown;
