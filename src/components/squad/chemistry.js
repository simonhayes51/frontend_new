// src/components/squad/chemistry.js
import { isValidForSlot, normalizePositions } from "../../utils/positions";

/**
 * Safe key for entities. Prefer numeric IDs, fall back to a lowercased name.
 */
function k(id, name) {
  if (id != null) return `id:${id}`;
  if (name) return `nm:${String(name).toLowerCase()}`;
  return null;
}

/**
 * FC25 thresholds (per EA):
 * Club:   2/4/7 → +1/+2/+3
 * Nation: 2/5/8 → +1/+2/+3
 * League: 3/5/8 → +1/+2/+3
 */
const clubChem   = (n) => (n >= 7 ? 3 : n >= 4 ? 2 : n >= 2 ? 1 : 0);
const nationChem = (n) => (n >= 8 ? 3 : n >= 5 ? 2 : n >= 2 ? 1 : 0);
const leagueChem = (n) => (n >= 8 ? 3 : n >= 5 ? 2 : n >= 3 ? 1 : 0);

/**
 * Apply Icon/Hero *tally* boosts per EA (only if player is IN POSITION):
 *  - ICON:
 *    • counts as +2 toward their nation thresholds
 *    • counts as +1 toward *every* league (global league glue)
 *  - HERO:
 *    • counts as +2 toward their *own* league
 *    • counts as +1 toward their nation
 *
 * Note: These are *contributions to tallies*, not the player's own chem.
 * The player's own chem still comes from the final tallies and the thresholds.
 */
function applySpecialTallies(p, maps) {
  const { clubMap, nationMap, leagueMap } = maps;

  // Normal +1 base tallies will be added outside; here we only add the *extra* hero/icon bumps.
  if (p.isIcon) {
    // +2 to nation
    const nk = k(p.nationId, p.nation);
    if (nk) nationMap.set(nk, (nationMap.get(nk) || 0) + 2);

    // +1 to ALL leagues (global)
    // Represent "global" as a synthetic key so every league benefits equally:
    // The simple way is to add +1 to the player's own league, but EA makes Icons universal glue.
    // We'll model universal league glue via a special symbol that will be merged into every league later.
    leagueMap.set("__ICON_GLOBAL__", (leagueMap.get("__ICON_GLOBAL__") || 0) + 1);
  }

  if (p.isHero) {
    // +2 to their league
    const lk = k(p.leagueId, p.league);
    if (lk) leagueMap.set(lk, (leagueMap.get(lk) || 0) + 2);

    // +1 to their nation
    const nk = k(p.nationId, p.nation);
    if (nk) nationMap.set(nk, (nationMap.get(nk) || 0) + 1);
  }
}

/**
 * Merge any special "global" league glue contributed by Icons into all concrete league keys.
 */
function spreadIconGlobalLeagueGlue(leagueMap) {
  const g = leagueMap.get("__ICON_GLOBAL__");
  if (!g) return;
  leagueMap.delete("__ICON_GLOBAL__");

  // Add +g to every *existing* league key
  const entries = Array.from(leagueMap.entries());
  for (const [key, val] of entries) {
    // only touch real league keys
    if (!key.startsWith("id:") && !key.startsWith("nm:")) continue;
    leagueMap.set(key, val + g);
  }
}

/**
 * placed:   { [slotKey]: player|null }
 * formation: array of { key, pos }
 */
export function computeChemistry(placed, formation) {
  const clubMap   = new Map();
  const nationMap = new Map();
  const leagueMap = new Map();

  const perPlayerChem = {};

  // ---------- FIRST PASS: build tallies for IN-POSITION players ----------
  for (const slot of formation) {
    const p = placed[slot.key];
    if (!p) continue;

    // Guard positions from DB/enrichment
    const playerPositions = normalizePositions(p.positions?.length ? p.positions : [p.position, p.altposition].filter(Boolean));
    const inPos = isValidForSlot(slot.pos, playerPositions);
    if (!inPos) continue;

    const ck = k(p.clubId, p.club);
    const nk = k(p.nationId, p.nation);
    const lk = k(p.leagueId, p.league);

    // Base +1 tallies
    if (ck) clubMap.set(ck, (clubMap.get(ck) || 0) + 1);
    if (nk) nationMap.set(nk, (nationMap.get(nk) || 0) + 1);
    if (lk) leagueMap.set(lk, (leagueMap.get(lk) || 0) + 1);

    // Special Icon/Hero extra tallies
    applySpecialTallies(p, { clubMap, nationMap, leagueMap });
  }

  // Spread any Icon global league glue
  spreadIconGlobalLeagueGlue(leagueMap);

  // ---------- SECOND PASS: compute each player's chem (only if IN POSITION) ----------
  for (const slot of formation) {
    const p = placed[slot.key];
    if (!p) continue;

    const playerPositions = normalizePositions(p.positions?.length ? p.positions : [p.position, p.altposition].filter(Boolean));
    const inPos = isValidForSlot(slot.pos, playerPositions);
    if (!inPos) {
      perPlayerChem[p.id] = 0;
      continue;
    }

    const ck = k(p.clubId, p.club);
    const nk = k(p.nationId, p.nation);
    const lk = k(p.leagueId, p.league);

    const cC = ck ? clubChem(clubMap.get(ck) || 0)     : 0;
    const nC = nk ? nationChem(nationMap.get(nk) || 0) : 0;
    const lC = lk ? leagueChem(leagueMap.get(lk) || 0) : 0;

    let chem = cC + nC + lC;
    if (chem > 3) chem = 3;
    if (chem < 0) chem = 0;

    // Icons/Heroes still follow the same personal chem cap of 3;
    // their boosts are in the tallies (above), not here.

    perPlayerChem[p.id] = chem;
  }

  // ---------- TEAM CHEM ----------
  const teamChem = Math.min(
    33,
    Object.values(perPlayerChem).reduce((a, b) => a + (b || 0), 0)
  );

  return { perPlayerChem, teamChem };
}
