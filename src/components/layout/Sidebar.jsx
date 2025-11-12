import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Sparkles,
  Image,
  MessageSquare,
  Search,
  History,
  Settings,
  User,
  Menu,
  X,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import useAuthStore from "../../store/useAuthStore";

const Sidebar = ({ isMobile, onClose }) => {
  const location = useLocation();
  const { user } = useAuthStore();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    {
      name: "Overview",
      icon: <LayoutDashboard className="w-5 h-5" />,
      path: "/dashboard",
    },
    {
      name: "AI Text Writer",
      icon: <Sparkles className="w-5 h-5" />,
      path: "/ai-writer",
    },
    {
      name: "AI Image Generator",
      icon: <Image className="w-5 h-5" />,
      path: "/image-generator",
    },
    {
      name: "AI Chatbot",
      icon: <MessageSquare className="w-5 h-5" />,
      path: "/chatbot",
    },
    {
      name: "AI Search",
      icon: <Search className="w-5 h-5" />,
      path: "/ai-search",
    },
    {
      name: "History",
      icon: <History className="w-5 h-5" />,
      path: "/history",
    },
    {
      name: "Upgrade Plans",
      icon: <TrendingUp className="w-5 h-5" />,
      path: "/upgrade-plans",
    },
    {
      name: "Settings",
      icon: <Settings className="w-5 h-5" />,
      path: "/profile",
    },
  ];

  // Check if path is active - handle exact matches
  const checkActive = (path, currentPath) => {
    // Handle hash links - they're never active
    if (path === "#") return false;

    // Exact match
    if (currentPath === path) return true;

    // Dashboard exact match only
    if (path === "/dashboard") {
      return currentPath === "/dashboard";
    }

    return false;
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-white border-r border-gray-200 fixed left-0 top-16 h-[calc(100vh-4rem)] transition-all duration-300 z-40 ${
          isCollapsed ? "w-20" : "w-64"
        }`}
        aria-label="Main navigation"
        role="navigation"
      >
        {/* User Info */}
        <div
          className={`p-4 border-b border-gray-200 flex-shrink-0 ${
            isCollapsed ? "px-2" : ""
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-semibold text-sm">
                {user?.firstName?.[0]?.toUpperCase() || "U"}
              </span>
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {user?.subscription?.type ||
                    user?.subscription?.plan ||
                    "Free"}{" "}
                  Plan
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {menuItems.map((item, index) => {
            const isPathActive = checkActive(item.path, location.pathname);
            const isClickable = item.path !== "#";

            const linkContent = (
              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isPathActive
                    ? "bg-primary-50 text-primary-600 font-semibold"
                    : "text-gray-700 hover:bg-gray-50"
                } ${isCollapsed ? "justify-center px-2" : ""} ${
                  !isClickable
                    ? "cursor-not-allowed opacity-60"
                    : "cursor-pointer"
                }`}
                title={isCollapsed ? item.name : ""}
              >
                <span className="flex-shrink-0" aria-hidden="true">
                  {item.icon}
                </span>
                {!isCollapsed && <span className="text-sm">{item.name}</span>}
              </div>
            );

            if (!isClickable) {
              return (
                <div key={index} onClick={(e) => e.preventDefault()}>
                  {linkContent}
                </div>
              );
            }

            return (
              <NavLink
                key={index}
                to={item.path}
                onClick={() => isMobile && onClose?.()}
                end={item.path === "/dashboard"}
                className={({ isActive: active }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    active || isPathActive
                      ? "bg-primary-50 text-primary-600 font-semibold"
                      : "text-gray-700 hover:bg-gray-50"
                  } ${isCollapsed ? "justify-center px-2" : ""}`
                }
                title={isCollapsed ? item.name : ""}
              >
                <span className="flex-shrink-0" aria-hidden="true">
                  {item.icon}
                </span>
                {!isCollapsed && <span className="text-sm">{item.name}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Collapse Toggle (Desktop) */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!isCollapsed}
          >
            <Menu className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
            {!isCollapsed && <span className="text-sm">Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobile && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={onClose}
          />

          {/* Sidebar */}
          <aside
            className="fixed left-0 top-0 h-full w-64 bg-white shadow-xl z-50 overflow-y-auto"
            aria-label="Mobile navigation"
            role="navigation"
          >
            {/* Mobile Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {user?.firstName?.[0]?.toUpperCase() || "U"}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {user?.subscription?.type || "Free"} Plan
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg"
                aria-label="Close sidebar"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="p-4 space-y-1">
              {menuItems.map((item, index) => {
                const isPathActive = checkActive(item.path, location.pathname);
                const isClickable = item.path !== "#";

                const linkContent = (
                  <div
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isPathActive
                        ? "bg-primary-50 text-primary-600 font-semibold"
                        : "text-gray-700 hover:bg-gray-50"
                    } ${
                      !isClickable
                        ? "cursor-not-allowed opacity-60"
                        : "cursor-pointer"
                    }`}
                  >
                    <span className="flex-shrink-0" aria-hidden="true">
                      {item.icon}
                    </span>
                    <span className="text-sm">{item.name}</span>
                  </div>
                );

                if (!isClickable) {
                  return (
                    <div key={index} onClick={(e) => e.preventDefault()}>
                      {linkContent}
                    </div>
                  );
                }

                return (
                  <NavLink
                    key={index}
                    to={item.path}
                    onClick={onClose}
                    end={item.path === "/dashboard"}
                    className={({ isActive: active }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        active || isPathActive
                          ? "bg-primary-50 text-primary-600 font-semibold"
                          : "text-gray-700 hover:bg-gray-50"
                      }`
                    }
                  >
                    <span className="flex-shrink-0" aria-hidden="true">
                      {item.icon}
                    </span>
                    <span className="text-sm">{item.name}</span>
                  </NavLink>
                );
              })}
            </nav>
          </aside>
        </div>
      )}
    </>
  );
};

export default Sidebar;
