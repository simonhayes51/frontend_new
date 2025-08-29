// src/api/axios.js
import axios from "axios";

const instance = axios.create({
  // IMPORTANT: no trailing /api here
  baseURL: import.meta.env.VITE_API_URL || "https://backend-production-1f1a.up.railway.app",
  withCredentials: true, // send/receive session cookies
  timeout: 10000,
});

// Request interceptor
instance.interceptors.request.use(
  (config) => {
    config.headers["Content-Type"] = config.headers["Content-Type"] || "application/json";

    // Ensure we never end up with double slashes (//api/...)
    if (config.url) {
      config.url = config.url.replace(/([^:]\/)\/+/g, "$1");
    }

    if (import.meta.env.DEV) {
      console.log(`→ ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    }
    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor
instance.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log("←", response.status, response.config.url);
    }
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.detail || error.message;

    switch (status) {
      case 401:
        console.log("Authentication required, redirecting to login...");
        if (typeof window !== "undefined") window.location.href = "/login";
        break;
      case 403:
        console.error("Access forbidden:", message);
        break;
      case 404:
        console.error("Resource not found:", error.config?.url);
        break;
      case 500:
        console.error("Server error:", message);
        break;
      default:
        console.error("Request failed:", message);
    }

    const enhancedError = { ...error, userMessage: getUserFriendlyMessage(status, message) };
    return Promise.reject(enhancedError);
  }
);

function getUserFriendlyMessage(status, originalMessage) {
  switch (status) {
    case 401: return "Please log in to continue";
    case 403: return "You do not have permission to perform this action";
    case 404: return "The requested resource was not found";
    case 500: return "Server error. Please try again later";
    case undefined: return "Network error. Please check your connection";
    default: return originalMessage || "An unexpected error occurred";
  }
}

export default instance;
