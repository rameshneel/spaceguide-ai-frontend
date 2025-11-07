import React from "react";
import ErrorBoundary from "./ErrorBoundary";
import { useLocation } from "react-router-dom";

/**
 * Route-level Error Boundary Wrapper
 * Wraps individual routes with ErrorBoundary for better error isolation
 * This prevents one route error from crashing the entire app
 *
 * Benefits:
 * - Better error isolation per route
 * - Route-specific error handling
 * - User can navigate away from broken route
 */
const RouteErrorBoundary = ({ children }) => {
  const location = useLocation();

  return <ErrorBoundary key={location.pathname}>{children}</ErrorBoundary>;
};

export default RouteErrorBoundary;
