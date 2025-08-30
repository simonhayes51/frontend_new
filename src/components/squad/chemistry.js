// src/components/squad/chemistry.js
import { isValidForSlot } from "../../utils/positions";

/**
 * EA-style thresholds (FC25)
 * Club:   2/4/7  => +1/+2/+3
 * Nation: 2/5/8  => +1/+2/+3
 * League: 3/5/8  => +1/+2/+3
 */
const clubChem   = (n) => (n >= 7 ? 3 : n >= 4 ? 2 : n >= 2 ? 1 : 0);
const nationChem = (n) => (n >= 8 ? 3 : n >= 5 ? 2 : n >= 2 ? 1 : 0);
const leagueChem = (n) => (n >= 8 ? 3 : n >= 5 ? 2 : n >= 3 ? 1 : 0);

/**
 * Icons/Heroes contributions (approx EA behaviour):
 * - Only counted if the player is IN POSITION.
 * - Icon:
 *    - Player gets 3 chem (in position)
 *    - Contributes +2 to Nation tally and +1 to ALL leagues
 * - Hero:
 *    - Player gets 3 chem (in position)
 *    - Contributes +2 to their League tally and +1 to Nation
 */
export function computeChemistry(placed, formation) {
  // tallies (only for in-position players)
  const clubs = new Map();   // key -> count
  const nations = new Map();
  const leagues = new Map();

  // for league-wide icon perk (+1 to every league once per icon)
  let globalLeagueBonus = 0;

  const perPlayerChem = {};

  // ---- FIRST PASS: build tallies for in-position players
  for (const slot of formation) {
    const p = placed[slot.key];
    if (!p) continue;

    const inPos = isValidForSlot(slot.pos, p.positions);
    if (!inPos) continue;

    const ck = p.club ? p.club.toLowerCase() : null;
    const nk = p.nation ? p.nation.toLowerCase() : null;
    const lk = p.league ? p.league.toLowerCase() : null;

    if (p.isIcon) {
      // icon contributes +2 nation, +1 to *all* leagues (tracked as a global bonus we add later)
      if (nk) nations.set(nk, (nations.get(nk) || 0) + 2);
      globalLeagueBonus += 1;
    } else if (p.isHero) {
      // hero contributes +2 league, +1 nation
      if (lk) leagues.set(lk, (leagues.get(lk) || 0) + 2);
      if (nk) nations.set(nk, (nations.get(nk) || 0) + 1);
    } else {
      if (ck) clubs.set(ck, (clubs.get(ck) || 0) + 1);
      if (nk) nations.set(nk, (nations.get(nk) || 0) + 1);
      if (lk) leagues.set(lk, (leagues.get(lk) || 0) + 1);
    }
  }

  // apply the icon +1 global league bonus across all *present* leagues
  if (globalLeagueBonus > 0 && leagues.size > 0) {
    for (const [lk, cnt] of leagues.entries()) {
      leagues.set(lk, cnt + globalLeagueBonus);
    }
  }

  // ---- SECOND PASS: compute per-player chem
  for (const slot of formation) {
    const p = placed[slot.key];
    if (!p) continue;

    const inPos = isValidForSlot(slot.pos, p.positions);
    if (!inPos) {
      perPlayerChem[p.id] = 0;
      continue;
    }

    if (p.isIcon || p.isHero) {
      // EA: icons/heroes have 3 chem when in position
      perPlayerChem[p.id] = 3;
      continue;
    }

    const ck = p.club ? p.club.toLowerCase() : null;
    const nk = p.nation ? p.nation.toLowerCase() : null;
    const lk = p.league ? p.league.toLowerCase() : null;

    const c = ck ? clubChem(clubs.get(ck) || 0) : 0;
    const n = nk ? nationChem(nations.get(nk) || 0) : 0;
    const l = lk ? leagueChem(leagues.get(lk) || 0) : 0;

    perPlayerChem[p.id] = Math.min(3, c + n + l);
  }

  // ---- Team chem (sum, cap 33)
  const teamChem = Math.min(
    33,
    Object.values(perPlayerChem).reduce((a, b) => a + (b || 0), 0)
  );

  return { perPlayerChem, teamChem };
}