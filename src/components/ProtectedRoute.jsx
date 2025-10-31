import { Navigate } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";

/**
 * ProtectedRoute Component
 * Wraps routes that require authentication
 * Automatically redirects to login if user is not authenticated
 *
 * Best Practices:
 * - Subscribes to auth state changes (reactive)
 * - Uses Zustand's isAuthenticated() method
 * - Immediately redirects on auth failure
 */
const ProtectedRoute = ({ children }) => {
  // Subscribe to auth state - component will re-render when auth state changes
  const { user, token, isAuthenticated } = useAuthStore();

  // Check authentication status reactively
  const authenticated = isAuthenticated();

  // If not authenticated, immediately redirect to login
  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  // Render protected content if authenticated
  return children;
};

export default ProtectedRoute;
