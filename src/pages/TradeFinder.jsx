// src/pages/TradeFinder.jsx
import React, { useEffect, useMemo, useState } from "react";
import { RefreshCcw, Info, PlusCircle, AlertTriangle } from "lucide-react";
import {
  fetchTradeFinder as fetchDeals,
  fetchDealInsight as explainDeal,
} from "../api/tradeFinder";
import { addWatch as addToWatchlist } from "../api/watchlist"; // ✅

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
  <span className="px-2 py-0.5 rounded-full text-xs bg-zinc-800 border border-zinc-700">
    {children}
  </span>
);

function DealCard({ deal, onExplain, onQuickAdd }) {
  return (
    <div className="rounded-2xl bg-zinc-900/70 border border-zinc-800 p-4 flex gap-4 items-center shadow-sm">
      <img
        src={deal.image_url || deal.image || "/img/card-placeholder.png"}
        alt="card"
        className="w-14 h-20 object-cover rounded-lg"
      />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <div className="text-lg text-gray-100 font-semibold">
            {deal.name}{" "}
            <span className="text-gray-400">{deal.rating ?? ""}</span>
          </div>
          <div className="text-xs text-gray-400">
            {deal.position || ""} • {deal.league || ""}
          </div>
        </div>
        <div className="mt-1 grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
          <div className="bg-zinc-950/50 rounded-xl p-2 border border-zinc-800">
            <div className="text-gray-400">Current</div>
            <div className="text-gray-100 font-medium">
              {Number(deal.current_price ?? 0).toLocaleString()}c
            </div>
          </div>
          <div className="bg-zinc-950/50 rounded-xl p-2 border border-zinc-800">
            <div className="text-gray-400">Target Sell</div>
            <div className="text-gray-100 font-medium">
              {Number(deal.expected_sell ?? 0).toLocaleString()}c
            </div>
          </div>
          <div className="bg-zinc-950/50 rounded-xl p-2 border border-zinc-800">
            <div className="text-gray-400">Profit (net)</div>
            <div className="text-lime-400 font-semibold">
              {Number(deal.est_profit_after_tax ?? 0).toLocaleString()}c
            </div>
          </div>
          <div className="bg-zinc-950/50 rounded-xl p-2 border border-zinc-800">
            <div className="text-gray-400">Margin</div>
            <div className="text-gray-100 font-medium">
              {Number(deal.margin_pct ?? 0).toFixed(2)}%
            </div>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {deal.tags?.map((t) => <Chip key={t}>{t}</Chip>)}
          {typeof deal.vol_score === "number" && (
            <Chip>Vol {deal.vol_score.toFixed(3)}</Chip>
          )}
          {typeof deal.change_pct_window === "number" && (
            <Chip>
              {deal.timeframe_hours}h{" "}
              {deal.change_pct_window >= 0 ? "▲" : "▼"}{" "}
              {deal.change_pct_window.toFixed(1)}%
            </Chip>
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

export default function TradeFinder() {
  const [platform, setPlatform] = useState("console");
  const [timeframe, setTimeframe] = useState(24);
  const [budgetMax, setBudgetMax] = useState(150000);
  const [minProfit, setMinProfit] = useState(1500);
  const [minMargin, setMinMargin] = useState(8);
  const [ratingMin, setRatingMin] = useState(75);
  const [ratingMax, setRatingMax] = useState(93);

  const [loading, setLoading] = useState(false);
  const [deals, setDeals] = useState([]);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);

  const params = useMemo(
    () => ({
      platform,
      timeframe,
      budget_max: budgetMax,
      min_profit: minProfit,
      min_margin_pct: minMargin,
      rating_min: ratingMin,
      rating_max: ratingMax,
    }),
    [platform, timeframe, budgetMax, minProfit, minMargin, ratingMin, ratingMax]
  );

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await fetchDeals(params);
      setDeals(Array.isArray(data) ? data : data?.items || []);
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(params)]);

  const onExplain = async (deal) => {
    try {
      const r = await explainDeal(deal);
      setModal({ title: `Why ${deal.name}?`, body: r.explanation });
    } catch {
      setModal({
        title: `Why ${deal.name}?`,
        body: "Could not fetch explanation.",
      });
    }
  };

  const onQuickAdd = async (deal) => {
    try {
      const platForWatch = platform === "pc" ? "pc" : "ps"; // treat console as PS for now
      await addToWatchlist({
        player_name: deal.name,
        card_id: deal.card_id || deal.pid,
        version: deal.version,
        platform: platForWatch,
        notes: `TradeFinder target: buy ~${deal.current_price}c, sell ~${deal.expected_sell}c`,
      });
      setModal({
        title: "Added to Watchlist",
        body: `${deal.name} added. Watching at ~${Number(
          deal.current_price || 0
        ).toLocaleString()}c.`,
      });
    } catch {
      setModal({ title: "Watchlist", body: "Could not add to watchlist." });
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-100">Trade Finder</h1>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-sm"
        >
          <RefreshCcw size={16} /> Refresh
        </button>
      </div>

      <div className="grid lg:grid-cols-6 md:grid-cols-3 grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-300">Platform</span>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="bg-zinc-900/60 border border-zinc-800 rounded-xl px-3 py-2 text-gray-100"
          >
            <option value="console">Console</option>
            <option value="pc">PC</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-300">Timeframe</span>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(Number(e.target.value))}
            className="bg-zinc-900/60 border border-zinc-800 rounded-xl px-3 py-2 text-gray-100"
          >
            <option value={4}>4h</option>
            <option value={24}>24h</option>
          </select>
        </label>
        <NumberInput label="Budget Max" value={budgetMax} onChange={setBudgetMax} min={0} />
        <NumberInput label="Min Profit (net)" value={minProfit} onChange={setMinProfit} min={0} />
        <NumberInput label="Min Margin %" value={minMargin} onChange={setMinMargin} min={0} step={0.5} />
        <div className="flex gap-3">
          <NumberInput label="Rating Min" value={ratingMin} onChange={setRatingMin} min={40} step={1} />
          <NumberInput label="Rating Max" value={ratingMax} onChange={setRatingMax} min={40} step={1} />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-amber-400 text-sm">
          <AlertTriangle size={16} /> {String(error)}
        </div>
      )}

      <div className="mt-2 grid gap-3">
        {loading && <div className="text-gray-400">Loading deals…</div>}
        {!loading && deals.length === 0 && (
          <div className="text-gray-400">
            No deals match your filters right now. Try widening the filters.
          </div>
        )}
        {deals.map((d) => (
          <DealCard
            key={`${d.card_id || d.pid}-${d.platform}-${timeframe}`}
            deal={d}
            onExplain={() => onExplain(d)}
            onQuickAdd={() => onQuickAdd(d)}
          />
        ))}
      </div>

      {modal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
          onClick={() => setModal(null)}
        >
          <div
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-lg text-gray-100 font-semibold mb-2">
              {modal.title}
            </div>
            <div className="text-gray-200 whitespace-pre-wrap">{modal.body}</div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setModal(null)}
                className="px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}