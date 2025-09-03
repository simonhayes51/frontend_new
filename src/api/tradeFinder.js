// src/api/tradeFinder.js
import { apiFetch } from "./http";

/**
 * Fetch trade candidates.
 * params = {
 *   platform: "console" | "pc" | "ps" | "xbox",
 *   timeframe: 4 | 24,
 *   budget_max, min_profit, min_margin_pct,
 *   rating_min, rating_max,
 *   leagues, nations, positions
 * }
 */
export async function fetchTradeFinder(params) {
  // pass params as query-string via apiFetch so it hits `${VITE_API_BASE_URL}/api/trade-finder`
  const data = await apiFetch("/api/trade-finder", {
    query: {
      platform: params.platform,
      timeframe: params.timeframe,
      budget_max: params.budget_max,
      min_profit: params.min_profit,
      min_margin_pct: params.min_margin_pct,
      rating_min: params.rating_min,
      rating_max: params.rating_max,
      leagues: params.leagues,
      nations: params.nations,
      positions: params.positions,
    },
  });

  // always return an array to the UI
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

/**
 * Ask the API to explain a specific deal (for the “Why this deal?” modal).
 * Accepts the deal object you render in the card.
 */
export async function fetchDealInsight(deal) {
  return apiFetch("/api/trade-finder/explain", {
    method: "POST",
    json: {
      card_id: deal.card_id ?? deal.player_id ?? deal.pid,
      platform: deal.platform,
      timeframe_hours: deal.timeframe_hours,
      context: {
        current_price: deal.current_price,
        expected_sell: deal.expected_sell,
        margin_pct: deal.margin_pct,
      },
    },
  });
}