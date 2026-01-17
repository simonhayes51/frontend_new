import { API_BASE } from "../lib/apiBase";

// Join base + path and attach query params
function buildUrl(path, query) {
  const p = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(API_BASE ? API_BASE + p : p, API_BASE || window.location.origin);

  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null || v === "") continue;
      // Allow arrays by repeating keys; everything else toString()
      if (Array.isArray(v)) {
        v.forEach((vv) => url.searchParams.append(k, String(vv)));
      } else {
        url.searchParams.append(k, String(v));
      }
    }
  }
  return url.toString();
}

// Single fetch call with network-error normalization
async function doFetch(url, init) {
  try {
    return await fetch(url, init);
  } catch (err) {
    const msg = err?.message || String(err);
    throw new Error(`network error @ ${url}: ${msg}`);
  }
}

/**
 * apiFetch("/api/xyz", { method, body, query, headers, credentials, retry, retryDelayMs })
 * - Forces absolute URLs using VITE_API_URL
 * - Sends cookies by default (credentials: 'include')
 * - Parses JSON if content-type is application/json
 * - Distinguishes network errors from HTTP errors
 * - Retries once on network errors (configurable)
 */
export async function apiFetch(path, opts = {}) {
  const {
    method = "GET",
    body,
    query,
    headers = {},
    credentials = "include",
    retry = 1,            // retry once on network error
    retryDelayMs = 500,   // backoff for retry
  } = opts;

  const url = buildUrl(path, query);

  // Helpful in Dev/Prod debugging to verify the final absolute URL
  if (typeof window !== "undefined") {
    // eslint-disable-next-line no-console
    console.log("[apiFetch]", method, url);
  }

  const init = { method, headers: { Accept: "application/json", ...headers }, credentials };

  if (body !== undefined) {
    if (body instanceof FormData) {
      init.body = body; // browser sets the correct multipart boundary
    } else {
      init.headers["Content-Type"] = init.headers["Content-Type"] || "application/json";
      init.body = typeof body === "string" ? body : JSON.stringify(body);
    }
  }

  let res;
  try {
    res = await doFetch(url, init);
  } catch (e) {
    if (retry > 0) {
      if (typeof window !== "undefined") {
         console.warn(`[apiFetch] Network error, retrying in ${retryDelayMs}ms...`, e);
      }
      await new Promise(r => setTimeout(r, retryDelayMs));
      return apiFetch(path, { ...opts, retry: retry - 1 });
    }
    throw e;
  }

  // Handle HTTP errors
  if (!res.ok) {
    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      // ignore
    }
    const msg = json?.detail || json?.message || text.slice(0, 200);
    const err = new Error(msg);
    err.status = res.status;
    err.data = json;
    throw err;
  }

  // Success
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    return await res.json();
  }
  return await res.text();
}
