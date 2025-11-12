import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

import logger from "./utils/logger";

// Global error handler for unhandled errors (including module import errors)
window.addEventListener("error", (event) => {
  logger.error("Global error caught:", event.error);
  // Prevent default browser error display
  // ErrorBoundary will handle React errors, this catches others
  if (event.error?.message?.includes("does not provide an export")) {
    logger.error(
      "Module import error detected. Please check import statements."
    );
    // Optionally show user-friendly error in development
    if (import.meta.env.DEV) {
      // Use logger instead of alert for better UX
      logger.error(`Import Error: ${event.error.message}`);
    }
  }
});

// Handle unhandled promise rejections
window.addEventListener("unhandledrejection", (event) => {
  logger.error("Unhandled promise rejection:", event.reason);
  // Prevent default browser error display
  event.preventDefault();
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
