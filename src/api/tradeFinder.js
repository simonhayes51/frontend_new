// src/api/tradeFinder.js
import api from "../axios";

// Map UI values to backend expectations
function normalizePlatform(p) {
  const x = String(p || "").toLowerCase();
  if (x === "pc" || x === "windows") return "pc";
  // everything else (ps, xbox, console) is treated as "console" by the backend
  return "console";
}

function clampTimeframe(tf) {
  const n = Number(tf) || 24;
  if (n < 6) return 6;
  if (n > 24) return 24;
  return n;
}

async function getOnce(url, params) {
  const { data } = await api.get(url, { params });
  // server may return an array or {items, meta}
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.items)) return data.items;
  return [];
}

export async function fetchTradeFinder(params) {
  // Only send fields the backend actually accepts
  const q = {
    platform: normalizePlatform(params?.platform),
    timeframe: clampTimeframe(params?.timeframe),
    topn: Number(params?.topn) || undefined,
    budget_min: params?.budget_min !== undefined ? Number(params.budget_min) : undefined,
    budget_max: params?.budget_max !== undefined ? Number(params.budget_max) : undefined,
    min_profit: params?.min_profit !== undefined ? Number(params.min_profit) : undefined,
    min_margin_pct: params?.min_margin_pct !== undefined ? Number(params.min_margin_pct) : undefined,
    rating_min: params?.rating_min !== undefined ? Number(params.rating_min) : undefined,
    rating_max: params?.rating_max !== undefined ? Number(params.rating_max) : undefined,
    // flags default to 1 on backend; omit unless you need to toggle them
    // exclude_extinct: 1,
    // exclude_low_liquidity: 1,
    // exclude_anomalies: 1,
  };

  let items;
  try {
    items = await getOnce("/api/trade-finder", q);
  } catch (e) {
    // Surface original error if it wasn't just the path
    throw e;
  }

  // If nothing found, try once more without profit/margin gates
  if (!items.length) {
    const relaxed = { ...q };
    delete relaxed.min_profit;
    delete relaxed.min_margin_pct;
    try {
      const second = await getOnce("/api/trade-finder", relaxed);
      if (second.length) return second;
    } catch {
      // ignore second pass errors
    }
  }

  return items;
}

export async function fetchDealInsight(deal) {
  try {
    // correct backend route is /api/trade-insight
    const { data } = await api.post("/api/trade-insight", { deal });
    return data;
  } catch {
    // graceful fallback
    return {
      explanation:
        `Candidate fits your filters.` +
        (deal?.change_pct_window !== undefined
          ? ` Window change: ${Number(deal.change_pct_window).toFixed?.(1)}%.`
          : "") +
        (deal?.vol_score !== undefined ? ` Volume score: ${deal.vol_score}.` : "") +
        (deal?.margin_pct !== undefined
          ? ` Projected margin: ${Number(deal.margin_pct).toFixed?.(2)}%.`
          : ""),
    };
  }
}