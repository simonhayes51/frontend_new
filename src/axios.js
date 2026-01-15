import axios from "axios";
import { API_BASE } from "./lib/apiBase";

/**
 * Axios instance with:
 * - Base URL from API_BASE
 * - withCredentials cookies (Starlette session)
 * - 10s timeout
 * - Idempotent GET retries (max 2; exponential backoff + jitter)
 * - 429 Retry-After honouring
 * - Premium gate (HTTP 402) → dispatches `premium:blocked` event
 * - Normalised error: err.userMessage
 */

if (import.meta.env.DEV) {
  console.log("🔧 Axios env:", {
    VITE_API_URL: import.meta.env?.VITE_API_URL,
    base: API_BASE,
    mode: import.meta.env.MODE,
  });
}

const SAFE_BASE = String(API_BASE || "https://api.futhub.co.uk").replace(
  /^http:\/\//i,
  "https://"
);

const api = axios.create({
  baseURL: SAFE_BASE,
  withCredentials: true,
  timeout: 10000,
});

if (typeof window !== "undefined") {
  window.__API_BASEURL__ = api.defaults.baseURL;
}

// -------- helpers ------------------------------------------------------------

const IDEMPOTENT = new Set(["get", "head", "options"]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const backoff = (attempt) => {
  const base = 300 * Math.pow(2, attempt);
  return base + Math.floor(Math.random() * 150);
};

function parseRetryAfter(headerValue) {
  if (!headerValue) return null;

  const asNum = Number(headerValue);
  if (!Number.isNaN(asNum)) return Math.max(0, asNum * 1000);

  const when = Date.parse(headerValue);
  if (!Number.isNaN(when)) {
    const diff = when - Date.now();
    return diff > 0 ? diff : 0;
  }
  return null;
}

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

// -------- interceptors -------------------------------------------------------

// Request
api.interceptors.request.use(
  (config) => {
    // Ensure headers object exists
    config.headers = config.headers || {};
    config.headers.Accept = config.headers.Accept || "application/json";

    const isForm = typeof FormData !== "undefined" && config.data instanceof FormData;
    if (!config.headers["Content-Type"] && !isForm) {
      config.headers["Content-Type"] = "application/json";
    }

    // ensure no double slashes in path (keeps protocol intact)
    if (typeof config.url === "string") {
      config.url = config.url.replace(/([^:]\/)\/+/g, "$1");
    }

    // Hard rewrite (safety net)
    if (typeof config.baseURL === "string") {
      config.baseURL = config.baseURL.replace(/^http:\/\//i, "https://");
    }
    if (typeof config.url === "string") {
      config.url = config.url.replace(/^http:\/\//i, "https://");
    }

    // retry metadata
    if (config.__retryCount == null) config.__retryCount = 0;
    if (config.__maxRetries == null) config.__maxRetries = 2;

    return config;
  },
  (error) => Promise.reject(error)
);

// Response
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config || {};

    // 1) Handle 429 Retry-After
    if (error.response?.status === 429) {
      const retryAfter = parseRetryAfter(error.response.headers?.["retry-after"]);
      if (retryAfter !== null && config.__retryCount < (config.__maxRetries || 2)) {
        config.__retryCount += 1;
        await sleep(retryAfter);
        return api(config);
      }
    }

    // 2) Handle Idempotent Network/5xx Retries
    const shouldRetry =
      !config.__noRetry &&
      config.__retryCount < (config.__maxRetries || 2) &&
      IDEMPOTENT.has(String(config.method || "").toLowerCase()) &&
      (!error.response || (error.response.status >= 500 && error.response.status < 600));

    if (shouldRetry) {
      config.__retryCount += 1;
      await sleep(backoff(config.__retryCount - 1));
      return api(config);
    }

    // 3) Handle 402 Payment Required -> Global Event
    if (typeof window !== "undefined" && error.response?.status === 402) {
      window.dispatchEvent(new CustomEvent("premium:blocked", { detail: error }));
    }

    // 4) Normalize Error Message
    const serverMsg = error.response?.data?.detail || error.response?.data?.message;
    error.userMessage = getUserFriendlyMessage(error.response?.status, serverMsg);

    return Promise.reject(error);
  }
);

export default api;
