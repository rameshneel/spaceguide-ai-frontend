import { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { Menu } from "lucide-react";

/**
 * Dashboard Layout Component
 * Provides sidebar navigation for authenticated users
 *
 * Features:
 * - Shows loading state during route transitions (handled by Suspense)
 * - Smooth navigation with visual feedback
 * - Industry standard lazy loading support
 *
 * Note: Route loading is handled by React Suspense boundaries in routes.jsx
 * Each route will show RouteLoader component while lazy loading
 */
const DashboardLayout = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="flex">
        {/* Sidebar */}
        <Sidebar
          isMobile={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
        />

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="lg:hidden fixed bottom-6 right-6 z-40 w-14 h-14 bg-primary-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary-700 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Main Content Area */}
        <main
          className={`flex-1 transition-all duration-300 lg:ml-64 min-h-[calc(100vh-4rem)] mt-16`}
        >
          <div className="p-6">
            {/* Routes are lazy loaded - Suspense will show RouteLoader automatically */}
            <Outlet context={{ isDashboardLayout: true }} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
