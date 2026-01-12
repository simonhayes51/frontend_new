export async function fetchCompare({ ids, platform = "ps", includePC = true, includeSales = true }) {
  const params = new URLSearchParams({ ids, platform, include_pc: String(includePC), include_sales: String(includeSales) });
  const res = await fetch(`/api/player-compare?${params.toString()}`, {
    credentials: "include",
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => "Failed to fetch compare data");
    throw new Error(msg || "Failed to fetch compare data");
  }
  return res.json();
}

export async function addToWatchlist({ cardId, name, version = "", platform = "ps", notes = "" }) {
  const payload = {
    card_id: Number(cardId),
    player_name: name,
    version,
    platform,
    notes,
  };
  const res = await fetch(`/api/watchlist`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (res.status === 401) throw new Error("Please log in first");
  if (!res.ok) throw new Error("Failed to add to watchlist");
  return res.json();
}

export const platformLabel = (p) => (p === "ps" ? "PlayStation" : p === "xbox" ? "Xbox" : "PC");

export function normalizePlatform(input) {
  const p = (input || "").toLowerCase();
  if (["ps", "playstation", "console"].includes(p)) return "ps";
  if (["xbox", "xb"].includes(p)) return "xbox";
  if (["pc", "origin"].includes(p)) return "pc";
  return "ps";
}
