import axios from "axios";
import toast from "react-hot-toast";
import { API_BASE } from "./lib/apiBase";

/**
 * Axios instance with:
 * - Base URL from VITE_API_URL (via apiBase.js)
 * - withCredentials cookies (Starlette session)
 * - 10s timeout
 * - Idempotent GET retries (max 2; exponential backoff + jitter)
 * - 429 Retry-After honouring
 * - Premium gate (HTTP 402) → dispatches `premium:blocked` event
 * - Normalised error: err.userMessage
 *
 * To disable retries per request: api.get("/x", { __noRetry: true })
 * To change max retries per request: api.get("/x", { __maxRetries: 1 })
 */

if (import.meta.env.DEV) {
  console.log("🔧 Axios env:", {
    VITE_API_URL: import.meta.env?.VITE_API_URL,
    base: API_BASE,
    mode: import.meta.env.MODE,
  });
}

const SAFE_BASE = (API_BASE || "https://api.futhub.co.uk").replace(/^http:\/\//, "https://");

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
  // attempt 0 → 300ms, 1 → 600ms, 2 → 1200ms (+ jitter 0–150ms)
  const base = 300 * Math.pow(2, attempt);
  return base + Math.floor(Math.random() * 150);
};

function parseRetryAfter(headerValue) {
  if (!headerValue) return null;
  // If number → seconds
  const asNum = Number(headerValue);
  if (!Number.isNaN(asNum)) return Math.max(0, asNum * 1000);

  // Otherwise, HTTP-date
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
    // default headers
    config.headers["Accept"] = config.headers["Accept"] || "application/json";
    if (!config.headers["Content-Type"] && !(config.data instanceof FormData)) {
      config.headers["Content-Type"] = "application/json";
    }

    // ensure no double slashes in path (keeps protocol intact)
    if (config.url) config.url = config.url.replace(/([^:]\/)\/+/g, "$1");

    // DEBUG (temporary): show any http URL attempts
    try {
      const full = (config.baseURL ? String(config.baseURL) : "") + (config.url ? String(config.url) : "");
      if (String(config.url || "").startsWith("http://") || String(config.baseURL || "").startsWith("http://") || full.includes("http://api.futhub.co.uk")) {
        console.log("🚨 AXIOS_HTTP_ATTEMPT", { baseURL: config.baseURL, url: config.url });
        console.trace("AXIOS_HTTP_STACK");
      }
    } catch {}

    // Hard rewrite (safety net)
    if (typeof config.baseURL === "string") config.baseURL = config.baseURL.replace(/^http:\/\//, "https://");
    if (typeof config.url === "string") config.url = config.url.replace(/^http:\/\//, "https://");

    // retry metadata
    if (config.__retryCount == null) config.__retryCount = 0;
    if (config.__maxRetries == null) config.__maxRetries = 2; // GET/HEAD/OPTIONS only

    if (import.meta.env.DEV) {
      // console.log(`[Axios] ${config.method.toUpperCase()} ${config.url}`, config);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config || {};
    
    // 1. Handle 429 Retry-After
    if (error.response?.status === 429) {
      const retryAfter = parseRetryAfter(error.response.headers["retry-after"]);
      if (retryAfter !== null && config.__retryCount < (config.__maxRetries || 2)) {
        config.__retryCount += 1;
        await sleep(retryAfter);
        return api(config);
      }
    }

    // 2. Handle Idempotent Network/5xx Retries
    const shouldRetry =
      !config.__noRetry &&
      config.__retryCount < (config.__maxRetries || 2) &&
      IDEMPOTENT.has(config.method?.toLowerCase()) &&
      (!error.response || (error.response.status >= 500 && error.response.status < 600));

    if (shouldRetry) {
      config.__retryCount += 1;
      const delay = backoff(config.__retryCount - 1);
      // console.log(`[Axios] Retrying ${config.url} (attempt ${config.__retryCount}) in ${delay}ms`);
      await sleep(delay);
      return api(config);
    }

    // 3. Handle 402 Payment Required -> Global Event
    if (error.response?.status === 402 && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("premium:blocked", { detail: error }));
    }

    // 4. Normalize Error Message
    const status = error.response?.status;
    const serverMsg = error.response?.data?.detail || error.response?.data?.message;
    error.userMessage = getUserFriendlyMessage(status, serverMsg);

    // 5. Global toast for backend errors (validation, permission, etc.)
    if (typeof window !== "undefined") {
      const shouldToast =
        !config.__suppressToast &&
        status &&
        status >= 400 &&
        status < 600;

      if (shouldToast) {
        const msg = error.response?.data?.detail || error.userMessage || "An unexpected error occurred";
        toast.error(msg);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
