// src/api/http.js
export function apiBase() {
  return import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "";
}

export async function apiFetch(path, opts = {}) {
  const base = apiBase();
  const url = path.startsWith("http") ? path : `${base}${path}`;

  const res = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    ...opts,
  });

  const ct = (res.headers.get("content-type") || "").toLowerCase();
  const isJson = ct.includes("application/json");

  if (!res.ok) {
    if (isJson) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.detail || err?.message || `HTTP ${res.status}`);
    }
    const txt = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} (non-JSON): ${txt.slice(0, 120)}`);
  }

  if (!isJson) {
    const text = await res.text();
    throw new Error(
      `Expected JSON but got "${ct}". First bytes: ${text.slice(0, 120)}`
    );
  }

  return res.json();
}

// PROD safety: flag accidental relative fetches (which would hit the SPA)
if (import.meta.env.PROD) {
  const orig = window.fetch.bind(window);
  window.fetch = (input, init) => {
    const url = typeof input === "string" ? input : input?.url;
    if (typeof url === "string") {
      const isAbsolute = /^https?:\/\//i.test(url);
      const isApi = url.startsWith("/api/");
      const isAsset = /\.(png|jpg|jpeg|gif|svg|webp|css|js|map|ico|json)(\?|$)/i.test(url);
      if (!isAbsolute && !isApi && !isAsset) {
        console.warn("[fetch] Suspicious relative URL:", url);
      }
    }
    return orig(input, init);
  };
}
