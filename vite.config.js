import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true, // Allow external connections
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false, // For development only
      },
    },
  },
  build: {
    // Optimize build output
    sourcemap: false, // Disable source maps in production for smaller bundle
    minify: "esbuild", // Use esbuild for faster minification
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "stripe-vendor": ["@stripe/react-stripe-js", "@stripe/stripe-js"],
          "ui-vendor": ["lucide-react", "framer-motion"],
          "chart-vendor": ["recharts"],
        },
      },
    },
    // Chunk size warnings threshold
    chunkSizeWarningLimit: 1000,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom"],
  },
});
