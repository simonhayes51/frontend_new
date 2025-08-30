// src/api/squadApi.js
import { normalizePositions } from "../utils/positions";

const API_BASE = import.meta.env.VITE_API_URL || "";

// simple in-memory search cache
const searchCache = new Map();
const TTL = 5 * 60 * 1000;
const ok = (ts) => ts && (Date.now() - ts) < TTL;

// infer isIcon/isHero straight from your DB conventions
function inferSpecialFromDB({ club, league }) {
  const c = (club || "").trim().toLowerCase();
  const l = (league || "").trim().toLowerCase();
  const isIcon = c === "icon" || l === "icons";
  const isHero = c === "hero";
  return { isIcon, isHero };
}

export async function searchPlayers(query, slotFilter /* e.g. "ST" or null */) {
  const q = (query || "").trim();
  if (!q) return [];

  const key = `${q.toLowerCase()}|${slotFilter || ""}`;
  const cached = searchCache.get(key);
  if (cached && ok(cached.ts)) return cached.data;

  const res = await fetch(`${API_BASE}/api/search-players?q=${encodeURIComponent(q)}`, { credentials: "include" });
  if (!res.ok) return [];

  const { players = [] } = await res.json();

  // map DB rows -> FE shape
  let mapped = players.map((p) => {
    const mainPos = p.position ? [p.position] : [];
    const altPos  = p.altposition
      ? (Array.isArray(p.altposition) ? p.altposition : String(p.altposition).split(/[,\s/|]+/))
      : [];
    const positions = normalizePositions([...mainPos, ...altPos]);

    const { isIcon, isHero } = inferSpecialFromDB(p);

    return {
      id: Number(p.card_id),
      card_id: Number(p.card_id),
      name: p.name || "Unknown",
      rating: Number(p.rating) || 0,
      club: p.club || null,
      league: p.league || null,
      nation: p.nation || null,
      positions,
      image_url: p.image_url || null,
      price: typeof p.price === "number" ? p.price : null,
      isIcon,
      isHero,
    };
  });

  // if slotFilter provided, keep only eligible players for that slot
  if (slotFilter) {
    const sf = String(slotFilter).toUpperCase();
    mapped = mapped.filter((p) => positionsAllowSlot(p.positions, sf));
  }

  searchCache.set(key, { ts: Date.now(), data: mapped });
  return mapped;
}

// quick local compatibility check for the slot filter (same logic as utils/positions isValidForSlot)
import { isValidForSlot as _isValidForSlot, normalizePositions as _norm } from "../utils/positions";
function positionsAllowSlot(positions, slot) {
  return _isValidForSlot(slot, _norm(positions));
}

export async function enrichPlayer(base) {
  // No FUT.GG needed for chemistry; if you still want live price, you can keep your price call here.
  return base;
}