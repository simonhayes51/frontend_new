// src/api/tradeFinder.js
import { apiFetch } from "./http";

// ---- helpers ---------------------------------------------------------------
const toNum = (v) => (v === "" || v == null ? undefined : Number(v));
const cleanCSV = (s) =>
  String(s || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)
    .join(","); // keep as CSV for server

// ---- API -------------------------------------------------------------------
/**
 * Fetch Trade Finder candidates.
 * @param {Object} filters
 * @returns {Promise<Array>} deals array
 */
export async function fetchTradeFinder(filters = {}) {
  // Server accepts these exact query keys
  const query = {
    platform: (filters.platform || "console").toLowerCase(), // console|pc
    timeframe: toNum(filters.timeframe) ?? 24,               // 6..24
    topn: toNum(filters.topn) ?? 20,                         // 1..50
    budget_min: toNum(filters.budget_min),
    budget_max: toNum(filters.budget_max),
    min_profit: toNum(filters.min_profit),
    min_margin_pct: toNum(filters.min_margin_pct),
    rating_min: toNum(filters.rating_min),
    rating_max: toNum(filters.rating_max),

    // optional, passthrough to server (if implemented there)
    leagues: cleanCSV(filters.leagues),
    nations: cleanCSV(filters.nations),
    positions: cleanCSV(filters.positions),

    // defaults for server toggles
    exclude_extinct: filters.exclude_extinct ?? 1,
    exclude_low_liquidity: filters.exclude_low_liquidity ?? 1,
    exclude_anomalies: filters.exclude_anomalies ?? 1,
    debug: filters.debug ? 1 : 0,
  };

  const res = await apiFetch("/api/trade-finder", { query });
  // backend may return { items: [...] } or an array directly
  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res.items)) return res.items;
  return [];
}

/**
 * Ask the server to explain a specific deal.
 * @param {Object} deal - the deal object the list returned
 * @returns {Promise<{insight: string}>}
 */
export async function fetchDealInsight(deal) {
  try {
    return await apiFetch("/api/trade-insight", {
      method: "POST",
      body: { deal },
    });
  } catch (e) {
    return { insight: "Candidate fits your filters." };
  }
}

export default {
  fetchTradeFinder,
  fetchDealInsight,
};
