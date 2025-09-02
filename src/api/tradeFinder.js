// src/api/tradeFinder.js

// Base URL: set VITE_API_URL in your frontend env, otherwise same-origin
const API_BASE = import.meta?.env?.VITE_API_URL?.replace(/\/$/, "") || "";

// Map UI platform -> backend services ("ps" | "xbox" | "pc")
function mapPlatform(p) {
  const s = String(p || "").toLowerCase();
  if (["console", "playstation", "ps"].includes(s)) return "ps";
  if (["xbox", "xb"].includes(s)) return "xbox";
  if (["pc", "origin"].includes(s)) return "pc";
  return "ps";
}

// Serialize params safely
function qs(params = {}) {
  const u = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    u.set(k, String(v));
  });
  return u.toString();
}

// Small fetch helper with timeout + cookies
async function xfetch(path, { method = "GET", body, timeoutMs = 15000 } = {}) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: "include", // send session cookie
    headers: body
      ? { "content-type": "application/json" }
      : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal: controller.signal,
  }).finally(() => clearTimeout(t));

  if (!res.ok) {
    // Try to surface backend error detail
    let detail = `${res.status} ${res.statusText}`;
    try {
      const j = await res.json();
      detail = (j?.detail || j?.error || detail);
    } catch (_) {}
    throw new Error(`Trade Finder API error: ${detail}`);
  }
  // Some builds return an array directly, others wrap in {items:[]}
  const data = await res.json();
  return data;
}

/**
 * Fetch trade ideas from the backend.
 *
 * @param {Object} filters
 * @param {"console"|"ps"|"xbox"|"pc"} filters.platform
 * @param {number} filters.timeframe   // hours (6|12|24)
 * @param {number} filters.budget_min
 * @param {number} filters.budget_max
 * @param {number} filters.min_profit
 * @param {number} filters.min_margin_pct
 * @param {number} filters.rating_min
 * @param {number} filters.rating_max
 * @param {number} filters.topn
 * @param {boolean} filters.exclude_extinct
 * @param {boolean} filters.exclude_low_liquidity
 * @param {boolean} filters.exclude_anomalies
 * @returns {Promise<Array>} deals
 */
export async function fetchTradeFinder(filters = {}) {
  const {
    platform = "console",
    timeframe = 24,
    budget_min,
    budget_max,
    min_profit,
    min_margin_pct,
    rating_min,
    rating_max,
    topn = 20,
    exclude_extinct = true,
    exclude_low_liquidity = true,
    exclude_anomalies = true,
  } = filters;

  const query = {
    platform: mapPlatform(platform),
    timeframe,
    topn,
    exclude_extinct: exclude_extinct ? "1" : "0",
    exclude_low_liquidity: exclude_low_liquidity ? "1" : "0",
    exclude_anomalies: exclude_anomalies ? "1" : "0",
  };

  if (Number.isFinite(budget_min)) query.budget_min = budget_min;
  if (Number.isFinite(budget_max)) query.budget_max = budget_max;
  if (Number.isFinite(min_profit)) query.min_profit = min_profit;
  if (Number.isFinite(min_margin_pct)) query.min_margin_pct = min_margin_pct;
  if (Number.isFinite(rating_min)) query.rating_min = rating_min;
  if (Number.isFinite(rating_max)) query.rating_max = rating_max;

  const q = qs(query);
  const data = await xfetch(`/api/trade-finder?${q}`);

  // Normalize shape: support either array or {items:[...]}
  const deals = Array.isArray(data) ? data : (data?.items ?? []);
  return deals;
}

/**
 * Get a human-friendly explanation for a specific deal.
 * Falls back to rules text if OPENAI isn't enabled server-side.
 *
 * @param {Object} deal – the exact deal object returned by fetchTradeFinder
 * @returns {Promise<{text: string}>}
 */
export async function fetchDealInsight(deal) {
  const data = await xfetch(`/api/trade-insight`, {
    method: "POST",
    body: { deal },
  });
  // server returns { insight: "..." } or { text: "..." }
  const text = data?.insight || data?.text || "";
  return { text };
}

/**
 * Convenience: default filter preset used on first load.
 * You can tweak these to match your "healthy list" defaults.
 */
export function defaultTradeFinderFilters() {
  return {
    platform: "console",
    timeframe: 24,
    budget_min: 0,
    budget_max: 150000,
    min_profit: 1500,
    min_margin_pct: 8,
    rating_min: 75,
    rating_max: 93,
    topn: 20,
    exclude_extinct: true,
    exclude_low_liquidity: true,
    exclude_anomalies: true,
  };
}
