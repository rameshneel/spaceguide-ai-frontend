import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, PieChart as PieChartIcon } from "lucide-react";

const UsageCharts = ({ usageChartData, serviceUsageData }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      {/* Usage Chart */}
      <div className="card">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary-600" />
          Usage Trend (Last 7 Days)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={usageChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="usage"
              stroke="#3b82f6"
              strokeWidth={2}
              name="Requests"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Service Distribution Pie Chart - Always visible with empty state */}
      <div className="card">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <PieChartIcon className="w-5 h-5 text-primary-600" />
          Service Usage Distribution
        </h3>
        {serviceUsageData && serviceUsageData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={serviceUsageData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {serviceUsageData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-[300px] text-center">
            <PieChartIcon className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium mb-2">No usage data yet</p>
            <p className="text-sm text-gray-400 max-w-xs">
              Start using AI services to see your usage distribution here
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsageCharts;
