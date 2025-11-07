import { Link } from "react-router-dom";
import { AlertTriangle, CheckCircle, Bell, Calendar } from "lucide-react";

const AlertsSection = ({ alerts }) => {
  if (!alerts || alerts.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 space-y-2">
      {alerts.map((alert, index) => (
        <div
          key={index}
          className={`card flex items-center gap-3 ${
            alert.type === "warning"
              ? "bg-yellow-50 border-yellow-200"
              : alert.type === "success"
              ? "bg-green-50 border-green-200"
              : "bg-blue-50 border-blue-200"
          }`}
        >
          <div
            className={
              alert.type === "warning"
                ? "text-yellow-600"
                : alert.type === "success"
                ? "text-green-600"
                : "text-blue-600"
            }
          >
            {alert.icon}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">{alert.message}</p>
          </div>
          {alert.action && (
            <Link
              to="/upgrade-plans"
              className="text-sm font-semibold text-primary-600 hover:underline"
            >
              {alert.action}
            </Link>
          )}
        </div>
      ))}
    </div>
  );
};

export default AlertsSection;
