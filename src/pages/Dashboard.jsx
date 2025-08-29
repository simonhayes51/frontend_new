import React, { useState, useMemo, useCallback } from "react";
import { useDashboard } from "../context/DashboardContext";
import { useSettings } from "../context/SettingsContext";
import {
  TrendingUp, TrendingDown, Clock, Trophy, LineChart,
  GripVertical, PencilLine, RotateCcw
} from "lucide-react";

const ACCENT = "#91db32";
const cardBase = "bg-gray-900/70 rounded-2xl p-4 border border-gray-800 hover:border-gray-700 transition-colors";
const cardTitle = "text-sm font-medium text-gray-300";
const cardBig = "text-2xl font-bold";
const chip = "inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-300";

export default function Dashboard() {
  // --- Hooks: ALWAYS top-level, never inside conditions/loops ---
  const { netProfit, taxPaid, startingBalance, trades: rawTrades, isLoading, error } = useDashboard();
  const {
    formatCurrency, formatDate, visible_widgets, widget_order,
    include_tax_in_profit, saveSettings, isLoading: settingsLoading
  } = useSettings();

  const [tf, setTf] = useState("7D");           // timeframe selector
  const [editLayout, setEditLayout] = useState(false); // drag mode

  // --- Normalised data ---
  const trades = Array.isArray(rawTrades) ? rawTrades : [];
  const vis = Array.isArray(visible_widgets) ? visible_widgets : [];
  const order = Array.isArray(widget_order) ? widget_order : [];

  // --- Pure helpers (no hooks used inside JSX later) ---
  const filterByTimeframe = useCallback((all, tfKey) => {
    if (tfKey === "ALL") return all;
    const days = tfKey === "7D" ? 7 : 30;
    const cutoff = Date.now() - days * 86400_000;
    return all.filter((t) => {
      const ts = t?.timestamp ? new Date(t.timestamp).getTime() : 0;
      return ts >= cutoff;
    });
  }, []);

  const filteredTrades = useMemo(() => filterByTimeframe(trades, tf), [trades, tf, filterByTimeframe]);

  // Derived numbers (pure, memoised to keep render cheap)
  const totals = useMemo(() => {
    const totalProfit = netProfit ?? 0;
    const totalTax = taxPaid ?? 0;
    const gross = totalProfit + totalTax;
    const taxPct = gross > 0 ? (totalTax / gross) * 100 : 0;

    const wins = filteredTrades.filter((t) => (t?.profit ?? 0) > 0).length;
    const losses = filteredTrades.filter((t) => (t?.profit ?? 0) < 0).length;
    const winRate = filteredTrades.length ? (wins / filteredTrades.length) * 100 : 0;

    const sumProfit = filteredTrades.reduce((s, t) => s + (t?.profit ?? 0), 0);
    const avgProfit = filteredTrades.length ? sumProfit / filteredTrades.length : 0;

    const best = filteredTrades.reduce(
      (acc, t) => {
        const p = t?.profit ?? -Infinity;
        if (p > acc.value) return { value: p, trade: t };
        return acc;
      },
      { value: -Infinity, trade: null }
    );

    const volume = filteredTrades.reduce(
      (s, t) => {
        const qty = t?.quantity ?? 1;
        const buy = (t?.buy ?? 0) * qty;
        const sell = (t?.sell ?? 0) * qty;
        return { buy: s.buy + buy, sell: s.sell + sell, total: s.total + buy + sell };
      },
      { buy: 0, sell: 0, total: 0 }
    );

    // latest (no hooks in JSX later)
    const latest = [...filteredTrades].sort(
      (a, b) => new Date(b?.timestamp || 0) - new Date(a?.timestamp || 0)
    )[0] || null;

    return {
      totalProfit, totalTax, gross, taxPct, wins, losses, winRate, avgProfit, best, volume, latest
    };
  }, [filteredTrades, netProfit, taxPaid]);

  // sparkline data (pure/memoised)
  const spark = useMemo(() => {
    // build 7 daily buckets from ALL trades (not filtered by timeframe)
    const dayKey = (d) => {
      const dt = new Date(d);
      return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()).getTime();
    };
    const map = new Map();
    for (const t of trades) {
      if (!t?.timestamp) continue;
      const key = dayKey(t.timestamp);
      const p = (t?.profit ?? 0) - (include_tax_in_profit ? (t?.ea_tax ?? 0) : 0);
      map.set(key, (map.get(key) ?? 0) + p);
    }
    const series = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const k = dayKey(d);
      series.push({ x: k, y: map.get(k) ?? 0 });
    }
    const w = 160, h = 48;
    const xs = series.map((_, i) => 1 + (i / (series.length - 1)) * (w - 2));
    const ysRaw = series.map((d) => d.y);
    const minY = Math.min(0, ...ysRaw);
    const maxY = Math.max(1, ...ysRaw);
    const scaleY = (v) => (maxY === minY ? h / 2 : 1 + (h - 2) * (1 - (v - minY) / (maxY - minY)));
    const ys = ysRaw.map(scaleY);
    let dAttr = `M ${xs[0]} ${ys[0]}`;
    for (let i = 1; i < xs.length; i++) dAttr += ` L ${xs[i]} ${ys[i]}`;
    return { dAttr, w, h, last: ysRaw[ysRaw.length - 1] };
  }, [trades, include_tax_in_profit]);

  // final ordered keys (pure/memoised) — NOTE: no dependency on a freshly constructed object
  const orderedKeys = useMemo(() => {
    const set = new Set(vis);
    const primary = order.filter((k) => set.has(k));
    for (const k of vis) if (!primary.includes(k)) primary.push(k);
    return primary;
  }, [vis, order]);

  // Drag handlers (pure, not using hooks)
  const onDragStart = useCallback(
    (idx) => (e) => {
      if (!editLayout) return;
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(idx));
    },
    [editLayout]
  );

  const onDragOver = useCallback((e) => {
    if (!editLayout) return;
    e.preventDefault();
  }, [editLayout]);

  const onDrop = useCallback(
    (toIdx) => (e) => {
      if (!editLayout) return;
      e.preventDefault();
      const fromIdx = Number(e.dataTransfer.getData("text/plain"));
      if (!Number.isInteger(fromIdx) || fromIdx === toIdx) return;
      const next = [...orderedKeys];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      const hidden = order.filter((k) => !vis.includes(k));
      saveSettings({ widget_order: [...next, ...hidden] });
    },
    [editLayout, orderedKeys, order, vis, saveSettings]
  );

  const resetLayout = useCallback(() => {
    const hidden = order.filter((k) => !vis.includes(k));
    saveSettings({ widget_order: [...orderedKeys, ...hidden] });
  }, [orderedKeys, order, vis, saveSettings]);

  // --- Loading / error guards AFTER all hooks have been called ---
  if (isLoading || settingsLoading) {
    return (
      <div className="p-4 max-w-6xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-800 rounded w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-900/70 rounded-2xl h-28 border border-gray-800" />
            ))}
          </div>
          <div className="bg-gray-900/70 rounded-2xl h-64 border border-gray-800" />
        </div>
      </div>
    );
  }
  if (error) return <div className="text-red-500 p-4">{String(error)}</div>;

  // --- Stateless widget renderer (no hooks inside) ---
  const renderWidget = (key) => {
    switch (key) {
      case "profit":
        return (
          <div className={cardBase}>
            <div className={cardTitle}>Net Profit</div>
            <div className={cardBig} style={{ color: ACCENT }}>
              {formatCurrency(totals.totalProfit)} coins
            </div>
            {!include_tax_in_profit && (
              <div className="text-xs text-gray-400 mt-1">Before tax: {formatCurrency(totals.gross)} coins</div>
            )}
          </div>
        );
      case "tax":
        return (
          <div className={cardBase}>
            <div className={cardTitle}>EA Tax Paid</div>
            <div className="text-2xl font-bold text-red-400">{formatCurrency(totals.totalTax)} coins</div>
            <div className="text-xs text-gray-400 mt-1">
              {totals.totalTax > 0 ? `${totals.taxPct.toFixed(1)}% of gross` : "No tax yet"}
            </div>
          </div>
        );
      case "balance":
        return (
          <div className={cardBase}>
            <div className={cardTitle}>Starting Balance</div>
            <div className="text-2xl font-bold text-blue-400">{formatCurrency(startingBalance ?? 0)} coins</div>
            {(startingBalance ?? 0) > 0 && totals.totalProfit > 0 && (
              <div className="text-xs text-gray-400 mt-1">
                ROI: {(((totals.totalProfit) / (startingBalance || 1)) * 100).toFixed(1)}%
              </div>
            )}
          </div>
        );
      case "trades":
        return (
          <div className={cardBase}>
            <div className={cardTitle}>Total Trades ({tf})</div>
            <div className="text-2xl font-bold text-purple-400">{filteredTrades.length}</div>
            {filteredTrades.length > 0 && (
              <div className="text-xs text-gray-400 mt-1">
                Avg profit: {formatCurrency(totals.avgProfit)} coins
              </div>
            )}
          </div>
        );
      case "roi":
        return (
          <div className={cardBase}>
            <div className={cardTitle}>ROI</div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold">
                {startingBalance ? (((totals.totalProfit) / (startingBalance || 1)) * 100).toFixed(1) : 0}%
              </div>
              <span className={chip}><Trophy size={12}/> cumulative</span>
            </div>
          </div>
        );
      case "winrate":
        return (
          <div className={cardBase}>
            <div className={cardTitle}>Win Rate ({tf})</div>
            <div className="text-2xl font-bold">{filteredTrades.length ? totals.winRate.toFixed(1) : 0}%</div>
            <div className="text-xs text-gray-400 mt-1">{totals.wins} wins • {totals.losses} losses</div>
          </div>
        );
      case "best_trade":
        return (
          <div className={cardBase}>
            <div className={cardTitle}>Best Trade ({tf})</div>
            <div className="text-2xl font-bold text-green-400">
              {formatCurrency(totals.best.value === -Infinity ? 0 : totals.best.value)}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {totals.best.trade ? `${totals.best.trade.player ?? "Unknown"} (${totals.best.trade.version ?? "—"})` : "—"}
            </div>
          </div>
        );
      case "avg_profit":
        return (
          <div className={cardBase}>
            <div className={cardTitle}>Average Profit / Trade ({tf})</div>
            <div className="text-2xl font-bold" style={{ color: ACCENT }}>
              {formatCurrency(totals.avgProfit)}
            </div>
          </div>
        );
      case "volume":
        return (
          <div className={cardBase}>
            <div className={cardTitle}>Coin Volume ({tf})</div>
            <div className="text-2xl font-bold text-gray-200">{formatCurrency(totals.volume.total)}</div>
            <div className="text-xs text-gray-400 mt-1">
              Buys: {formatCurrency(totals.volume.buy)} • Sells: {formatCurrency(totals.volume.sell)}
            </div>
          </div>
        );
      case "profit_trend":
        return (
          <div className={cardBase}>
            <div className="flex items-center justify-between">
              <div className={cardTitle}>Profit Trend (7D)</div>
              <span className={chip}><LineChart size={12} /> sparkline</span>
            </div>
            <div className="mt-2">
              <svg width={spark.w} height={spark.h}>
                <path d={spark.dAttr} stroke={ACCENT} fill="none" strokeWidth="2" />
              </svg>
              <div className="text-xs text-gray-400 mt-1">
                Last day:{" "}
                <span className={spark.last >= 0 ? "text-green-400 font-medium" : "text-red-400 font-medium"}>
                  {formatCurrency(spark.last ?? 0)}
                </span>
              </div>
            </div>
          </div>
        );
      case "latest_trade":
        return (
          <div className={cardBase}>
            <div className={cardTitle}>Latest Trade</div>
            {totals.latest ? (
              <div className="mt-1">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-semibold">{totals.latest.player ?? "Unknown"}</div>
                  <div className="text-xs text-gray-400">({totals.latest.version ?? "—"})</div>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {formatCurrency(totals.latest.buy ?? 0)} → {formatCurrency(totals.latest.sell ?? 0)}
                  {totals.latest.quantity > 1 && ` (${totals.latest.quantity}x)`} • {totals.latest.platform ?? "Console"}
                </div>
                {(() => {
                  const baseProfit = totals.latest?.profit ?? 0;
                  const tax = totals.latest?.ea_tax ?? 0;
                  const displayProfit = include_tax_in_profit ? baseProfit - tax : baseProfit;
                  const pos = displayProfit >= 0;
                  return (
                    <div className={`mt-1 text-sm font-semibold ${pos ? "text-green-400" : "text-red-400"}`}>
                      {pos ? <TrendingUp size={14} className="inline mr-1" /> : <TrendingDown size={14} className="inline mr-1" />}
                      {pos ? "+" : ""}{formatCurrency(displayProfit)} coins
                    </div>
                  );
                })()}
                <div className="text-xs text-gray-400 mt-1">
                  <Clock size={12} className="inline mr-1" />
                  {totals.latest?.timestamp ? formatDate(totals.latest.timestamp) : "—"}
                </div>
              </div>
            ) : (
              <div className="text-gray-400 text-sm mt-1">No trades yet</div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-400">Last updated: {formatDate(new Date())}</div>
          <div className="w-px h-4 bg-gray-700" />
          <div className="bg-gray-900/70 border border-gray-800 rounded-xl p-1 flex">
            {["7D", "30D", "ALL"].map((k) => (
              <button
                key={k}
                onClick={() => setTf(k)}
                className={`px-3 py-1 text-sm rounded-lg ${tf === k ? "bg-gray-800 text-white" : "text-gray-400 hover:text-gray-200"}`}
                style={tf === k ? { outline: `1px solid ${ACCENT}` } : undefined}
              >
                {k}
              </button>
            ))}
          </div>
          <div className="w-px h-4 bg-gray-700" />
          <button
            onClick={() => setEditLayout((v) => !v)}
            className={`text-sm px-3 py-1 rounded-lg border ${
              editLayout ? "bg-gray-800 border-gray-700" : "bg-gray-900/70 border-gray-800 hover:border-gray-700"
            } flex items-center gap-2`}
            title="Reorder widgets on the dashboard"
          >
            <PencilLine size={14} />
            {editLayout ? "Done" : "Edit layout"}
          </button>
          {editLayout && (
            <button
              onClick={resetLayout}
              className="text-sm px-3 py-1 rounded-lg bg-gray-900/70 border border-gray-800 hover:border-gray-700 flex items-center gap-2"
              title="Reset current layout"
            >
              <RotateCcw size={14} />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Widgets grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8" onDragOver={onDragOver}>
        {orderedKeys.map((key, idx) => (
          <div
            key={key}
            draggable={editLayout}
            onDragStart={onDragStart(idx)}
            onDrop={onDrop(idx)}
            className={`${editLayout ? "cursor-move" : ""} group relative`}
            style={editLayout ? { outline: "1px dashed rgba(145,219,50,0.3)", borderRadius: "1rem" } : undefined}
          >
            {renderWidget(key)}
          </div>
        ))}
      </div>

      {/* Recent Trades */}
      <div className="bg-gray-900/70 rounded-2xl p-6 border border-gray-800">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">Recent Trades</h2>
            <span className={chip}>Showing last {Math.min(filteredTrades.length, 10)} ({tf})</span>
          </div>
          <div className="text-sm">
            <a href="/trades" className="text-gray-300 hover:text-white">View all trades →</a>
          </div>
        </div>

        {filteredTrades.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">No trades logged yet</div>
            <p className="text-sm text-gray-500">Start by adding your first trade to see your progress here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {[...filteredTrades]
              .sort((a, b) => new Date(b?.timestamp || 0) - new Date(a?.timestamp || 0))
              .slice(0, 10)
              .map((trade, i) => {
                const baseProfit = trade?.profit ?? 0;
                const tax = trade?.ea_tax ?? 0;
                const displayProfit = include_tax_in_profit ? baseProfit - tax : baseProfit;
                const pos = displayProfit >= 0;
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 bg-gray-900 rounded-xl border border-gray-800 hover:border-gray-700 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">{trade?.player ?? "Unknown"}</span>
                        <span className="text-sm text-gray-400">({trade?.version ?? "N/A"})</span>
                        {trade?.tag && (
                          <span className="text-xs bg-gray-800 border border-gray-700 px-2 py-1 rounded-full">
                            {trade.tag}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-400 mt-1">
                        {formatCurrency(trade?.buy ?? 0)} → {formatCurrency(trade?.sell ?? 0)}
                        {trade?.quantity > 1 && ` (${trade.quantity}x)`} • {trade?.platform ?? "Console"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-semibold ${pos ? "text-green-400" : "text-red-400"}`}>
                        {pos ? "+" : ""}{formatCurrency(displayProfit)} coins
                      </div>
                      <div className="text-xs text-gray-400">{trade?.timestamp ? formatDate(trade.timestamp) : "—"}</div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <a
          href="/add-trade"
          className="group rounded-2xl border border-gray-800 bg-gray-900/70 p-4 hover:border-gray-700 transition-colors"
          style={{ boxShadow: `inset 0 0 0 1px rgba(145,219,50,0.08)` }}
        >
          <div className="text-sm text-gray-300">Quick Action</div>
          <div className="mt-1 font-semibold">Add Trade</div>
          <div className="text-xs text-gray-500 mt-1">Log a new buy/sell</div>
        </a>
        <a
          href="/pricecheck"
          className="group rounded-2xl border border-gray-800 bg-gray-900/70 p-4 hover:border-gray-700 transition-colors"
        >
          <div className="text-sm text-gray-300">Shortcut</div>
          <div className="mt-1 font-semibold">Price Check</div>
          <div className="text-xs text-gray-500 mt-1">Look up live coin values</div>
        </a>
        <a
          href="/trending"
          className="group rounded-2xl border border-gray-800 bg-gray-900/70 p-4 hover:border-gray-700 transition-colors"
        >
          <div className="text-sm text-gray-300">Explore</div>
          <div className="mt-1 font-semibold">Trending</div>
          <div className="text-xs text-gray-500 mt-1">Top risers & fallers</div>
        </a>
      </div>
    </div>
  );
}
