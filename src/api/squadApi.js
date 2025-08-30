// src/api/squadApi.js
import { normalizePositions, isValidForSlot as _isValidForSlot } from "../utils/positions";

const API_BASE = import.meta.env.VITE_API_URL || "";
const searchCache = new Map();
const TTL = 5 * 60 * 1000;
const ok = (ts) => ts && (Date.now() - ts) < TTL;

// infer using your rules:
// Icon -> club: "ICON" or league: "Icons"
// Hero -> club: "Hero"
function inferSpecialFromDB({ club, league }) {
  const c = (club || "").trim().toLowerCase();
  const l = (league || "").trim().toLowerCase();
  const isIcon = c === "icon" || l === "icons";
  const isHero = c === "hero";
  return { isIcon, isHero };
}

// Filter helper for slot-specific search suggestions
function allowsSlot(playerPositions, slot) {
  return _isValidForSlot(slot, playerPositions);
}

export async function searchPlayers(query, slotFilter /* e.g. "ST" | null */) {
  const q = (query || "").trim();
  if (!q) return [];

  const key = `${q.toLowerCase()}|${slotFilter || ""}`;
  const cached = searchCache.get(key);
  if (cached && ok(cached.ts)) return cached.data;

  const r = await fetch(`${API_BASE}/api/search-players?q=${encodeURIComponent(q)}`, {
    credentials: "include",
  });
  if (!r.ok) return [];

  const { players = [] } = await r.json();

  let mapped = players.map((p) => {
    const base = Array.isArray(p.altposition)
      ? p.altposition
      : (p.altposition ? String(p.altposition).split(/[,\s/|]+/) : []);
    const positions = normalizePositions([p.position, ...base]);

    const { isIcon, isHero } = inferSpecialFromDB(p);

    return {
      id: Number(p.card_id),
      card_id: Number(p.card_id),
      name: p.name || "Unknown",
      rating: Number(p.rating) || 0,
      image_url: p.image_url || null,
      price: typeof p.price === "number" ? p.price : null,

      // chemistry-relevant fields (strings from DB)
      club: p.club || null,
      league: p.league || null,     // ✅ make sure we keep league
      nation: p.nation || null,

      positions,
      isIcon,
      isHero,
    };
  });

  if (slotFilter) {
    const sf = String(slotFilter).toUpperCase();
    mapped = mapped.filter((p) => allowsSlot(p.positions, sf));
  }

  searchCache.set(key, { ts: Date.now(), data: mapped });
  return mapped;
}

// Enrichment not required for chemistry if DB already has the fields.
// Keep it as a no-op to avoid overwriting with nulls.
export async function enrichPlayer(base) {
  return base;
}