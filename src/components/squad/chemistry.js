import { isValidForSlot } from "../../utils/positions";

const KEY = (x) => (x ? String(x).trim().toLowerCase() : null);

// EA/FC25 thresholds
const clubChem   = (n) => (n >= 7 ? 3 : n >= 4 ? 2 : n >= 2 ? 1 : 0);
const nationChem = (n) => (n >= 8 ? 3 : n >= 5 ? 2 : n >= 2 ? 1 : 0);
const leagueChem = (n) => (n >= 8 ? 3 : n >= 5 ? 2 : n >= 3 ? 1 : 0);

/**
 * Returns:
 * {
 *   perPlayerChem: { [playerId]: 0..3 },
 *   teamChem: 0..33,
 *   __debug: { clubs, nations, leagues, rows: [...], inPosContributors: [...], icons: [...], heroes: [...] }
 * }
 */
export function computeChemistry(placed, formation) {
  const clubs   = new Map();
  const nations = new Map();
  const leagues = new Map();

  const add = (map, key, v = 1) => key && map.set(key, (map.get(key) || 0) + v);

  const rows = []; // debug rows
  const icons  = [];
  const heroes = [];
  const inPosContributors = [];

  // First pass: team tallies from IN-POSITION players only
  for (const slot of formation) {
    const p = placed[slot.key];
    if (!p) continue;

    const inPos = isValidForSlot(slot.pos, p.positions);
    const cKey = KEY(p.club);
    const nKey = KEY(p.nation);
    const lKey = KEY(p.league);

    rows.push({
      slot: slot.pos,
      id: p.id,
      name: p.name,
      inPos,
      club: p.club,
      nation: p.nation,
      league: p.league,
      isIcon: !!p.isIcon,
      isHero: !!p.isHero,
      positions: Array.isArray(p.positions) ? p.positions.join(", ") : String(p.positions || "")
    });

    if (!inPos) continue;

    if (p.isIcon) {
      // Icons give +2 to their nation tally, always 3/3 if in position
      add(nations, nKey, 2);
      icons.push(p.name);
      continue;
    }
    if (p.isHero) {
      // Heroes give +2 to their league tally, always 3/3 if in position
      add(leagues, lKey, 2);
      heroes.push(p.name);
      continue;
    }

    add(clubs, cKey, 1);
    add(nations, nKey, 1);
    add(leagues, lKey, 1);
    inPosContributors.push(p.name);
  }

  // Second pass: individual chem (must be IN-POSITION)
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

  // Pretty debug objects
  const mapToObj = (m) => {
    const o = {};
    for (const [k, v] of m.entries()) o[k || "(null)"] = v;
    return o;
  };

  const __debug = {
    clubs: mapToObj(clubs),
    nations: mapToObj(nations),
    leagues: mapToObj(leagues),
    rows,
    inPosContributors,
    icons,
    heroes
  };

  // Always log once per compute
  // eslint-disable-next-line no-console
  console.table(rows);
  // eslint-disable-next-line no-console
  console.log("[CHEM] tallies:", __debug, "teamChem:", teamChem);

  return { perPlayerChem, teamChem, __debug };
}