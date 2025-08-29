// src/components/squad/chemistry.js
import { isValidForSlot } from "../../utils/positions";

/** Prefer stable IDs; fall back to lowercase names (so DB or FUT.GG both work). */
function keyOf(id, name) {
  if (id != null) return `id:${id}`;
  if (name) return `nm:${String(name).toLowerCase()}`;
  return null;
}

/** EA thresholds */
const THRESHOLDS = {
  club:   (n) => (n >= 7 ? 3 : n >= 4 ? 2 : n >= 2 ? 1 : 0),
  nation: (n) => (n >= 8 ? 3 : n >= 5 ? 2 : n >= 2 ? 1 : 0),
  league: (n) => (n >= 8 ? 3 : n >= 5 ? 2 : n >= 3 ? 1 : 0),
};

/** Contribution profile when IN POSITION */
const CONTRIB = {
  normal: { club: 1, nation: 1, league: 1 },
  hero:   { nation: 1, league: 2 }, // to their real league
  icon:   { nation: 2, leagueWildcard: 1 }, // +1 to ALL leagues
};

export function computeChemistry(placed, formation) {
  // Tallies (only from IN-POSITION players)
  const clubMap   = new Map();
  const nationMap = new Map();
  const leagueMap = new Map();

  // Each in-position Icon adds +1 wildcard to every league evaluation
  let iconLeagueWildcard = 0;

  const perPlayerChem = {};

  // -------- First pass: accumulate tallies from IN-POSITION players --------
  for (const slot of formation) {
    const p = placed[slot.key];
    if (!p) continue;

    const inPos = isValidForSlot(slot.pos, p.positions);
    if (!inPos) continue; // EA: OOP gives 0 and does not contribute

    const ck = keyOf(p.clubId,   p.club);
    const nk = keyOf(p.nationId, p.nation);
    const lk = keyOf(p.leagueId, p.league);

    if (p.isIcon) {
      // ICON: +2 nation, +1 wildcard to ALL leagues
      if (nk) nationMap.set(nk, (nationMap.get(nk) || 0) + CONTRIB.icon.nation);
      iconLeagueWildcard += CONTRIB.icon.leagueWildcard;
      // No club increment for Icons (club typically “Icons” and doesn’t factor in EA’s model)
    } else if (p.isHero) {
      // HERO: +1 nation, +2 to THEIR league; club behaves as normal +1 in EA
      if (nk) nationMap.set(nk, (nationMap.get(nk) || 0) + CONTRIB.hero.nation);
      if (lk) leagueMap.set(lk, (leagueMap.get(lk) || 0) + CONTRIB.hero.league);
      if (ck) clubMap.set(ck, (clubMap.get(ck) || 0) + CONTRIB.normal.club);
    } else {
      // NORMAL: +1 club, +1 nation, +1 league
      if (ck) clubMap.set(ck, (clubMap.get(ck) || 0) + CONTRIB.normal.club);
      if (nk) nationMap.set(nk, (nationMap.get(nk) || 0) + CONTRIB.normal.nation);
      if (lk) leagueMap.set(lk, (leagueMap.get(lk) || 0) + CONTRIB.normal.league);
    }
  }

  // -------- Second pass: compute per-player chem --------
  for (const slot of formation) {
    const p = placed[slot.key];
    if (!p) continue;

    const inPos = isValidForSlot(slot.pos, p.positions);
    if (!inPos) {
      perPlayerChem[p.id] = 0; // EA: OOP = 0 chem
      continue;
    }

    // ICON/HERO: fixed 3/3 when in position
    if (p.isIcon || p.isHero) {
      perPlayerChem[p.id] = 3;
      continue;
    }

    // NORMAL player → thresholds from tallies (+ icon wildcard to league)
    const ck = keyOf(p.clubId,   p.club);
    const nk = keyOf(p.nationId, p.nation);
    const lk = keyOf(p.leagueId, p.league);

    const clubCount   = ck ? (clubMap.get(ck)   || 0) : 0;
    const nationCount = nk ? (nationMap.get(nk) || 0) : 0;

    // League gets global +1 per icon in position
    const leagueCount = lk ? (leagueMap.get(lk) || 0) + iconLeagueWildcard : 0;

    const clubC   = THRESHOLDS.club(clubCount);
    const nationC = THRESHOLDS.nation(nationCount);
    const leagueC = THRESHOLDS.league(leagueCount);

    let chem = clubC + nationC + leagueC;
    if (chem > 3) chem = 3;

    perPlayerChem[p.id] = chem;
  }

  const teamChem = Math.min(
    33,
    Object.values(perPlayerChem).reduce((a, b) => a + (b || 0), 0)
  );

  return { perPlayerChem, teamChem };
}