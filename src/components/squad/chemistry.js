// src/components/squad/chemistry.js
import { isValidForSlot } from "../../utils/positions";

const keyOf = (name) => name ? String(name).trim().toLowerCase() : null;

// FC25 thresholds
const chemFromClub   = (n) => (n >= 7 ? 3 : n >= 4 ? 2 : n >= 2 ? 1 : 0);
const chemFromNation = (n) => (n >= 8 ? 3 : n >= 5 ? 2 : n >= 2 ? 1 : 0);
const chemFromLeague = (n) => (n >= 8 ? 3 : n >= 5 ? 2 : n >= 3 ? 1 : 0);

export function computeChemistry(placed, formation) {
  const clubMap   = new Map();
  const nationMap = new Map();
  const leagueMap = new Map();

  let iconLeagueGlobalBoost = 0;
  const leagueExtra = new Map();
  const nationExtra = new Map();

  const perPlayerChem = {};

  // ---- First pass: only in-position players contribute
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

    // Icon / Hero boosts
    if (p.isIcon) {
      if (nk) nationExtra.set(nk, (nationExtra.get(nk) || 0) + 2);
      iconLeagueGlobalBoost += 1;
    } else if (p.isHero) {
      if (nk) nationExtra.set(nk, (nationExtra.get(nk) || 0) + 1);
      if (lk) leagueExtra.set(lk, (leagueExtra.get(lk) || 0) + 2);
    }
  }

  // ---- Second pass: compute chem per player
  for (const slot of formation) {
    const p = placed[slot.key];
    if (!p) continue;

    const inPos = isValidForSlot(slot.pos, p.positions);
    if (!inPos) {
      perPlayerChem[p.id] = 0;
      continue;
    }

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

    let chem = Math.min(3, clubC + nationC + leagueC);
    perPlayerChem[p.id] = chem;
  }

  const teamChem = Math.min(33, Object.values(perPlayerChem).reduce((a, b) => a + (b || 0), 0));
  return { perPlayerChem, teamChem };
}