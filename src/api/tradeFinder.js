import { apiFetch } from "./http";

export async function fetchTradeFinder(params = {}) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    qs.set(k, String(v));
  }
  const r = await apiFetch(`/trade-finder?${qs.toString()}`);
  if (Array.isArray(r)) return r;
  if (Array.isArray(r?.items)) return r.items;
  return [];
}

export async function fetchDealInsight(deal) {
  const r = await apiFetch("/trade-insight", {
    method: "POST",
    body: JSON.stringify({ deal }),
  });
  return {
    explanation: r.explanation || r.insight || "No explanation available.",
  };
}