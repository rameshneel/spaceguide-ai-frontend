import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";

/**
 * Custom hook for authentication logic
 * @returns {object}
 */
export const useAuth = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuthStore();

  /**
   * Handle logout with navigation
   */
  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  /**
   * Check if user is admin
   */
  const isAdmin = user?.role === "admin";

  /**
   * Check if user is customer
   */
  const isCustomer = user?.role === "customer";

  return {
    user,
    isAuthenticated: isAuthenticated(),
    handleLogout,
    isAdmin,
    isCustomer,
  };
};

export default useAuth;
