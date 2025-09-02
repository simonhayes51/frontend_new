// Tiny HTTP helper that always talks to the API origin and sends cookies.
const API_BASE =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  window.__API_BASE__ ||
  "http://localhost:8000";

export function apiUrl(path = "/") {
  if (/^https?:\/\//i.test(path)) return path;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE.replace(/\/$/, "")}${p}`;
}

export async function apiFetch(path, opts = {}) {
  const url = apiUrl(path);
  const init = {
    method: "GET",
    headers: { "Accept": "application/json", ...(opts.headers || {}) },
    credentials: "include",
    ...opts,
  };

  // convenience: if caller passes { json: {...} } build body & content-type
  if (opts.json !== undefined) {
    init.method = init.method || "POST";
    init.headers = { ...init.headers, "Content-Type": "application/json" };
    init.body = JSON.stringify(opts.json);
  }

  const res = await fetch(url, init);
  const ctype = res.headers.get("content-type") || "";
  if (!res.ok) {
    const msg = ctype.includes("application/json")
      ? (await res.json()).detail || (await res.json()).error || res.statusText
      : await res.text();
    throw new Error(msg || `HTTP ${res.status}`);
  }
  if (ctype.includes("application/json")) return res.json();
  return res.text();
}

export async function apiFetchBlob(path, opts = {}) {
  const res = await fetch(apiUrl(path), {
    credentials: "include",
    ...opts,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.blob();
}