// src/api/tradeFinder.js
import api from "../axios"; // if your client lives at src/axios.js

const num = (v, d = undefined) => {
  if (v === "" || v == null) return d;
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

const csv = (s) =>
  (s ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)
    .join(",");

/**
 * Fetch Trade Finder deals
 * Normalises params and returns an array regardless of API shape.
 */
export async function fetchTradeFinder(params = {}) {
  const q = {
    platform: (params.platform || "console").toLowerCase(),
    timeframe: num(params.timeframe, 24),
    budget_max: num(params.budget_max),
    min_profit: num(params.min_profit),
    min_margin_pct: num(params.min_margin_pct),
    rating_min: num(params.rating_min),
    rating_max: num(params.rating_max),
    leagues: csv(params.leagues),
    nations: csv(params.nations),
    positions: csv(params.positions),
  };

  // Debug URL (safe to remove)
  try {
    console.log("🔗 TradeFinder GET:", api.getUri({ url: "/api/trade-finder", params: q }));
  } catch {}

  const { data } = await api.get("/api/trade-finder", { params: q });

  // Support multiple shapes: array, {deals}, {items}, {results}
  const deals = Array.isArray(data)
    ? data
    : data?.deals ?? data?.items ?? data?.results ?? [];

  return deals || [];
}

/**
 * Ask the API to explain a specific deal (optional helper)
 */
export async function fetchDealInsight(deal = {}) {
  const player_id = deal.player_id ?? deal.pid ?? deal.card_id ?? deal.id;

  const body = {
    player_id,
    platform: (deal.platform || "console").toLowerCase(),
    timeframe_hours: num(deal.timeframe_hours ?? deal.timeframe, 24),
    current_price: num(deal.current_price),
    expected_sell: num(deal.expected_sell),
  };

  try {
    console.log("🔗 TradeFinder POST:", api.getUri({ url: "/api/trade-finder/explain" }));
  } catch {}

  const { data } = await api.post("/api/trade-finder/explain", body);
  return data;
}