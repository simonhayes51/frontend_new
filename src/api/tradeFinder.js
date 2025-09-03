// src/api/tradeFinder.js
import { apiFetch } from "./http";

const coerceNumber = (v) => {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

const clean = (obj) =>
  Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== "")
  );

/**
 * Fetch trade-finder candidates.
 * Expects backend /api/trade-finder to accept:
 *  platform: "console" | "pc"
 *  timeframe: 4 | 24 (hours)
 *  budget_max, min_profit, min_margin_pct, rating_min, rating_max
 *  leagues, nations, positions (comma-separated strings)
 */
export async function fetchTradeFinder(filters) {
  const params = clean({
    platform: (filters.platform || "console").toLowerCase(),
    timeframe: coerceNumber(filters.timeframe) ?? 24,
    budget_max: coerceNumber(filters.budget_max),
    min_profit: coerceNumber(filters.min_profit),
    min_margin_pct: coerceNumber(filters.min_margin_pct),
    rating_min: coerceNumber(filters.rating_min),
    rating_max: coerceNumber(filters.rating_max),
    leagues: (filters.leagues || "").trim(),
    nations: (filters.nations || "").trim(),
    positions: (filters.positions || "").trim(),
  });

  // apiFetch supports a `query` option (it appends URLSearchParams)
  const res = await apiFetch("/api/trade-finder", { query: params });
  return Array.isArray(res?.items) ? res.items : (Array.isArray(res) ? res : []);
}

export async function fetchDealInsight(deal) {
  // Guard against bad payloads
  const payload = clean({
    card_id: deal.card_id ?? deal.pid ?? deal.player_id,
    platform: deal.platform || filters?.platform || "console",
    current_price: coerceNumber(deal.current_price ?? deal.prices?.now),
    timeframe_hours: deal.timeframe_hours ?? 24,
  });

  try {
    const res = await apiFetch("/api/trade-finder/why", { method: "POST", body: payload });
    return res;
  } catch {
    return { explanation: "Candidate fits your filters." };
  }
}