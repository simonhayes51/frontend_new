// src/api/squadApi.js
import { normalizePositions } from "../utils/positions";

const API_BASE = import.meta.env.VITE_API_URL || "";

// --- simple in-memory caches with short TTL
const TTL = 5 * 60 * 1000; // 5 min
const cache = {
  search: new Map(),   // key -> {at,data}
  defs: new Map(),     // cardId -> {at,data}
  prices: new Map(),   // cardId -> {at,data}
};
const fresh = (at) => at && (Date.now() - at) < TTL;

// --- helpers
const pill = (v) => (v == null ? null : String(v).trim() || null);
const asNum = (n) => (typeof n === "number" ? n : Number.isFinite(+n) ? +n : null);

/**
 * Frontend player shape normalizer (DB-first).
 * Accepts a DB row from /api/search-players and converts to the
 * structure your UI expects.
 */
function fromDbRow(r) {
  const base = {
    id: Number(r.card_id),
    card_id: Number(r.card_id),
    name: r.name || "Unknown Player",
    rating: asNum(r.rating) ?? 0,
    version: pill(r.version),
    club: pill(r.club),
    league: pill(r.league),
    nation: pill(r.nation),
    image_url: pill(r.image_url),
    price: asNum(r.price),
  };

  // positions from position + altposition
  const rawPositions = [];
  if (r.position) rawPositions.push(r.position);
  if (r.altposition) rawPositions.push(...String(r.altposition).split(/[,\s;/|]+/));
  base.positions = normalizePositions(rawPositions);

  // icon/hero heuristics from DB “version”
  const ver = (r.version || "").toLowerCase();
  base.isIcon = ver.includes("icon");
  base.isHero = ver.includes("hero");

  // If your DB uses literal club/league tags for special cards:
  // Icon: club = "ICON", league = "Icons"
  // Hero: club = "HERO", league = actual league
  // (Nothing else to do here; chemistry module reads the strings.)

  return base;
}

/**
 * Search players from your backend DB.
 * Supports optional position filter via ?pos= (the backend already accepts it).
 */
export async function searchPlayers(query, pos) {
  const q = (query || "").trim();
  const p = (pos || "").trim().toUpperCase();
  if (!q && !p) return [];

  const key = `q=${q}|p=${p}`;
  const hit = cache.search.get(key);
  if (hit && fresh(hit.at)) return hit.data;

  const url = new URL(`${API_BASE}/api/search-players`);
  if (q) url.searchParams.set("q", q);
  if (p) url.searchParams.set("pos", p);

  try {
    const r = await fetch(url.toString(), { credentials: "include" });
    if (!r.ok) return [];
    const { players = [] } = await r.json();
    const data = players.map(fromDbRow);

    cache.search.set(key, { at: Date.now(), data });
    return data;
  } catch {
    return [];
  }
}

/**
 * Optional enrichment: today we’re DB-first, so this just returns the
 * player back as-is. Keep the signature because the UI calls it.
 * If later you want to add FUT.GG definition/price, you can expand here.
 */
export async function enrichPlayer(base) {
  // No-op enrichment to keep the app contract intact.
  // You can still do live price/definition fetch here if desired.
  return base;
}

// (Optional) batch version used sometimes
export async function enrichPlayers(players) {
  if (!Array.isArray(players)) return [];
  const out = await Promise.all(players.map((p) => enrichPlayer(p)));
  return out;
}

// small utilities for debugging
export function clearPlayerCaches() {
  cache.search.clear();
  cache.defs.clear();
  cache.prices.clear();
}

export const __debug = {
  caches: cache,
  TTL,
};