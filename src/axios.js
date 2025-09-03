// src/pages/TradeFinder.jsx
import React, { useEffect, useMemo, useState } from "react";
import { RefreshCcw, Info, PlusCircle, AlertTriangle } from "lucide-react";
import { fetchTradeFinder as fetchDeals, fetchDealInsight as explainDeal } from "../api/tradeFinder";
import { addWatch as addToWatchlist } from "../api/watchlist";

// Debug logging - remove this after fixing
console.log('🔍 TradeFinder Environment Check:');
console.log('  VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('  MODE:', import.meta.env.MODE);
console.log('  All env vars:', import.meta.env);

const cls = (...xs) => xs.filter(Boolean).join(" ");

const NumberInput = ({ label, value, onChange, min, step = 100 }) => (
  <label className="flex flex-col gap-1 text-sm">
    <span className="text-gray-300">{label}</span>
    <input
      type="number"
      min={min}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="bg-zinc-900/60 border border-zinc-800 rounded-xl px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-lime-500"
    />
  </label>
);

const Chip = ({ children }) => (
  <span className="px-2 py-0.5 rounded-full text-xs bg-zinc-800 border border-zinc-700">{children}</span>
);

function DealCard({ deal, onExplain, onQuickAdd }) {
  return (
    <div className="rounded-2xl bg-zinc-900/70 border border-zinc-800 p-4 flex gap-4 items-center shadow-sm">
      <img
        src={deal.image || deal.image_url || "/img/card-placeholder.png"}
        alt="card"
        className="w-14 h-20 object-cover rounded-lg"
      />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <div className="text-lg text-gray-100 font-semibold">
            {deal.name} {deal.rating ? <span className="text-gray-400">{deal.rating}</span> : null}
          </div>
          <div className="text-xs text-gray-400">{[deal.position, deal.league].filter(Boolean).join(" • ")}</div>
        </div>
        <div className="mt-1 grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
          <Tile label="Current" val={deal.current_price} />
          <Tile label="Target Sell" val={deal.expected_sell} />
          <Tile label="Profit (net)" val={deal.est_profit_after_tax} accent />
          <div className="bg-zinc-950/50 rounded-xl p-2 border border-zinc-800">
            <div className="text-gray-400">Margin</div>
            <div className="text-gray-100 font-medium">
              {deal.margin_pct != null ? `${Number(deal.margin_pct).toFixed(2)}%` : "—"}
            </div>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {deal.tags?.map((t) => (
            <Chip key={t}>{t}</Chip>
          ))}
          {deal.vol_score != null && <Chip>Vol {Number(deal.vol_score).toFixed(3)}</Chip>}
          {deal.timeframe_hours ? (
            <Chip>
              {deal.timeframe_hours}h {deal.change_pct_window >= 0 ? "▲" : "▼"}{" "}
              {Number(deal.change_pct_window ?? 0).toFixed(1)}%
            </Chip>
          ) : null}
          {typeof deal.seasonal_shift === "number" && Math.abs(deal.seasonal_shift) >= 0.5 && (
            <Chip>Seasonal {deal.seasonal_shift > 0 ? "+" : ""}
              {Number(deal.seasonal_shift).toFixed(1)}%</Chip>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <button
          onClick={onExplain}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-sm"
        >
          <Info size={16} /> Why this deal?
        </button>
        <button
          onClick={onQuickAdd}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-lime-600 bg-lime-600/10 hover:bg-lime-600/20 text-sm text-lime-400"
        >
          <PlusCircle size={16} /> Quick Add
        </button>
      </div>
    </div>
  );
}

function Tile({ label, val, accent = false }) {
  return (
    <div className="bg-zinc-950/50 rounded-xl p-2 border border-zinc-800">
      <div className="text-gray-400">{label}</div>
      <div className={cls("font-medium", accent ? "text-lime-400" : "text-gray-100")}>
        {val != null ? `${Number(val).toLocaleString()}c` : "—"}
      </div>
    </div>
  );
}

export default function TradeFinder() {
  const [platform, setPlatform] = useState("console");
  const [timeframe, setTimeframe] = useState(24);
  const [budgetMax, setBudgetMax] = useState(150000);
  const [minProfit, setMinProfit] = useState(1500);
  const [minMargin, setMinMargin] = useState(8);
  const [ratingMin, setRatingMin] = useState(75);
  const [ratingMax, setRatingMax] = useState(93);
  const [leagues, setLeagues] = useState("");
  const [nations, setNations] = useState("");
  const [positions, setPositions] = useState("");

  const [loading, setLoading] = useState(false);
  const [deals, setDeals] = useState([]);
  const [error, setError] = useState("");
  const [relaxed, setRelaxed] = useState(false);

  const params = useMemo(
    () => ({
      platform,
      timeframe,
      budget_max: budgetMax,
      min_profit: minProfit,
      min_margin_pct: minMargin,
      rating_min: ratingMin,
      rating_max: ratingMax,
      leagues,
      nations,
      positions,
    }),
    [platform, timeframe, budgetMax, minProfit, minMargin, ratingMin, 
