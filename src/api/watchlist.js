import api from "../axios";

export const getWatchlist = () => api.get("/api/watchlist").then(r => r.data);
export const addWatch = (payload) => api.post("/api/watchlist", payload).then(r => r.data);
export const deleteWatch = (id) => api.delete(`/api/watchlist/${id}`).then(r => r.data);
export const refreshWatch = (id) => api.post(`/api/watchlist/${id}/refresh`).then(r => r.data);
