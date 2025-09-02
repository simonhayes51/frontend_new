// src/api/tradeFinder.js
import { apiFetch } from "./http";

/** Fetch deals from the backend and normalize to the UI shape the page expects. */
export async function fetchTradeFinder(params = {}) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    qs.append(k, String(v));
  }

  const res = await apiFetch(`/api/trade-finder?${qs.toString()}`);
  const items = Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : [];

  return items.map((it) => {
    const now = it?.prices?.now ?? it?.current_price ?? it?.price ?? null;
    const expSell = it?.expected_sell ?? (Number.isFinite(now) ? Math.round(now * 1.08) : null);
    const afterTax = Number.isFinite(now) && Number.isFinite(expSell)
      ? Math.max(0, Math.round(expSell * 0.95) - now)
      : null;

    return {
      player_id: it.pid ?? it.player_id ?? it.card_id,
      card_id: it.pid ?? it.card_id ?? it.player_id,
      name: it.name,
      version: it.version,
      rating: it.rating,
      position: it.position,
      league: it.league,
      platform: it.platform,
      timeframe_hours: params.timeframe ?? it.timeframe_hours ?? 24,

      image_url: it.image ?? it.image_url ?? null,

      current_price: Number.isFinite(now) ? now : null,
      expected_sell: Number.isFinite(expSell) ? expSell : null,
      est_profit_after_tax: Number.isFinite(afterTax) ? afterTax : 0,
      margin_pct:
        it.margin_pct ??
        (Number.isFinite(now) && Number.isFinite(expSell) ? ((expSell - now) / now) * 100 : 0),

      change_pct_window: it.change_pct_window ?? 0,
      vol_score: it.vol_score ?? 0,
      tags: Array.isArray(it.tags) ? it.tags : [],
    };
  });
}

export async function fetchDealInsight(deal) {
  // Will return rules-based text if LLM isn't configured server-side
  return apiFetch(`/api/trade-insight`, {
    method: "POST",
    body: JSON.stringify({ deal }),
  });
}
