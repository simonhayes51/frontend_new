// src/api/watchlist.js
import { apiFetch } from "./http";

function normalizePlatform(p) {
  const s = (p || "").toLowerCase();
  if (s === "console" || s === "ps" || s === "playstation") return "ps";
  if (s === "xbox" || s === "xb") return "xbox";
  if (s === "pc" || s === "origin") return "pc";
  return "ps";
}

export async function addWatch({ card_id, player_name, version, platform, notes }) {
  return apiFetch(`/api/watchlist`, {
    method: "POST",
    body: JSON.stringify({
      card_id,
      player_name,
      version,
      platform: normalizePlatform(platform),
      notes,
    }),
  });
}
