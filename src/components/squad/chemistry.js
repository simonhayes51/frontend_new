import { isValidForSlot } from "../../utils/positions";

const KEY = (x) => (x ? String(x).trim().toLowerCase() : null);

// FC25 thresholds
const clubChem   = (n) => (n >= 7 ? 3 : n >= 4 ? 2 : n >= 2 ? 1 : 0);
const nationChem = (n) => (n >= 8 ? 3 : n >= 5 ? 2 : n >= 2 ? 1 : 0);
const leagueChem = (n) => (n >= 8 ? 3 : n >= 5 ? 2 : n >= 3 ? 1 : 0);

export function computeChemistry(placed, formation) {
  const clubs   = new Map();
  const nations = new Map();
  const leagues = new Map();

  const add = (map, key, v = 1) => key && map.set(key, (map.get(key) || 0) + v);

  // First pass: team counts from IN-POSITION players
  for (const slot of formation) {
    const p = placed[slot.key];
    if (!p) continue;

    const inPos = isValidForSlot(slot.pos, p.positions);
    if (!inPos) continue;

    const cKey = KEY(p.club);
    const nKey = KEY(p.nation);
    const lKey = KEY(p.league);

    if (p.isIcon) {
      // Icons boost NATION teamwide by +2
      add(nations, nKey, 2);
      continue;
    }
    if (p.isHero) {
      // Heroes boost LEAGUE teamwide by +2
      add(leagues, lKey, 2);
      continue;
    }

    add(clubs, cKey, 1);
    add(nations, nKey, 1);
    add(leagues, lKey, 1);
  }

  // Second pass: individual chem (must be in position)
  const perPlayerChem = {};
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

    const cKey = KEY(p.club);
    const nKey = KEY(p.nation);
    const lKey = KEY(p.league);

    let chem =
      (cKey ? clubChem(clubs.get(cKey) || 0) : 0) +
      (nKey ? nationChem(nations.get(nKey) || 0) : 0) +
      (lKey ? leagueChem(leagues.get(lKey) || 0) : 0);

    perPlayerChem[p.id] = Math.max(0, Math.min(3, chem));
  }

  const teamChem = Math.min(
    33,
    Object.values(perPlayerChem).reduce((a, b) => a + (b || 0), 0)
  );

  return { perPlayerChem, teamChem };
}