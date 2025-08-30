import { normalizePositions, isValidForSlot } from "../../utils/positions";

/**
 * Robustly extract a player's usable positions:
 * - Use `player.positions` if present
 * - Fallback to DB fields `position` + `altposition`
 */
function getPlayerPositions(p) {
  if (Array.isArray(p?.positions) && p.positions.length) {
    return normalizePositions(p.positions);
  }
  const raw = [];
  if (p?.position) raw.push(p.position);
  if (p?.altposition) raw.push(...String(p.altposition).split(/[,\s;/|]+/));
  return normalizePositions(raw);
}

/** Prefer stable IDs when you have them; fall back to names */
function keyOf(id, name) {
  if (id != null) return `id:${id}`;
  if (name) return `nm:${String(name).toLowerCase()}`;
  return null;
}

/** EA FC25 thresholds */
const chemFromClub   = (n) => (n >= 7 ? 3 : n >= 4 ? 2 : n >= 2 ? 1 : 0);
const chemFromNation = (n) => (n >= 8 ? 3 : n >= 5 ? 2 : n >= 2 ? 1 : 0);
const chemFromLeague = (n) => (n >= 8 ? 3 : n >= 5 ? 2 : n >= 3 ? 1 : 0);

/**
 * Icons/Heroes:
 * - Icon: 3 chem if in position. Contributes +2 nation increments & +1 to ALL leagues.
 * - Hero: 3 chem if in position. Contributes +1 nation increment & +2 to THEIR league.
 * We implement contributions during tallies and clamp personal chem to 3.
 */
export function computeChemistry(placed, formation) {
  const perPlayerChem = {};

  // Tallies from IN-POSITION contributors only
  const clubMap   = new Map();   // key -> count
  const nationMap = new Map();
  const leagueMap = new Map();

  // Keep lists for debug
  const icons  = [];
  const heroes = [];
  const inPosContributors = [];

  // ---- First pass: count entities from players who are IN their slot position
  for (const slot of formation) {
    const p = placed[slot.key];
    if (!p) continue;

    const positions = getPlayerPositions(p);
    const inPos = isValidForSlot(slot.pos, positions);
    if (!inPos) continue;

    // Keys (prefer IDs)
    const ck = keyOf(p.clubId, p.club);
    const nk = keyOf(p.nationId, p.nation);
    const lk = keyOf(p.leagueId, p.league);

    // Base contributions
    if (ck) clubMap.set(ck, (clubMap.get(ck) || 0) + 1);
    if (nk) nationMap.set(nk, (nationMap.get(nk) || 0) + 1);
    if (lk) leagueMap.set(lk, (leagueMap.get(lk) || 0) + 1);

    // Special cards
    const isIcon = !!p.isIcon || String(p.club || "").toUpperCase() === "ICON" || String(p.league || "").toLowerCase() === "icons";
    const isHero = !!p.isHero || String(p.club || "").toUpperCase() === "HERO";

    if (isIcon) {
      icons.push(p.id);
      // +2 nation increments
      if (nk) nationMap.set(nk, (nationMap.get(nk) || 0) + 2);
      // +1 to ALL leagues
      // To approximate “all leagues”, give +1 to this player’s league and add a synthetic key for “all”
      const ALL_LEAGUES_KEY = "league:__all__";
      leagueMap.set(ALL_LEAGUES_KEY, (leagueMap.get(ALL_LEAGUES_KEY) || 0) + 1);
      if (lk) leagueMap.set(lk, (leagueMap.get(lk) || 0) + 1);
    }

    if (isHero) {
      heroes.push(p.id);
      // +1 nation
      if (nk) nationMap.set(nk, (nationMap.get(nk) || 0) + 1);
      // +2 to THEIR league
      if (lk) leagueMap.set(lk, (leagueMap.get(lk) || 0) + 2);
    }

    inPosContributors.push({
      id: p.id,
      name: p.name,
      club: p.club,
      nation: p.nation,
      league: p.league,
    });
  }

  // ---- Second pass: compute each player's personal chem (only if in position)
  for (const slot of formation) {
    const p = placed[slot.key];
    if (!p) continue;

    const positions = getPlayerPositions(p);
    const inPos = isValidForSlot(slot.pos, positions);
    if (!inPos) {
      perPlayerChem[p.id] = 0;
      continue;
    }

    const ck = keyOf(p.clubId, p.club);
    const nk = keyOf(p.nationId, p.nation);
    const lk = keyOf(p.leagueId, p.league);

    // Read current tallies
    const clubC   = ck ? chemFromClub(  clubMap.get(ck) || 0) : 0;
    // Nation also benefits from icon/hero boosts tallied above
    const nationC = nk ? chemFromNation(nationMap.get(nk) || 0) : 0;

    // League takes into account “all leagues” icon bump
    const ALL_LEAGUES_KEY = "league:__all__";
    const leagueCount = (lk ? (leagueMap.get(lk) || 0) : 0) + (leagueMap.get(ALL_LEAGUES_KEY) || 0);
    const leagueC = chemFromLeague(leagueCount);

    let chem = clubC + nationC + leagueC;
    if (chem > 3) chem = 3;
    if (chem < 0) chem = 0;

    // Icons/heroes get 3 if in position regardless of thresholds
    const isIcon = !!p.isIcon || String(p.club || "").toUpperCase() === "ICON" || String(p.league || "").toLowerCase() === "icons";
    const isHero = !!p.isHero || String(p.club || "").toUpperCase() === "HERO";
    if (isIcon || isHero) chem = 3;

    perPlayerChem[p.id] = chem;
  }

  // ---- Team chem
  const teamChem = Math.min(
    33,
    Object.values(perPlayerChem).reduce((a, b) => a + (b || 0), 0)
  );

  // ---- Debug (visible in dev console)
  if (typeof window !== "undefined" && window?.localStorage?.getItem("chem_debug") === "1") {
    const rows = [];
    for (const slot of formation) {
      const p = placed[slot.key];
      if (!p) continue;
      const positions = getPlayerPositions(p);
      rows.push({
        slot: slot.pos,
        id: p.id,
        name: p.name,
        inPos: isValidForSlot(slot.pos, positions),
        club: p.club,
        nation: p.nation,
        league: p.league,
        sz: positions.join(","),
        chem: perPlayerChem[p.id] ?? 0
      });
    }
    // eslint-disable-next-line no-console
    console.log("[CHEM] tallies:", {
      clubs: Object.fromEntries(clubMap.entries()),
      nations: Object.fromEntries(nationMap.entries()),
      leagues: Object.fromEntries(leagueMap.entries()),
      icons,
      heroes,
      inPosContributors,
      rows
    }, " teamChem:", teamChem);
  }

  return { perPlayerChem, teamChem };
}