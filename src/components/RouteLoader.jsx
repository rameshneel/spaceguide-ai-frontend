import { Loader } from "lucide-react";

/**
 * Route Loader Component
 * Displays a loading state while routes are being lazy loaded
 * Industry standard: Shows visual feedback during code splitting
 *
 * This component appears when:
 * - A route is being lazy loaded (code splitting)
 * - JavaScript chunk is being downloaded
 * - Component is being initialized
 */
const RouteLoader = ({ inline = false }) => {
  if (inline) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader className="w-6 h-6 animate-spin text-primary-600 mr-2" />
        <p className="text-gray-600 text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="relative">
          <Loader className="w-10 h-10 animate-spin text-primary-600 mx-auto mb-4" />
          <div className="absolute inset-0 border-4 border-primary-100 rounded-full"></div>
        </div>
        <p className="text-gray-600 text-sm font-medium">Loading page...</p>
        <p className="text-gray-400 text-xs mt-1">
          Please wait while we load the content
        </p>
      </div>
    </div>
  );
};

export default RouteLoader;
