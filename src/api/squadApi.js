import { normalizePositions } from "../utils/positions";

const API_BASE = import.meta.env.VITE_API_URL || "";

/**
 * Detect Icon/Hero from your DB strings.
 * Icon: club === 'ICON' or league === 'Icons'
 * Hero: club === 'Hero' or league contains 'Hero'
 */
function detectSpecial(p) {
  const club = String(p.club || "").toLowerCase();
  const league = String(p.league || "").toLowerCase();
  const isIcon = club === "icon" || league === "icons" || league === "icon";
  const isHero = club === "hero" || league.includes("hero");
  return { isIcon, isHero };
}

/** Build positions from `position` + `altposition` (comma/space/pipe delimited). */
function buildPositions(p) {
  const extras = Array.isArray(p.altposition)
    ? p.altposition
    : (p.altposition || "").split(/[,\s;\/|]+/).filter(Boolean);
  return normalizePositions([p.position, ...extras]);
}

/** Server search, optional slotPos filter. */
export async function searchPlayers(query, slotPos = null) {
  const q = (query || "").trim();
  const posParam = slotPos ? `&pos=${encodeURIComponent(slotPos)}` : "";
  if (!q && !slotPos) return [];

  const r = await fetch(
    `${API_BASE}/api/search-players?q=${encodeURIComponent(q)}${posParam}`,
    { credentials: "include" }
  );
  if (!r.ok) return [];

  const { players = [] } = await r.json();
  return players.map((p) => {
    const { isIcon, isHero } = detectSpecial(p);
    return {
      id: Number(p.card_id),
      card_id: Number(p.card_id),
      name: p.name || "Unknown Player",
      rating: Number(p.rating) || 0,
      club: p.club || null,
      league: p.league || null,
      nation: p.nation || null,
      clubId: null,
      leagueId: null,
      nationId: null,
      positions: buildPositions(p),   // ✅ critical for chem
      image_url: p.image_url || null,
      price: typeof p.price === "number" ? p.price : null,
      isIcon,
      isHero,
    };
  });
}