import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import DashboardLayout from "../components/layout/DashboardLayout";
import { ROUTES } from "../constants/routes";

// Pages
import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Dashboard from "../pages/Dashboard";
import AdminDashboard from "../pages/AdminDashboard";
import Pricing from "../pages/Pricing";
import AIWriter from "../pages/AIWriter";
import ImageGenerator from "../pages/ImageGenerator";
import Chatbot from "../pages/Chatbot";
import AISearch from "../pages/AISearch";
import History from "../pages/History";
import Profile from "../pages/Profile";

/**
 * Application Routes Configuration
 * Centralized route management for better maintainability
 */
export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path={ROUTES.HOME} element={<Home />} />
      <Route path={ROUTES.LOGIN} element={<Login />} />
      <Route path={ROUTES.REGISTER} element={<Register />} />
      <Route path={ROUTES.PRICING} element={<Pricing />} />

      {/* Protected Routes with Dashboard Layout (Sidebar) */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
        <Route path={ROUTES.AI_WRITER} element={<AIWriter />} />
        <Route path={ROUTES.IMAGE_GENERATOR} element={<ImageGenerator />} />
        <Route path={ROUTES.CHATBOT} element={<Chatbot />} />
        <Route path={ROUTES.AI_SEARCH} element={<AISearch />} />
        <Route path={ROUTES.HISTORY} element={<History />} />
        <Route path={ROUTES.PROFILE} element={<Profile />} />
        {/* Pricing accessible from dashboard (with sidebar) */}
        <Route path={ROUTES.PRICING} element={<Pricing />} />
      </Route>

      {/* Admin Dashboard (Separate - No Sidebar) */}
      <Route
        path={ROUTES.ADMIN_DASHBOARD}
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* 404 - Redirect to home */}
      <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
    </Routes>
  );
};

export default AppRoutes;
