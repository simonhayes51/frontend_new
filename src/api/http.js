// src/api/http.js
const API_BASE = (import.meta?.env?.VITE_API_URL || "").replace(/\/$/, "");

export async function apiFetch(path, { method = "GET", body, headers, ...rest } = {}) {
  const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    method,
    credentials: "include",
    headers: body
      ? { "content-type": "application/json", ...(headers || {}) }
      : headers,
    body: body ? JSON.stringify(body) : undefined,
    ...rest,
  });
  // surface backend JSON details when possible
  if (!res.ok) {
    try {
      const j = await res.json();
      throw new Error(j?.detail || j?.error || `${res.status} ${res.statusText}`);
    } catch {
      throw new Error(`${res.status} ${res.statusText}`);
    }
  }
  // some endpoints stream files; guard for that if needed
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return res; // caller can .blob()/.text() etc.
}
