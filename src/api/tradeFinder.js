// src/api/tradeFinder.js
import { apiFetch } from "./http";

// normalize server response into a plain array of deals
export async function fetchTradeFinder(params = {}) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    qs.set(k, String(v));
  }
  const r = await apiFetch(`/trade-finder?${qs.toString()}`);
  // server may return {items, meta} OR just []
  if (Array.isArray(r)) return r;
  if (Array.isArray(r?.items)) return r.items;
  return [];
}

// returns {explanation} or {insight}
export async function fetchDealInsight(deal) {
  const r = await apiFetch("/trade-insight", {
    method: "POST",
    body: JSON.stringify({ deal }),
  });
  return {
    explanation: r.explanation || r.insight || "No explanation available.",
  };
}