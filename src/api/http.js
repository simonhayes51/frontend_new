// tiny, consistent fetch wrapper (includes cookies + base URL)
const BASE = import.meta.env.VITE_API_URL || "";

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
  const isJSON = ct.includes("application/json");

  if (!res.ok) {
    const body = isJSON ? await res.json().catch(() => ({})) : await res.text();
    const msg =
      typeof body === "string"
        ? body
        : body?.detail || body?.message || `${res.status} ${res.statusText}`;
    throw new Error(msg);
  }

  return isJSON ? res.json() : res.text();
}
