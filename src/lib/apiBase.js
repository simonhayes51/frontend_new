const rawBase = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

const envTag = (import.meta.env.VITE_ENV || import.meta.env.MODE || "").toLowerCase();
const isProd = envTag === "production" || envTag === "prod";

let resolvedBase = rawBase;

try {
  if (rawBase) {
    const url = new URL(rawBase);
    const host = url.hostname;
    if (isProd && (host === "localhost" || host === "127.0.0.1")) {
      resolvedBase = "https://api.futhub.co.uk";
    }
  }
} catch {
}

if (!resolvedBase && isProd) {
  resolvedBase = "https://api.futhub.co.uk";
}

export const API_BASE = resolvedBase;
