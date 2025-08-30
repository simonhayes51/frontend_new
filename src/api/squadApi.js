// src/api/squadApi.js
// Uses your DB for search results (including DB price if present),
// and provides a tiny getLivePrice() helper that hits your FastAPI proxy.

const API_BASE = import.meta.env.VITE_API_URL || "";

// ---- SEARCH (supports optional position filter via ?pos=) ----
export async function searchPlayers(query, opts = {}) {
  const q = (query || "").trim();
  const pos = (opts.pos || "").trim();
  if (!q && !pos) return [];

  const url = new URL(`${API_BASE}/api/search-players`);
  if (q) url.searchParams.set("q", q);
  if (pos) url.searchParams.set("pos", pos);

  try {
    const r = await fetch(url.toString(), { credentials: "include" });
    if (!r.ok) return [];
    const { players = [] } = await r.json();

    // Coerce to the shape the UI expects
    return players.map((p) => ({
      id: Number(p.card_id),
      card_id: Number(p.card_id),

      name: p.name || "Unknown Player",
      rating: typeof p.rating === "number" ? p.rating : Number(p.rating) || 0,
      club: p.club || null,
      nation: p.nation || null,
      league: p.league || null,

      // for positions utils elsewhere
      position: p.position || null,
      altposition: p.altposition || null,

      image_url: p.image_url || null,

      // DB price → number | null
      price:
        typeof p.price === "number"
          ? p.price
          : p.price != null && !isNaN(Number(p.price))
          ? Number(p.price)
          : null,

      // icon/hero detection based on your DB conventions
      isIcon:
        (p.club || "").toUpperCase() === "ICON" ||
        (p.league || "").toUpperCase() === "ICONS",
      isHero: (p.club || "").toUpperCase() === "HERO",
    }));
  } catch (e) {
    console.warn("searchPlayers failed:", e);
    return [];
  }
}

// ---- LIVE PRICE (FUT.GG proxy already in your backend) ----
export async function getLivePrice(cardId) {
  const id = Number(cardId);
  if (!id) return null;
  try {
    const r = await fetch(`${API_BASE}/api/fut-player-price/${id}`, {
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    if (!r.ok) return null;
    const json = await r.json();
    const cur = json?.data?.currentPrice || {};
    const price =
      typeof cur.price === "number"
        ? cur.price
        : cur.price != null && !isNaN(Number(cur.price))
        ? Number(cur.price)
        : null;
    return price ?? null;
  } catch (e) {
    console.warn("getLivePrice failed:", e);
    return null;
  }
}