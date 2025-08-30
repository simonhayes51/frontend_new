// src/components/squad/chemistry.js
import { isValidForSlot } from "../../utils/positions";

/** Lowercased key from a DB string (club/league/nation). */
const keyOf = (s) => (s ? String(s).trim().toLowerCase() : null);

// EA FC25 thresholds
const chemFromClub   = (n) => (n >= 7 ? 3 : n >= 4 ? 2 : n >= 2 ? 1 : 0);
const chemFromNation = (n) => (n >= 8 ? 3 : n >= 5 ? 2 : n >= 2 ? 1 : 0);
const chemFromLeague = (n) => (n >= 8 ? 3 : n >= 5 ? 2 : n >= 3 ? 1 : 0);

/**
 * placed: { [slotKey]: player|null }
 * formation: array of { key, pos }
 * Player shape expected from your DB mapping:
 * {
 *   id, name, rating,
 *   club, league, nation,         // strings from DB
 *   positions: [..],              // normalized codes (GK, RB, ... ST)
 *   isIcon, isHero                // booleans derived from DB fields
 * }
 */
export function computeChemistry(placed, formation) {
  // Tallies (only for players who are in-position)
  const clubMap   = new Map(); // club key -> count
  const nationMap = new Map(); // nation key -> count
  const leagueMap = new Map(); // league key -> count

  // Icon/Hero boost buckets
  let iconLeagueGlobalBoost = 0;   // +1 to *every* league for each in-position Icon
  const leagueExtra = new Map();   // league key -> +count (Heroes +2 to their league)
  const nationExtra = new Map();   // nation key -> +count (Icons +2, Heroes +1)

  const perPlayerChem = {};

  // ---------- First pass: counts from in-position players ----------
  for (const slot of formation) {
    const p = placed[slot.key];
    if (!p) continue;

    const inPos = isValidForSlot(slot.pos, p.positions);
    if (!inPos) continue;

    const ck = keyOf(p.club);
    const nk = keyOf(p.nation);
    const lk = keyOf(p.league);

    if (ck) clubMap.set(ck, (clubMap.get(ck) || 0) + 1);
    if (nk) nationMap.set(nk, (nationMap.get(nk) || 0) + 1);
    if (lk) leagueMap.set(lk, (leagueMap.get(lk) || 0) + 1);

    // EA boosts:
    // Icons: 3 chem in position. Team: +2 to nation count, +1 to ALL leagues
    if (p.isIcon) {
      if (nk) nationExtra.set(nk, (nationExtra.get(nk) || 0) + 2);
      iconLeagueGlobalBoost += 1;
    }
    // Heroes: 3 chem in position. Team: +1 to nation, +2 to their *own* league
    else if (p.isHero) {
      if (nk) nationExtra.set(nk, (nationExtra.get(nk) || 0) + 1);
      if (lk) leagueExtra.set(lk, (leagueExtra.get(lk) || 0) + 2);
    }
  }

  // ---------- Second pass: per-player chem ----------
  for (const slot of formation) {
    const p = placed[slot.key];
    if (!p) continue;

    const inPos = isValidForSlot(slot.pos, p.positions);
    if (!inPos) {
      perPlayerChem[p.id] = 0;
      continue;
    }

    // Icons/Heroes always get 3 when in position
    if (p.isIcon || p.isHero) {
      perPlayerChem[p.id] = 3;
      continue;
    }

    const ck = keyOf(p.club);
    const nk = keyOf(p.nation);
    const lk = keyOf(p.league);

    const clubCount   = ck ? (clubMap.get(ck) || 0) : 0;
    const nationCount = (nk ? (nationMap.get(nk) || 0) : 0) + (nk ? (nationExtra.get(nk) || 0) : 0);
    const leagueCount = (lk ? (leagueMap.get(lk) || 0) : 0) + iconLeagueGlobalBoost + (lk ? (leagueExtra.get(lk) || 0) : 0);

    const clubC   = chemFromClub(clubCount);
    const nationC = chemFromNation(nationCount);
    const leagueC = chemFromLeague(leagueCount);

    let chem = clubC + nationC + leagueC;
    if (chem > 3) chem = 3;
    if (chem < 0) chem = 0;

    perPlayerChem[p.id] = chem;
  }

  // Team chem = sum of individual chem, capped at 33
  const teamChem = Math.min(
    33,
    Object.values(perPlayerChem).reduce((a, b) => a + (b || 0), 0)
  );

  return { perPlayerChem, teamChem };
}