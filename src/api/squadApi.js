import { normalizePositions } from "../utils/positions";

const API_BASE = import.meta.env.VITE_API_URL || "";

// Minimal cache
const searchCache = new Map();
const TTL = 5 * 60 * 1000;
const fresh = (at) => at && (Date.now() - at) < TTL;

// Build frontend shape from DB row
function fromDbRow(r) {
  const positions = normalizePositions([
    r?.position,
    ...(r?.altposition ? String(r.altposition).split(/[,\s;/|]+/) : []),
  ]);

  const ver = String(r?.version || "").toLowerCase();
  const clubUpper = String(r?.club || "").toUpperCase();
  const leagueLower = String(r?.league || "").toLowerCase();

  const isIcon = ver.includes("icon") || clubUpper === "ICON" || leagueLower === "icons";
  const isHero = ver.includes("hero") || clubUpper === "HERO";

  return {
    id: Number(r.card_id),
    card_id: Number(r.card_id),
    name: r.name || "Unknown Player",
    rating: Number(r.rating) || 0,
    version: r.version || null,
    club: r.club || null,
    league: r.league || null,
    nation: r.nation || null,
    image_url: r.image_url || null,
    price: typeof r.price === "number" ? r.price : null,
    // positions
    position: r.position || null,
    altposition: r.altposition || null,
    positions,
    // flags
    isIcon,
    isHero,
  };
}

// Search, with optional slot position filter (backend supports ?pos=)
export async function searchPlayers(query, pos) {
  const q = (query || "").trim();
  const p = (pos || "").trim().toUpperCase();
  if (!q && !p) return [];

  const key = `q=${q}|p=${p}`;
  const hit = searchCache.get(key);
  if (hit && fresh(hit.at)) return hit.data;

  const url = new URL(`${API_BASE}/api/search-players`);
  if (q) url.searchParams.set("q", q);
  if (p) url.searchParams.set("pos", p);

  const r = await fetch(url.toString(), { credentials: "include" });
  if (!r.ok) return [];
  const { players = [] } = await r.json();
  const data = players.map(fromDbRow);

  searchCache.set(key, { at: Date.now(), data });
  return data;
}

// Keep this export since the UI calls it (no-op enrichment by design)
export async function enrichPlayer(base) {
  return base;
}