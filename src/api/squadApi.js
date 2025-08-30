// src/api/squadApi.js
import { normalizePositions } from "../utils/positions";

const API_BASE = import.meta.env.VITE_API_URL || "";

// tiny caches (5 min TTL)
const TTL = 5 * 60 * 1000;
const searchCache = new Map();
const priceCache = new Map();

const isFresh = (t) => Date.now() - t < TTL;

export async function searchPlayers(query, slotPos = null) {
  const q = (query || "").trim();
  const p = slotPos ? String(slotPos).toUpperCase() : "";
  if (!q && !p) return [];

  const key = `${q}::${p}`;
  const cached = searchCache.get(key);
  if (cached && isFresh(cached.t)) return cached.data;

  const url = new URL(`${API_BASE}/api/search-players`);
  if (q) url.searchParams.set("q", q);
  if (p) url.searchParams.set("pos", p);

  try {
    const r = await fetch(url.toString(), { credentials: "include" });
    if (!r.ok) return [];
    const { players = [] } = await r.json();

    const data = players.map((row) => {
      // Build positions from primary + altposition column
      const list = [];
      if (row.position) list.push(row.position);
      if (row.altposition) list.push(...String(row.altposition).split(/[,\s;/|]+/));
      const positions = normalizePositions(list);

      // Icon/Hero detection from DB values (your convention)
      const club = row.club || null;
      const league = row.league || null;
      const version = (row.version || "").toLowerCase();
      const isIcon = club?.toUpperCase() === "ICON" || league?.toUpperCase() === "ICONS" || version.includes("icon");
      const isHero = club?.toUpperCase() === "HERO" || version.includes("hero");

      return {
        id: Number(row.card_id),
        card_id: Number(row.card_id),
        name: row.name,
        rating: Number(row.rating) || 0,
        version: row.version || null,
        image_url: row.image_url || null,
        price: typeof row.price === "number" ? row.price : null,

        club,
        league,
        nation: row.nation || null,

        positions,
        isIcon,
        isHero,
      };
    });

    searchCache.set(key, { t: Date.now(), data });
    return data;
  } catch {
    return [];
  }
}

// Optional: live price proxy (kept for future use)
export async function fetchLivePrice(cardId) {
  const id = Number(cardId);
  if (!id) return null;

  const cached = priceCache.get(id);
  if (cached && isFresh(cached.t)) return cached.data;

  try {
    const r = await fetch(`${API_BASE}/api/fut-player-price/${id}`, { credentials: "include" });
    if (!r.ok) return null;
    const json = await r.json();
    const cur = json?.data?.currentPrice || {};
    const out = {
      price: typeof cur.price === "number" ? cur.price : null,
      isExtinct: !!cur.isExtinct,
      updatedAt: cur.priceUpdatedAt || null,
    };
    priceCache.set(id, { t: Date.now(), data: out });
    return out;
  } catch {
    return null;
  }
}