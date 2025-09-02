// src/api/tradeFinder.js
const API_BASE = import.meta.env.VITE_API_URL || "";

export async function fetchDeals(params = {}) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    q.set(k, String(v));
  }
  const r = await fetch(`${API_BASE}/api/trade-finder?${q.toString()}`, { credentials: "include" });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return await r.json();
}

export async function explainDeal(deal) {
  const r = await fetch(`${API_BASE}/api/trade-insight`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ deal }),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return await r.json();
}
