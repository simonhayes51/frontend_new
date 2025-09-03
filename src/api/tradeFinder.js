// src/api/tradeFinder.js
import api from "../axios"; // ✅ Fixed import path - axios is in src/axios.js

// params example:
// { platform:"console", timeframe:24, budget_max:150000, min_profit:1500,
//   min_margin_pct:8, rating_min:75, rating_max:93, leagues:"", nations:"", positions:"" }
export async function fetchTradeFinder(params) {
  // Debug logging
  console.log('🔍 fetchTradeFinder called with:', params);
  console.log('🔍 Using axios baseURL:', api.defaults.baseURL);
  
  // Ensure numeric fields are numbers to avoid 422s
  const clean = {
    ...params,
    timeframe: Number(params.timeframe),
    budget_max: Number(params.budget_max),
    min_profit: Number(params.min_profit),
    min_margin_pct: Number(params.min_margin_pct),
    rating_min: Number(params.rating_min),
    rating_max: Number(params.rating_max),
  };
  
  console.log('🔍 Making request to:', `${api.defaults.baseURL}/api/trade-finder`);
  
  const { data } = await api.get("/api/trade-finder", { params: clean });
  // API may return {items, meta} or a raw array; normalize to array for the page
  return Array.isArray(data) ? data : (data.items ?? []);
}

export async function fetchDealInsight(deal) {
  // Minimal body that the API can use to explain the pick
  const body = {
    player_id: deal.player_id ?? deal.pid ?? deal.card_id,
    platform: deal.platform,
    timeframe_hours: deal.timeframe_hours ?? deal.timeframe ?? 24,
    current_price: deal.current_price,
    expected_sell: deal.expected_sell,
  };
  
  console.log('🔍 Making insight request to:', `${api.defaults.baseURL}/api/trade-finder/explain`);
  
  const { data } = await api.post("/api/trade-finder/explain", body);
  return data;
}
