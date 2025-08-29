// Dashboard.jsx – widgets + restyle + timeframe filter (keeps Settings integration)
import React, { useMemo, useState } from "react";
import { useDashboard } from "../context/DashboardContext";
import { useSettings } from "../context/SettingsContext";
import { TrendingUp, TrendingDown, Clock, Trophy, LineChart } from "lucide-react";

/** Accent + utility classes (lime accent) */
const ACCENT = "#91db32"; // requested lime
const cardBase =
  "bg-gray-900/70 rounded-2xl p-4 border border-gray-800 hover:border-gray-700 transition-colors";
const cardTitle = "text-sm font-medium text-gray-300";
const cardBig = "text-2xl font-bold";
const chip =
  "inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-300";

const Dashboard = () => {
  // ==== Contexts ====
  const {
    netProfit,
    taxPaid,
    startingBalance,
    trades: rawTrades,
    isLoading,
    error,
  } = useDashboard();

  const {
    formatCurrency,
    formatDate,
    calculateProfit, // kept in case you use it elsewhere
    visible_widgets: rawWidgets,
    include_tax_in_profit,
    isLoading: settingsLoading,
  } = useSettings();

  // ==== Safe fallbacks ====
  const trades = Array.isArray(rawTrades) ? rawTrades : [];
  const visible_widgets = Array.isArray(rawWidgets) ? rawWidgets : [];

  // ==== Local timeframe filter ====
  const [tf, setTf] = useState("7D"); // 7D | 30D | ALL

  const filteredTrades = useMemo(() => {
    if (tf === "ALL") return trades;
    const days = tf === "7D" ? 7 : 30;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return trades.filter((t) => {
      const ts = t?.timestamp ? new Date(t.timestamp).getTime() : 0;
      return ts >= cutoff;
    });
  }, [trades, tf]);

  // ==== Derived numbers ====
  const totalProfit = (netProfit ?? 0);
  const totalTax = (taxPaid ?? 0);
  const gross = totalProfit + totalTax;
  const taxPct = gross > 0 ? (totalTax / gross) * 100 : 0;

  // From filtered trades
  const wins = filteredTrades.filter((t) => (t?.profit ?? 0) > 0).length;
  const losses = filteredTrades.filter((t) => (t?.profit ?? 0) < 0).length;
  const winRate = filteredTrades.length ? (wins / filteredTrades.length) * 100 : 0;
  const avgProfit = filteredTrades.length
    ? (filteredTrades.reduce((s, t) => s + (t?.profit ?? 0), 0) / filteredTrades.length)
    : 0;

  const best = filteredTrades.reduce(
    (acc, t) => {
      const p = t?.profit ?? -Infinity;
      if (p > acc.value) return { value: p, trade: t };
      return acc;
    },
    { value: -Infinity, trade: null }
  );

  const volume = filteredTrades.reduce((s, t) => {
    const qty = t?.quantity ?? 1;
    const buy = (t?.buy ?? 0) * qty;
    const sell = (t?.sell ?? 0) * qty;
    return { buy: s.buy + buy, sell: s.sell + sell, total: s.total + buy + sell };
  }, { buy: 0, sell: 0, total: 0 });

  // Streak (current consecutive winners)
  const streak = useMemo(() => {
    let count = 0;
    const byTimeDesc = [...filteredTrades].sort(
      (a, b) => new Date(b?.timestamp || 0) - new Date(a?.timestamp || 0)
    );
    for (const t of byTimeDesc) {
      const p = t?.profit ?? 0;
      if (p > 0) count += 1;
      else break;
    }
    return count;
  }, [filteredTrades]);

  // Profit by day (for 7D sparkline)
  const dailySeries = useMemo(() => {
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
    // last 7 days
    const out = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const k = dayKey(d);
      out.push({ x: k, y: map.get(k) ?? 0 });
    }
    return out;
  }, [trades, include_tax_in_profit]);

  // Sparkline path generator (simple)
  const sparklinePath = useMemo(() => {
    if (!dailySeries.length) return "";
    const w = 160;
    const h = 48;
    const xs = dailySeries.map((d, i) => (i / (dailySeries.length - 1)) * (w - 2)) // padding 1px each side
      .map((v) => v + 1);
    const ysRaw = dailySeries.map((d) => d.y);
    const minY = Math.min(0, ...ysRaw);
    const maxY = Math.max(1, ...ysRaw); // avoid div-by-zero
    const scaleY = (v) => {
      if (maxY === minY) return h / 2;
      // invert so larger is higher visually
      return 1 + (h - 2) * (1 - (v - minY) / (maxY - minY));
    };
    const ys = ysRaw.map(scaleY);
    let d = `M ${xs[0]} ${ys[0]}`;
    for (let i = 1; i < xs.length; i++) {
      d += ` L ${xs[i]} ${ys[i]}`;
    }
    return { d, w, h, minY, maxY, last: ysRaw[ysRaw.length - 1] };
  }, [dailySeries]);

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

  // ===== Widget definitions =====
  const widgets = {
    profit: (
      <div className={cardBase}>
        <div className={`${cardTitle}`}>Net Profit</div>
        <div className={`${cardBig}`} style={{ color: ACCENT }}>
          {formatCurrency(totalProfit)} coins
        </div>
        {!include_tax_in_profit && (
          <div className="text-xs text-gray-400 mt-1">
            Before tax: {formatCurrency(gross)} coins
          </div>
        )}
      </div>
    ),
    tax: (
      <div className={cardBase}>
        <div className={cardTitle}>EA Tax Paid</div>
        <div className="text-2xl font-bold text-red-400">
          {formatCurrency(totalTax)} coins
        </div>
        <div className="text-xs text-gray-400 mt-1">
          {totalTax > 0 ? `${taxPct.toFixed(1)}% of gross` : "No tax yet"}
        </div>
      </div>
    ),
    balance: (
      <div className={cardBase}>
        <div className={cardTitle}>Starting Balance</div>
        <div className="text-2xl font-bold text-blue-400">
          {formatCurrency(startingBalance ?? 0)} coins
        </div>
        {(startingBalance ?? 0) > 0 && totalProfit > 0 && (
          <div className="text-xs text-gray-400 mt-1">
            ROI: {(((totalProfit) / (startingBalance || 1)) * 100).toFixed(1)}%
          </div>
        )}
      </div>
    ),
    trades: (
      <div className={cardBase}>
        <div className={cardTitle}>Total Trades ({tf})</div>
        <div className="text-2xl font-bold text-purple-400">{filteredTrades.length}</div>
        {filteredTrades.length > 0 && (
          <div className="text-xs text-gray-400 mt-1">
            Avg profit: {formatCurrency(avgProfit)} coins
          </div>
        )}
      </div>
    ),
    roi: (
      <div className={cardBase}>
        <div className={cardTitle}>ROI</div>
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold">
            {startingBalance
              ? (((totalProfit) / (startingBalance || 1)) * 100).toFixed(1)
              : 0}
            %
          </div>
          <span className={chip}><Trophy size={12}/> cumulative</span>
        </div>
      </div>
    ),
    winrate: (
      <div className={cardBase}>
        <div className={cardTitle}>Win Rate ({tf})</div>
        <div className="text-2xl font-bold">
          {filteredTrades.length ? winRate.toFixed(1) : 0}%
        </div>
        <div className="text-xs text-gray-400 mt-1">
          {wins} wins • {losses} losses
        </div>
      </div>
    ),
    best_trade: (
      <div className={cardBase}>
        <div className={cardTitle}>Best Trade ({tf})</div>
        <div className="text-2xl font-bold text-green-400">
          {formatCurrency(best.value === -Infinity ? 0 : best.value)}
        </div>
        <div className="text-xs text-gray-400 mt-1">
          {best.trade
            ? `${best.trade.player ?? "Unknown"} (${best.trade.version ?? "—"})`
            : "—"}
        </div>
      </div>
    ),
    avg_profit: (
      <div className={cardBase}>
        <div className={cardTitle}>Average Profit / Trade ({tf})</div>
        <div className="text-2xl font-bold" style={{ color: ACCENT }}>
          {formatCurrency(avgProfit)}
        </div>
      </div>
    ),
    volume: (
      <div className={cardBase}>
        <div className={cardTitle}>Coin Volume ({tf})</div>
        <div className="text-2xl font-bold text-gray-200">
          {formatCurrency(volume.total)}
        </div>
        <div className="text-xs text-gray-400 mt-1">
          Buys: {formatCurrency(volume.buy)} • Sells: {formatCurrency(volume.sell)}
        </div>
      </div>
    ),
    profit_trend: (
      <div className={cardBase}>
        <div className="flex items-center justify-between">
          <div className={cardTitle}>Profit Trend (7D)</div>
          <span className={chip}>
            <LineChart size={12} />
            sparkline
          </span>
        </div>
        <div className="mt-2">
          <svg width={sparklinePath.w} height={sparklinePath.h}>
            <path d={sparklinePath.d} stroke={ACCENT} fill="none" strokeWidth="2" />
          </svg>
          <div className="text-xs text-gray-400 mt-1">
            Last day:{" "}
            <span
              className={
                sparklinePath.last >= 0 ? "text-green-400 font-medium" : "text-red-400 font-medium"
              }
            >
              {formatCurrency(sparklinePath.last ?? 0)}
            </span>
          </div>
        </div>
      </div>
    ),
    latest_trade: (
      <div className={cardBase}>
        <div className={cardTitle}>Latest Trade</div>
        {filteredTrades.length ? (
          (() => {
            const t = [...filteredTrades].sort(
              (a, b) => new Date(b?.timestamp || 0) - new Date(a?.timestamp || 0)
            )[0];
            const baseProfit = t?.profit ?? 0;
            const tax = t?.ea_tax ?? 0;
            const displayProfit = include_tax_in_profit ? baseProfit - tax : baseProfit;
            const pos = displayProfit >= 0;
            return (
              <div className="mt-1">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-semibold">{t?.player ?? "Unknown"}</div>
                  <div className="text-xs text-gray-400">({t?.version ?? "—"})</div>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {formatCurrency(t?.buy ?? 0)} → {formatCurrency(t?.sell ?? 0)}
                  {t?.quantity > 1 && ` (${t.quantity}x)`} • {t?.platform ?? "Console"}
                </div>
                <div className={`mt-1 text-sm font-semibold ${pos ? "text-green-400" : "text-red-400"}`}>
                  {pos ? <TrendingUp size={14} className="inline mr-1" /> : <TrendingDown size={14} className="inline mr-1" />}
                  {displayProfit >= 0 ? "+" : ""}
                  {formatCurrency(displayProfit)} coins
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  <Clock size={12} className="inline mr-1" />
                  {t?.timestamp ? formatDate(t.timestamp) : "—"}
                </div>
              </div>
            );
          })()
        ) : (
          <div className="text-gray-400 text-sm mt-1">No trades yet</div>
        )}
      </div>
    ),
  };

  // If Settings has nothing yet, fall back to a good default selection
  const defaultOrder = [
    "profit",
    "trades",
    "roi",
    "winrate",
    "avg_profit",
    "best_trade",
    "volume",
    "profit_trend",
    "tax",
    "balance",
    "latest_trade",
  ];
  const orderedKeys = (visible_widgets.length ? visible_widgets : defaultOrder).filter(
    (k) => k in widgets
  );

  return (
    <div className="p-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-400">Last updated: {formatDate(new Date())}</div>
          <div className="w-px h-4 bg-gray-700" />
          {/* Timeframe selector */}
          <div className="bg-gray-900/70 border border-gray-800 rounded-xl p-1 flex">
            {["7D", "30D", "ALL"].map((k) => (
              <button
                key={k}
                onClick={() => setTf(k)}
                className={`px-3 py-1 text-sm rounded-lg ${
                  tf === k ? "bg-gray-800 text-white" : "text-gray-400 hover:text-gray-200"
                }`}
                style={tf === k ? { outline: `1px solid ${ACCENT}` } : undefined}
              >
                {k}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Widgets grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {orderedKeys.map((key) => (
          <div key={key}>{widgets[key]}</div>
        ))}
      </div>

      {/* Recent Trades */}
      <div className="bg-gray-900/70 rounded-2xl p-6 border border-gray-800">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">Recent Trades</h2>
            <span className={chip}>
              Showing last {Math.min(filteredTrades.length, 10)} ({tf})
            </span>
            {streak > 0 && (
              <span className={`${chip}`} style={{ outline: `1px solid ${ACCENT}` }}>
                🔥 {streak} win streak
              </span>
            )}
          </div>
          <div className="text-sm">
            <a
              href="/trades"
              className="text-gray-300 hover:text-white"
              style={{ textDecorationColor: ACCENT }}
            >
              View all trades →
            </a>
          </div>
        </div>

        {filteredTrades.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">No trades logged yet</div>
            <p className="text-sm text-gray-500">
              Start by adding your first trade to see your progress here
            </p>
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
                        <span className="text-sm text-gray-400">
                          ({trade?.version ?? "N/A"})
                        </span>
                        {trade?.tag && (
                          <span className="text-xs bg-gray-800 border border-gray-700 px-2 py-1 rounded-full">
                            {trade.tag}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-400 mt-1">
                        {formatCurrency(trade?.buy ?? 0)} → {formatCurrency(trade?.sell ?? 0)}
                        {trade?.quantity > 1 && ` (${trade.quantity}x)`} •{" "}
                        {trade?.platform ?? "Console"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`font-semibold ${pos ? "text-green-400" : "text-red-400"}`}
                      >
                        {pos ? "+" : ""}
                        {formatCurrency(displayProfit)} coins
                      </div>
                      <div className="text-xs text-gray-400">
                        {trade?.timestamp ? formatDate(trade.timestamp) : "—"}
                      </div>
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
};

export default Dashboard;
