import { Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import ProtectedRoute from "../components/ProtectedRoute";
import DashboardLayout from "../components/layout/DashboardLayout";
import RouteLoader from "../components/RouteLoader";
import RouteErrorBoundary from "../components/RouteErrorBoundary";
import { ROUTES } from "../constants/routes";
import logger from "../utils/logger";

/**
 * Retry wrapper for lazy imports
 * Handles network errors and module loading failures with retry logic
 */
const lazyWithRetry = (componentImport, retries = 3, delay = 1000) => {
  return lazy(async () => {
    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    // For localhost, don't check navigator.onLine (it can be unreliable)
    // For production, check network status
    if (!isLocalhost && typeof navigator !== "undefined" && !navigator.onLine) {
      logger.warn(
        "Network appears offline. Retrying module import when connection is restored..."
      );
      // Wait a bit and retry
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    for (let i = 0; i < retries; i++) {
      try {
        const module = await componentImport();
        return module;
      } catch (error) {
        const isLastAttempt = i === retries - 1;

        logger.error(
          `Failed to load module (attempt ${i + 1}/${retries}):`,
          error
        );

        if (isLastAttempt) {
          // On final attempt, throw the error
          throw error;
        }

        // Wait before retrying (exponential backoff)
        const waitTime = delay * Math.pow(2, i);
        logger.info(`Retrying module import in ${waitTime}ms...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  });
};

// Lazy load pages for code splitting (Industry Best Practice)
// This reduces initial bundle size and improves performance
// Each route will be loaded as a separate chunk when needed
// Using lazyWithRetry to handle network errors gracefully
const Home = lazyWithRetry(() => import("../pages/Home"));
const Login = lazyWithRetry(() => import("../pages/Login"));
const Register = lazyWithRetry(() => import("../pages/Register"));
const Dashboard = lazyWithRetry(() => import("../pages/Dashboard"));
const AdminDashboard = lazyWithRetry(() => import("../pages/AdminDashboard"));
const PublicPricing = lazyWithRetry(() => import("../pages/PublicPricing"));
const UpgradePlans = lazyWithRetry(() => import("../pages/UpgradePlans"));
const AIWriter = lazyWithRetry(() => import("../pages/AIWriter"));
const ImageGenerator = lazyWithRetry(() => import("../pages/ImageGenerator"));
const Chatbot = lazyWithRetry(() => import("../pages/Chatbot"));
const AISearch = lazyWithRetry(() => import("../pages/AISearch"));
const History = lazyWithRetry(() => import("../pages/History"));
const Profile = lazyWithRetry(() => import("../pages/Profile"));

/**
 * Application Routes Configuration
 * Centralized route management for better maintainability
 */
export const AppRoutes = () => {
  return (
    <Suspense fallback={<RouteLoader />}>
      <Routes>
        {/* Public Routes */}
        <Route
          path={ROUTES.HOME}
          element={
            <RouteErrorBoundary>
              <Suspense fallback={<RouteLoader />}>
                <Home />
              </Suspense>
            </RouteErrorBoundary>
          }
        />
        <Route
          path={ROUTES.LOGIN}
          element={
            <RouteErrorBoundary>
              <Suspense fallback={<RouteLoader />}>
                <Login />
              </Suspense>
            </RouteErrorBoundary>
          }
        />
        <Route
          path={ROUTES.REGISTER}
          element={
            <RouteErrorBoundary>
              <Suspense fallback={<RouteLoader />}>
                <Register />
              </Suspense>
            </RouteErrorBoundary>
          }
        />
        <Route
          path={ROUTES.PRICING}
          element={
            <RouteErrorBoundary>
              <Suspense fallback={<RouteLoader />}>
                <PublicPricing />
              </Suspense>
            </RouteErrorBoundary>
          }
        />

        {/* Protected Routes with Dashboard Layout (Sidebar) */}
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route
            path={ROUTES.DASHBOARD}
            element={
              <RouteErrorBoundary>
                <Suspense fallback={<RouteLoader />}>
                  <Dashboard />
                </Suspense>
              </RouteErrorBoundary>
            }
          />
          <Route
            path={ROUTES.AI_WRITER}
            element={
              <RouteErrorBoundary>
                <Suspense fallback={<RouteLoader />}>
                  <AIWriter />
                </Suspense>
              </RouteErrorBoundary>
            }
          />
          <Route
            path={ROUTES.IMAGE_GENERATOR}
            element={
              <RouteErrorBoundary>
                <Suspense fallback={<RouteLoader />}>
                  <ImageGenerator />
                </Suspense>
              </RouteErrorBoundary>
            }
          />
          <Route
            path={ROUTES.CHATBOT}
            element={
              <RouteErrorBoundary>
                <Suspense fallback={<RouteLoader />}>
                  <Chatbot />
                </Suspense>
              </RouteErrorBoundary>
            }
          />
          <Route
            path={ROUTES.AI_SEARCH}
            element={
              <RouteErrorBoundary>
                <Suspense fallback={<RouteLoader />}>
                  <AISearch />
                </Suspense>
              </RouteErrorBoundary>
            }
          />
          <Route
            path={ROUTES.HISTORY}
            element={
              <RouteErrorBoundary>
                <Suspense fallback={<RouteLoader />}>
                  <History />
                </Suspense>
              </RouteErrorBoundary>
            }
          />
          <Route
            path={ROUTES.PROFILE}
            element={
              <RouteErrorBoundary>
                <Suspense fallback={<RouteLoader />}>
                  <Profile />
                </Suspense>
              </RouteErrorBoundary>
            }
          />
          <Route
            path={ROUTES.UPGRADE_PLANS}
            element={
              <RouteErrorBoundary>
                <Suspense fallback={<RouteLoader />}>
                  <UpgradePlans />
                </Suspense>
              </RouteErrorBoundary>
            }
          />
        </Route>

        {/* Admin Dashboard (Separate - No Sidebar) */}
        <Route
          path={ROUTES.ADMIN_DASHBOARD}
          element={
            <RouteErrorBoundary>
              <ProtectedRoute>
                <Suspense fallback={<RouteLoader />}>
                  <AdminDashboard />
                </Suspense>
              </ProtectedRoute>
            </RouteErrorBoundary>
          }
        />

        {/* 404 - Redirect to home */}
        <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
