// src/api/tradeFinder.js
import api from "../axios";

/** normalize platform for the API */
function normalizePlatform(p) {
  const x = String(p || "").toLowerCase();
  if (x === "console" || x === "ps" || x === "ps5" || x === "playstation") return "ps";
  if (x === "xbox" || x === "xsx" || x === "series") return "xbox";
  if (x === "pc" || x === "windows") return "pc";
  return x || "ps";
}

/** turn "Premier League, LaLiga" -> "Premier League,LaLiga" (no empties) */
function scrubCSV(s) {
  if (!s) return "";
  return String(s)
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .join(",");
}

async function getOnce(url, params) {
  const { data } = await api.get(url, { params });
  // server can return either an array or {items, meta}
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.items)) return data.items;
  return [];
}

export async function fetchTradeFinder(params) {
  const q = {
    ...params,
    platform: normalizePlatform(params?.platform),
    timeframe: Number(params?.timeframe) || 24,
    budget_max: Number(params?.budget_max) || undefined,
    min_profit: params?.min_profit !== undefined ? Number(params.min_profit) : undefined,
    min_margin_pct: params?.min_margin_pct !== undefined ? Number(params.min_margin_pct) : undefined,
    rating_min: Number(params?.rating_min) || undefined,
    rating_max: Number(params?.rating_max) || undefined,
    leagues: scrubCSV(params?.leagues),
    nations: scrubCSV(params?.nations),
    positions: scrubCSV(params?.positions),
  };

  let items;
  try {
    items = await getOnce("/api/trade-finder", q);
  } catch (e) {
    if (e?.response?.status === 404) {
      items = await getOnce("/api/trade_finder", q).catch(() => []);
    } else {
      throw e;
    }
  }

  // If empty, retry once without profit/margin constraints
  if (!items.length) {
    const relaxed = { ...q };
    delete relaxed.min_profit;
    delete relaxed.min_margin_pct;
    try {
      const second = await getOnce("/api/trade-finder", relaxed);
      if (second.length) return second;
    } catch { /* ignore */ }
  }

  return items;
}

export async function fetchDealInsight(deal) {
  try {
    const { data } = await api.post("/api/trade-finder/why", deal);
    return data;
  } catch {
    return {
      explanation:
        `Candidate fits your filters.\n` +
        (deal?.change_pct_window !== undefined
          ? `Window change: ${Number(deal.change_pct_window).toFixed?.(1)}%.\n`
          : "") +
        (deal?.vol_score !== undefined ? `Volume score: ${deal.vol_score}.\n` : "") +
        (deal?.margin_pct !== undefined ? `Projected margin: ${Number(deal.margin_pct).toFixed?.(2)}%.\n` : ""),
    };
  }
}