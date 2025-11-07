import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, User, LogOut } from "lucide-react";
import useAuthStore from "../../store/useAuthStore";

/**
 * Header Component
 * Main navigation header with authentication-aware UI
 *
 * Best Practices:
 * - Subscribes to auth state via Zustand (reactive updates)
 * - Conditionally renders auth-dependent navigation items
 * - Handles logout with proper navigation
 */
const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Subscribe to auth state - component re-renders when auth changes
  // This ensures UI updates immediately when user logs out/in
  const { user, token, logout, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Reactive authentication check - evaluated on every render
  const authenticated = isAuthenticated();

  // Check if we're on a dashboard route
  const isDashboardRoute =
    location.pathname.startsWith("/dashboard") ||
    location.pathname.startsWith("/ai-writer") ||
    location.pathname.startsWith("/image-generator") ||
    location.pathname.startsWith("/chatbot") ||
    location.pathname.startsWith("/ai-search") ||
    location.pathname.startsWith("/history") ||
    location.pathname.startsWith("/profile");

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50 h-16">
      <nav
        className={`${
          isDashboardRoute ? "lg:ml-64" : "container"
        } mx-auto px-4 h-full transition-all duration-300`}
      >
        <div
          className={`flex ${
            isDashboardRoute ? "" : "justify-between"
          } items-center h-full`}
        >
          {/* Logo */}
          <Link
            to={isDashboardRoute ? "/dashboard" : "/"}
            className="flex items-center space-x-2 group"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-white font-bold text-xl">SG</span>
            </div>
            <span className="text-2xl font-bold gradient-text">
              SpaceGuideAI
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div
            className={`hidden md:flex items-center ${
              isDashboardRoute ? "ml-auto" : ""
            } space-x-8`}
          >
            <Link to="/" className="hover:text-primary-600 transition-colors">
              Home
            </Link>
            <Link
              to="/pricing"
              className="hover:text-primary-600 transition-colors"
            >
              Pricing
            </Link>

            {authenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="hover:text-primary-600 transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  to="/profile"
                  className="hover:text-primary-600 transition-colors"
                  aria-label="User profile"
                >
                  <User className="w-5 h-5" aria-hidden="true" />
                </Link>
                <button
                  onClick={handleLogout}
                  className="btn-secondary"
                  aria-label="Logout"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hover:text-primary-600 transition-colors"
                >
                  Log In
                </Link>
                <Link to="/register" className="btn-primary">
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-navigation"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" aria-hidden="true" />
            ) : (
              <Menu className="w-6 h-6" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div
            id="mobile-navigation"
            className="md:hidden mt-4 pb-4 space-y-2"
            role="navigation"
            aria-label="Mobile navigation"
          >
            <Link to="/" className="block py-2 hover:text-primary-600">
              Home
            </Link>
            <Link to="/pricing" className="block py-2 hover:text-primary-600">
              Pricing
            </Link>
            {authenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="block py-2 hover:text-primary-600"
                >
                  Dashboard
                </Link>
                <Link
                  to="/profile"
                  className="block py-2 hover:text-primary-600"
                >
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left py-2 hover:text-primary-600"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="block py-2 hover:text-primary-600">
                  Log In
                </Link>
                <Link to="/register" className="block btn-primary text-center">
                  Get Started
                </Link>
              </>
            )}
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
