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
  return data;
}

export async function fetchTradeFinder(params) {
  // 1) Normalize the query the API expects
  const q = {
    ...params,
    platform: normalizePlatform(params?.platform),
    timeframe: Number(params?.timeframe) || 24,
    budget_max: Number(params?.budget_max) || undefined,
    min_profit: Number(params?.min_profit) || undefined,
    min_margin_pct: params?.min_margin_pct !== undefined ? Number(params.min_margin_pct) : undefined,
    rating_min: Number(params?.rating_min) || undefined,
    rating_max: Number(params?.rating_max) || undefined,
    leagues: scrubCSV(params?.leagues),
    nations: scrubCSV(params?.nations),
    positions: scrubCSV(params?.positions),
  };

  // 2) Try the primary endpoint
  let data;
  try {
    data = await getOnce("/api/trade-finder", q);
  } catch (e) {
    // allow a legacy underscore path as a fallback in case the server is older
    if (e?.response?.status === 404) {
      data = await getOnce("/api/trade_finder", q).catch(() => []);
    } else {
      throw e;
    }
  }

  // 3) If nothing came back, retry once with relaxed profit/margin (but SAME layout)
  if (!Array.isArray(data) || data.length === 0) {
    const relaxed = { ...q };
    delete relaxed.min_profit;
    delete relaxed.min_margin_pct;
    try {
      const second = await getOnce("/api/trade-finder", relaxed);
      if (Array.isArray(second)) return second;
    } catch {
      /* swallow */
    }
    return Array.isArray(data) ? data : [];
  }

  return data;
}

export async function fetchDealInsight(deal) {
  try {
    const { data } = await api.post("/api/trade-finder/why", deal);
    return data;
  } catch {
    // graceful fallback so the modal isn't useless
    return {
      explanation:
        `Candidate fits your filters.\n` +
        (deal?.change_pct_window !== undefined
          ? `24h change: ${deal.change_pct_window.toFixed?.(1)}%.\n`
          : "") +
        (deal?.vol_score !== undefined ? `Volume score: ${deal.vol_score}.\n` : "") +
        (deal?.margin_pct !== undefined ? `Projected margin: ${deal.margin_pct?.toFixed?.(2)}%.\n` : ""),
    };
  }
}