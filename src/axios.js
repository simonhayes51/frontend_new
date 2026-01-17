import axios from "axios";
import toast from "react-hot-toast";
import { API_BASE } from "./lib/apiBase";

if (import.meta.env.DEV) {
  console.log("🔧 Axios env:", {
    VITE_API_URL: import.meta.env?.VITE_API_URL,
    base: API_BASE,
    mode: import.meta.env.MODE,
  });
}

const DEFAULT_BASE = "https://api.futhub.co.uk";
const SAFE_BASE = (() => {
  const raw = API_BASE || DEFAULT_BASE;
  if (/^http:\/\/api\.futhub\.co\.uk/i.test(raw)) {
    return raw.replace(/^http:\/\//i, "https://");
  }
  return raw;
})();

const api = axios.create({
  baseURL: SAFE_BASE,
  withCredentials: true,
  timeout: 10000,
});

if (typeof window !== "undefined") {
  window.__API_BASEURL__ = api.defaults.baseURL;
}

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

api.interceptors.request.use(
  (config) => {
    config.headers["Accept"] = config.headers["Accept"] || "application/json";
    if (!config.headers["Content-Type"] && !(config.data instanceof FormData)) {
      config.headers["Content-Type"] = "application/json";
    }

    if (config.url) config.url = config.url.replace(/([^:]\/)\/+/g, "$1");

    try {
      const full = (config.baseURL ? String(config.baseURL) : "") + (config.url ? String(config.url) : "");
      if (String(config.url || "").startsWith("http://") || String(config.baseURL || "").startsWith("http://") || full.includes("http://api.futhub.co.uk")) {
        console.log("🚨 AXIOS_HTTP_ATTEMPT", { baseURL: config.baseURL, url: config.url });
        console.trace("AXIOS_HTTP_STACK");
      }
    } catch {}

    if (typeof config.baseURL === "string") {
      config.baseURL = config.baseURL.replace(/^http:\/\/api\.futhub\.co\.uk/i, "https://api.futhub.co.uk");
    }
    if (typeof config.url === "string") {
      config.url = config.url.replace(/^http:\/\/api\.futhub\.co\.uk/i, "https://api.futhub.co.uk");
    }

    if (config.__retryCount == null) config.__retryCount = 0;
    if (config.__maxRetries == null) config.__maxRetries = 2;

    if (import.meta.env.DEV) {
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config || {};
    
    if (error.response?.status === 429) {
      const retryAfter = parseRetryAfter(error.response.headers["retry-after"]);
      if (retryAfter !== null && config.__retryCount < (config.__maxRetries || 2)) {
        config.__retryCount += 1;
        await sleep(retryAfter);
        return api(config);
      }
    }

    const shouldRetry =
      !config.__noRetry &&
      config.__retryCount < (config.__maxRetries || 2) &&
      IDEMPOTENT.has(config.method?.toLowerCase()) &&
      (!error.response || (error.response.status >= 500 && error.response.status < 600));

    if (shouldRetry) {
      config.__retryCount += 1;
      const delay = backoff(config.__retryCount - 1);
      await sleep(delay);
      return api(config);
    }

    if (error.response?.status === 402 && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("premium:blocked", { detail: error }));
    }

    const status = error.response?.status;
    const serverMsg = error.response?.data?.detail || error.response?.data?.message;
    error.userMessage = getUserFriendlyMessage(status, serverMsg);

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
