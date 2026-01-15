// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),

  server: {
    host: true,
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : 5173,
  },

  preview: {
    host: true,
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : 4173,
  },

  build: {
    outDir: "dist",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom"],
          "router-vendor": ["react-router-dom"],
          "chart-vendor": ["recharts"],

          // IMPORTANT:
          // Removed "http-vendor": ["axios"]
          // because it was creating a separate axios chunk and letting rogue imports bypass your safe base.
        },
      },
    },
  },
});
