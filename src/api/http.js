// src/api/http.js
const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, ""); // e.g. https://api.futhub.co.uk

function buildUrl(path, query) {
  const p = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(API_BASE ? API_BASE + p : p, API_BASE || window.location.origin);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== "") url.searchParams.append(k, v);
    }
  }
  return url.toString();
}

/**
 * apiFetch("/api/xyz", { method, body, query, headers })
 * - Always uses VITE_API_URL
 * - Sends credentials for session endpoints
 * - Parses JSON when possible, throws helpful errors
 */
export async function apiFetch(path, opts = {}) {
  const {
    method = "GET",
    body,
    query,
    headers = {},
    credentials = "include",
  } = opts;

  const url = buildUrl(path, query);
  const init = { method, headers: { ...headers }, credentials };

  if (body !== undefined) {
    if (body instanceof FormData) {
      init.body = body;
    } else {
      init.headers["Content-Type"] = init.headers["Content-Type"] || "application/json";
      init.body = typeof body === "string" ? body : JSON.stringify(body);
    }
  }

  const res = await fetch(url, init);

  // Try to parse JSON for both success and error cases
  const ct = res.headers.get("content-type") || "";
  const isJson = ct.includes("application/json");
  const data = isJson ? await res.json().catch(() => null) : await res.text();

  if (!res.ok) {
    const msg =
      (data && (data.detail || data.error || data.message)) ||
      `${res.status} ${res.statusText}`;
    throw new Error(msg);
  }
  return isJson ? data : data;
}
