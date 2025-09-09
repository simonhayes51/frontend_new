// src/axios.js
import axios from "axios";

const FALLBACK_API = "https://api.futhub.co.uk";

const base =
  (import.meta.env?.VITE_API_URL && import.meta.env.VITE_API_URL.replace(/\/$/, "")) ||
  FALLBACK_API;

if (import.meta.env.DEV) {
  console.log("🔍 Environment check:", {
    VITE_API_URL: import.meta.env?.VITE_API_URL,
    base,
    mode: import.meta.env.MODE,
  });
}

const instance = axios.create({
  baseURL: base,          // keep no trailing slash; requests pass "/api/..."
  withCredentials: true,
  timeout: 10000,
});

// ---- helpers --------------------------------------------------

const IDEMPOTENT = new Set(["get", "head", "options"]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const backoff = (attempt) => {
  // 0 -> 300ms, 1 -> 600ms, 2 -> 1200ms (+ jitter 0–150ms)
  const base = 300 * Math.pow(2, attempt);
  return base + Math.floor(Math.random() * 150);
};

function getUserFriendlyMessage(status, originalMessage) {
  switch (status) {
    case 401: return "Please log in to continue";
    case 402: return "This feature requires Premium";
    case 403: return "You do not have permission to perform this action";
    case 404: return "The requested resource was not found";
    case 429: return "You’re doing that too fast. Please try again in a moment";
    case 500: return "Server error. Please try again later";
    case undefined: return "Network error. Please check your connection";
    default: return originalMessage || "An unexpected error occurred";
  }
}

// ---- interceptors --------------------------------------------

// Request
instance.interceptors.request.use(
  (config) => {
    // default headers
    config.headers["Accept"] = config.headers["Accept"] || "application/json";
    config.headers["Content-Type"] = config.headers["Content-Type"] || "application/json";

    // ensure no double slashes in the path portion
    if (config.url) config.url = config.url.replace(/([^:]\/)\/+/g, "$1");

    // retry metadata
    if (config.__retryCount == null) config.__retryCount = 0;
    if (config.__maxRetries == null) config.__maxRetries = 2; // only used for idempotent methods

    if (import.meta.env.DEV) {
      console.log(`[axios] → ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response (success)
instance.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log("[axios] ←", response.status, response.config.url);
    }
    return response;
  },

  // Response (error) + retry + premium gate
  async (error) => {
    const status = error.response?.status;
    const detail = error.response?.data?.detail;
    const method = (error.config?.method || "get").toLowerCase();
    const cfg = error.config || {};

    // Dev log
    console.error("🚨 Axios error:", {
      status,
      message: typeof detail === "string" ? detail : detail?.message || error.message,
      url: cfg.url,
      baseURL: cfg.baseURL,
    });

    // --- 402 Premium gate ---
    if (status === 402 && detail?.feature) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("premium:blocked", { detail }));
      }
      const enhanced402 = { ...error, userMessage: getUserFriendlyMessage(402, detail?.message) };
      return Promise.reject(enhanced402);
    }

    // --- 401: bounce to login (keep your behaviour) ---
    if (status === 401) {
      if (typeof window !== "undefined") window.location.href = "/login";
      const enhanced401 = { ...error, userMessage: getUserFriendlyMessage(401) };
      return Promise.reject(enhanced401);
    }

    // --- 429: honour Retry-After if present (idempotent only) ---
    if (status === 429 && IDEMPOTENT.has(method) && !cfg.__noRetry) {
      const ra = error.response.headers?.["retry-after"];
      const waitMs = ra ? Number(ra) * 1000 : backoff(cfg.__retryCount || 0);
      if ((cfg.__retryCount || 0) < (cfg.__maxRetries || 0)) {
        cfg.__retryCount = (cfg.__retryCount || 0) + 1;
        await sleep(waitMs);
        return instance(cfg);
      }
    }

    // --- Network / timeouts / 5xx: retry idempotent methods only ---
    const isNetworkError = !error.response;
    const isTimeout = error.code === "ECONNABORTED";
    const is5xx = status >= 500 && status <= 599;

    if ((isNetworkError || isTimeout || is5xx) && IDEMPOTENT.has(method) && !cfg.__noRetry) {
      if ((cfg.__retryCount || 0) < (cfg.__maxRetries || 0)) {
        const attempt = cfg.__retryCount || 0;
        cfg.__retryCount = attempt + 1;
        await sleep(backoff(attempt));
        return instance(cfg);
      }
    }

    // Normalise and bubble up
    const message =
      (typeof detail === "string" && detail) ||
      detail?.message ||
      error.message;

    const enhancedError = { ...error, userMessage: getUserFriendlyMessage(status, message) };
    return Promise.reject(enhancedError);
  }
);

export default instance;
