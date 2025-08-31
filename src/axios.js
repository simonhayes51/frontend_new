// src/utils/axios.js
import axios from "axios";

/**
 * One axios instance for the whole app.
 * - baseURL has NO trailing '/api' (we call '/api/...').
 * - withCredentials so your session cookie flows.
 * - tiny guard against accidental double slashes.
 */
const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://backend-production-1f1a.up.railway.app",
  withCredentials: true,
  timeout: 15000,
});

// request log + fix accidental //api/...
instance.interceptors.request.use((config) => {
  if (config.url?.startsWith("//")) config.url = config.url.replace(/^\/+/, "/");
  if (config.baseURL?.endsWith("/") && config.url?.startsWith("/")) {
    config.baseURL = config.baseURL.replace(/\/+$/, "");
  }
  return config;
});

// normalize errors
instance.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status;
    const detail = error.response?.data?.detail || error.message;
    const friendly =
      status === 401 ? "Please log in to continue" :
      status === 403 ? "You do not have permission to perform this action" :
      status === 404 ? "The requested resource was not found" :
      status === 500 ? "Server error. Please try again later" :
      detail;
    return Promise.reject(Object.assign(error, { userMessage: friendly }));
  }
);

export default instance;