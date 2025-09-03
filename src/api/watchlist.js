// src/api/watchlist.js
import api from "./axios";

// All functions return JSON payloads from the API host (VITE_API_URL)
export async function getWatchlist() {
  const { data } = await api.get("/api/watchlist");
  return data;
}

export async function addWatch(payload) {
  // payload: { player_name, card_id, version?, platform, notes? }
  const { data } = await api.post("/api/watchlist", payload);
  return data;
}

export async function deleteWatch(id) {
  const { data } = await api.delete(`/api/watchlist/${id}`);
  return data;
}

export async function refreshWatch(id) {
  const { data } = await api.post(`/api/watchlist/${id}/refresh`);
  return data;
}