// src/api/watchlist.js
import { apiFetch } from "./http";

function normalizePlatform(p) {
  const s = (p || "").toLowerCase();
  if (s === "console" || s === "ps" || s === "playstation") return "ps";
  if (s === "xbox" || s === "xb") return "xbox";
  if (s === "pc" || s === "origin") return "pc";
  return "ps";
}

/** List all watchlist items for the current user. Returns an array. */
export async function getWatchlist() {
  const res = await apiFetch("/api/watchlist");
  // backend returns { ok: true, items: [...] } (or empty array on error paths)
  return Array.isArray(res?.items) ? res.items : [];
}

/** Add an item to the watchlist. */
export async function addWatch({ card_id, player_name, version, platform, notes }) {
  return apiFetch("/api/watchlist", {
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

/** Delete a watchlist entry by id. */
export async function deleteWatch(id) {
  return apiFetch(`/api/watchlist/${id}`, { method: "DELETE" });
}

/** Refresh a single watchlist entry (fetches live price & updates). */
export async function refreshWatch(id) {
  return apiFetch(`/api/watchlist/${id}/refresh`, { method: "POST" });
}
