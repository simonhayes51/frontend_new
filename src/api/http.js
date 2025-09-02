// unified fetch helper with base URL + cookies
const BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "";

export async function apiFetch(path, opts = {}) {
  const url = path.startsWith("http") ? path : `${BASE}${path}`;
  const res = await fetch(url, {
    credentials: "include",
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
  });
  const ct = res.headers.get("content-type") || "";
  if (!res.ok) {
    let body = ct.includes("application/json")
      ? await res.json().catch(() => ({}))
      : await res.text();
    throw new Error(
      typeof body === "string"
        ? body
        : body?.detail || `${res.status} ${res.statusText}`
    );
  }
  return ct.includes("application/json") ? res.json() : res.text();
}