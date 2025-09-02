import { apiFetch } from "./http";

export const getWatchlist = async () => {
  const r = await apiFetch("/api/watchlist");
  return r.items || [];
};

export const addWatch = (payload) =>
  apiFetch("/api/watchlist", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const deleteWatch = (id) =>
  apiFetch(`/api/watchlist/${id}`, { method: "DELETE" });

export const refreshWatch = (id) =>
  apiFetch(`/api/watchlist/${id}/refresh`, { method: "POST" });
