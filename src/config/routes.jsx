import { Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import ProtectedRoute from "../components/ProtectedRoute";
import DashboardLayout from "../components/layout/DashboardLayout";
import RouteLoader from "../components/RouteLoader";
import RouteErrorBoundary from "../components/RouteErrorBoundary";
import { ROUTES } from "../constants/routes";

// Lazy load pages for code splitting (Industry Best Practice)
// This reduces initial bundle size and improves performance
// Each route will be loaded as a separate chunk when needed
const Home = lazy(() => import("../pages/Home"));
const Login = lazy(() => import("../pages/Login"));
const Register = lazy(() => import("../pages/Register"));
const Dashboard = lazy(() => import("../pages/Dashboard"));
const AdminDashboard = lazy(() => import("../pages/AdminDashboard"));
const PublicPricing = lazy(() => import("../pages/PublicPricing"));
const UpgradePlans = lazy(() => import("../pages/UpgradePlans"));
const AIWriter = lazy(() => import("../pages/AIWriter"));
const ImageGenerator = lazy(() => import("../pages/ImageGenerator"));
const Chatbot = lazy(() => import("../pages/Chatbot"));
const AISearch = lazy(() => import("../pages/AISearch"));
const History = lazy(() => import("../pages/History"));
const Profile = lazy(() => import("../pages/Profile"));

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
