// src/components/squad/chemistry.js
import { isValidForSlot } from "../../utils/positions";

/* ---------- helpers: ids/names, canonicalization ---------- */

function stripDiacritics(str) {
  try {
    return str.normalize("NFD").replace(/\p{Diacritic}/gu, "");
  } catch {
    return str;
  }
}

function canon(s) {
  if (!s) return null;
  let x = String(s).toLowerCase().trim();
  x = stripDiacritics(x);
  // remove common suffixes/punctuation that cause split tallies
  x = x.replace(/\bfootball club\b/g, "")
       .replace(/\bfc\b/g, "")
       .replace(/\bafc\b/g, "")
       .replace(/[.'’\-]/g, "")
       .replace(/\s+/g, " ")
       .trim();
  return x || null;
}

function keyOf(id, name) {
  // Prefer stable numeric ids if present; otherwise canonicalized name
  if (id != null && id !== undefined) return `id:${id}`;
  const c = canon(name);
  return c ? `nm:${c}` : null;
}

/* ---------- thresholds (EA FC25) ---------- */

const chemFromClub   = (n) => (n >= 7 ? 3 : n >= 4 ? 2 : n >= 2 ? 1 : 0);
const chemFromNation = (n) => (n >= 8 ? 3 : n >= 5 ? 2 : n >= 2 ? 1 : 0);
const chemFromLeague = (n) => (n >= 8 ? 3 : n >= 5 ? 2 : n >= 3 ? 1 : 0);

/* ---------- main ---------- */
/**
 * placed:    { [slotKey]: player|null }
 * formation: [ { key, pos }, ... ]
 *
 * Player shape we read:
 *   id, positions[], club|clubId, nation|nationId, league|leagueId, isIcon, isHero
 */
export function computeChemistry(placed, formation) {
  const clubMap   = new Map(); // key -> weighted count
  const nationMap = new Map();
  const leagueMap = new Map();

  const perPlayerChem = {};

  // --- PASS 1: build tallies from players IN POSITION only ---
  for (const slot of formation) {
    const p = placed[slot.key];
    if (!p) continue;

    const inPos = isValidForSlot(slot.pos, p.positions);
    if (!inPos) continue; // OOP gives no contributions

    const ck = keyOf(p.clubId, p.club);
    const nk = keyOf(p.nationId, p.nation);
    const lk = keyOf(p.leagueId, p.league);

    const isIcon = !!p.isIcon;
    const isHero = !!p.isHero;

    if (isIcon) {
      // ICON: +2 nation, +1 to EVERY league (global)
      if (nk) nationMap.set(nk, (nationMap.get(nk) || 0) + 2);
      // Global +1 to "all leagues": model this as adding +1 to this player's league key
      // plus a synthetic key used for lookups (so icons also help leagues where needed).
      // To keep it simple and deterministic for per-player calc, we add +1 to ALL
      // league tallies by using a special wildcard bucket and merging later.
      leagueMap.set("__ICON_LEAGUE_WILDCARD__", (leagueMap.get("__ICON_LEAGUE_WILDCARD__") || 0) + 1);
      if (lk) leagueMap.set(lk, (leagueMap.get(lk) || 0) + 1);
      // (No club contribution)
    } else if (isHero) {
      // HERO: +2 league, +1 nation
      if (lk) leagueMap.set(lk, (leagueMap.get(lk) || 0) + 2);
      if (nk) nationMap.set(nk, (nationMap.get(nk) || 0) + 1);
      // (No club contribution)
    } else {
      // Regular card: +1 club, +1 nation, +1 league
      if (ck) clubMap.set(ck, (clubMap.get(ck) || 0) + 1);
      if (nk) nationMap.set(nk, (nationMap.get(nk) || 0) + 1);
      if (lk) leagueMap.set(lk, (leagueMap.get(lk) || 0) + 1);
    }
  }

  // If any icon contributed to the wildcard, blend it into *every* league tally evenly.
  // Practically, EA treats this as +1 to each league threshold pool; to approximate
  // without knowing the universe of leagues, we add the wildcard ONLY during per-player
  // league lookups (so it benefits every player's league equally).
  const iconWildcard = leagueMap.get("__ICON_LEAGUE_WILDCARD__") || 0;

  // --- PASS 2: compute per-player chem ---
  for (const slot of formation) {
    const p = placed[slot.key];
    if (!p) continue;

    const inPos = isValidForSlot(slot.pos, p.positions);
    if (!inPos) {
      perPlayerChem[p.id] = 0;
      continue;
    }

    const isIcon = !!p.isIcon;
    const isHero = !!p.isHero;

    // Icons/Heroes: 3 chem in position, 0 if OOP (already handled above)
    if (isIcon || isHero) {
      perPlayerChem[p.id] = 3;
      continue;
    }

    const ck = keyOf(p.clubId, p.club);
    const nk = keyOf(p.nationId, p.nation);
    const lk = keyOf(p.leagueId, p.league);

    const clubCount   = ck ? (clubMap.get(ck) || 0) : 0;
    const nationCount = nk ? (nationMap.get(nk) || 0) : 0;
    const leagueCount = lk ? (leagueMap.get(lk) || 0) + iconWildcard : iconWildcard;

    const cClub   = chemFromClub(clubCount);
    const cNation = chemFromNation(nationCount);
    const cLeague = chemFromLeague(leagueCount);

    let chem = cClub + cNation + cLeague;
    if (chem > 3) chem = 3;
    if (chem < 0) chem = 0;

    perPlayerChem[p.id] = chem;
  }

  // --- team total (capped 33) ---
  const teamChem = Math.min(
    33,
    Object.values(perPlayerChem).reduce((a, b) => a + (b || 0), 0)
  );

  return { perPlayerChem, teamChem };
}