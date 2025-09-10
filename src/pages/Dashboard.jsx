// src/pages/Dashboard.jsx

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { useDashboard } from "../context/DashboardContext";
import { useSettings, ALL_WIDGET_KEYS } from "../context/SettingsContext";
import PremiumGate from "../components/PremiumGate";
import {
  LineChart,
  PencilLine,
  Plus,
  X,
  TrendingUp,
  Bell,
  Settings as Cog,
  BarChart3,
  Zap,
  Brain,
  Crown,
} from "lucide-react";

const ACCENT = "#91db32";

/* ---------------- Layout persistence ---------------- */
const LAYOUT_STORAGE_KEY = "dashboard_layout_v2";
const WIDGET_SETTINGS_KEY = "dashboard_widgets_v2";

const saveLayoutToStorage = (layout) => {
  try {
    localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layout));
  } catch {}
};
const loadLayoutFromStorage = () => {
  try {
    const s = localStorage.getItem(LAYOUT_STORAGE_KEY);
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
};
const saveWidgetSettingsToStorage = (settings) => {
  try {
    localStorage.setItem(WIDGET_SETTINGS_KEY, JSON.stringify(settings));
  } catch {}
};
const loadWidgetSettingsFromStorage = () => {
  try {
    const s = localStorage.getItem(WIDGET_SETTINGS_KEY);
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
};

/* ---------------- UI bits ---------------- */
const cardBase =
  "bg-gray-900/70 rounded-2xl p-4 border border-gray-800 hover:border-gray-700 transition-colors h-[150px] flex flex-col justify-between";
const cardTitle = "text-[13px] font-semibold text-gray-200/90 leading-none";
const cardBig =
  "text-[clamp(20px,1.8vw,26px)] font-extrabold leading-tight tracking-tight tabular-nums whitespace-nowrap";
const cardHuge =
  "text-[clamp(24px,2.4vw,36px)] font-extrabold leading-tight tracking-tight tabular-nums whitespace-nowrap";
const subText = "text-[12px] text-gray-400 leading-snug";
const chip =
  "inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-gray-800 text-gray-300";

const ALL_WIDGET_LABELS = {
  profit: "Net Profit",
  tax: "EA Tax Paid",
  trades: "Total Trades",
  profit_trend: "Profit Trend",
  winrate: "Win Rate",
  avg_profit: "Average Profit / Trade",
  best_trade: "Best Trade",
  volume: "Coin Volume",
  latest_trade: "Latest Trade",
  top_earner: "Top Earner",
  balance: "Starting Balance",
  roi: "ROI",
  promo: "Next Promo",
  trending: "Trending (6h)",
  alerts: "Watchlist Alerts",
  performance: "Performance Score",
  quick_actions: "Quick Actions",
  daily_target: "Daily Target",
  streak: "Current Streak",
  market_summary: "Market Summary",
  // Premium widgets
  smart_insights: "AI Smart Insights",
  advanced_analytics: "Advanced Analytics",
  market_predictions: "Market Predictions",
};

/* ------------ Trade normalization (fixes Unknown Player / prices) ------------ */
function normalizeTrade(t) {
  return {
    player_name: t.player_name ?? t.player ?? t.name ?? "Unknown Player",
    buy_price:
      typeof t.buy_price === "number"
        ? t.buy_price
        : typeof t.buy === "number"
        ? t.buy
        : null,
    sell_price:
      typeof t.sell_price === "number"
        ? t.sell_price
        : typeof t.sell === "number"
        ? t.sell
        : null,
    profit: typeof t.profit === "number" ? t.profit : Number(t.profit ?? 0),
    date: t.date ?? t.timestamp ?? t.ts ?? null,
    _raw: t,
  };
}

/* ------------ Profit Trend widget (simple 7d bars + change) ------------- */
const ProfitTrendCard = ({ trades, formatCurrency }) => {
  // Group profit by day
  const byDay = new Map();
  for (const t of trades) {
    if (!t.date) continue;
    const d = new Date(t.date);
    if (isNaN(d)) continue;
    const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
    byDay.set(key, (byDay.get(key) ?? 0) + (t.profit || 0));
  }

  // last 7 days keys (including today)
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });

  const series = days.map((k) => byDay.get(k) ?? 0);
  const total = series.reduce((a, b) => a + b, 0);
  const prev3 = series.slice(0, 4).reduce((a, b) => a + b, 0);
  const last3 = series.slice(4).reduce((a, b) => a + b, 0);
  const change =
    prev3 === 0 ? (last3 > 0 ? 100 : 0) : ((last3 - prev3) / Math.abs(prev3)) * 100;
  const maxAbs = Math.max(1, ...series.map((v) => Math.abs(v)));

  return (
    <div className={cardBase}>
      <div className={cardTitle}>Profit Trend</div>
      <div className="flex-1 flex items-end gap-1 mt-2">
        {series.map((v, i) => (
          <div key={i} className="flex-1 h-16 bg-gray-800 rounded overflow-hidden">
            <div
              className={`w-full rounded ${
                v >= 0 ? "bg-green-500" : "bg-red-500"
              }`}
              style={{
                height: `${Math.min(
                  100,
                  Math.round((Math.abs(v) / maxAbs) * 100)
                )}%`,
              }}
              title={`${days[i]}: ${formatCurrency(v)} coins`}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 text-sm text-gray-300">
        7d total:{" "}
        <span className="font-semibold">{formatCurrency(total)} coins</span>
        {" • "}
        <span className={change >= 0 ? "text-green-400" : "text-red-400"}>
          {(change >= 0 ? "+" : "") + change.toFixed(1)}%
        </span>{" "}
        vs prior 3 days
      </div>
    </div>
  );
};

export default function Dashboard() {
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
    visible_widgets,
    widget_order,
    include_tax_in_profit,
    alerts,
    toggleWidget,
    recent_trades_limit,
    isLoading: settingsLoading,
    daily_target,
  } = useSettings();

  const [tf, setTf] = useState("7D");
  const [editLayout, setEditLayout] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Load layout from localStorage on startup
  const [localWidgetOrder, setLocalWidgetOrder] = useState(() => {
    const saved = loadLayoutFromStorage();
    return saved?.widget_order || widget_order || [...ALL_WIDGET_KEYS];
  });

  const [localVisibleWidgets, setLocalVisibleWidgets] = useState(() => {
    const saved = loadWidgetSettingsFromStorage();
    return saved?.visible_widgets || visible_widgets || ALL_WIDGET_KEYS.slice(0, 8);
  });

  // Auto-save layout changes
  useEffect(() => {
    saveLayoutToStorage({ widget_order: localWidgetOrder });
  }, [localWidgetOrder]);
  useEffect(() => {
    saveWidgetSettingsToStorage({ visible_widgets: localVisibleWidgets });
  }, [localVisibleWidgets]);

  // Normalize trades once
  const _raw = Array.isArray(rawTrades) ? rawTrades : [];
  const trades = useMemo(() => _raw.map(normalizeTrade), [_raw]);

  const vis = Array.isArray(localVisibleWidgets) ? localVisibleWidgets : [];
  const order = Array.isArray(localWidgetOrder) ? localWidgetOrder : [];
  const previewLimit =
    Number.isFinite(recent_trades_limit) && recent_trades_limit > 0
      ? recent_trades_limit
      : 5;

  const hiddenWidgets = ALL_WIDGET_KEYS.filter((k) => !vis.includes(k));

  // Calculate metrics from normalized trades
  const { totalTrades, winRate, avgProfit, bestTrade, totalVolume, roi } =
    useMemo(() => {
      if (!trades.length)
        return {
          totalTrades: 0,
          winRate: 0,
          avgProfit: 0,
          bestTrade: 0,
          totalVolume: 0,
          roi: 0,
        };

      const totalTrades = trades.length;
      const wins = trades.filter((t) => (t.profit || 0) > 0).length;
      const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
      const avgProfit =
        totalTrades > 0
          ? trades.reduce((sum, t) => sum + (t.profit || 0), 0) / totalTrades
          : 0;
      const bestTrade =
        trades.length > 0 ? Math.max(...trades.map((t) => t.profit || 0)) : 0;
      // totalVolume (if you later store volume per trade, plug it in here)
      const totalVolume = trades.reduce(
        (sum, t) => sum + (t._raw?.volume || 0),
        0
      );
      const roi =
        startingBalance > 0
          ? ((netProfit || 0) / startingBalance) * 100
          : 0;

      return { totalTrades, winRate, avgProfit, bestTrade, totalVolume, roi };
    }, [trades, netProfit, startingBalance]);

  // Recent trades (sorted desc)
  const recentTrades = useMemo(() => {
    const toTime = (t) =>
      t?.date ? new Date(t.date).getTime() : 0;
    return trades
      .slice()
      .sort((a, b) => toTime(b) - toTime(a))
      .slice(0, previewLimit);
  }, [trades, previewLimit]);

  /* -------------------- Premium Widgets -------------------- */
  const SmartInsightsCard = () => {
    return (
      <PremiumGate feature="smart_insights" featureName="AI Smart Insights">
        <div className={`${cardBase} bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-500/20`}>
          <div className="flex items-center justify-between">
            <div className={cardTitle}>AI Smart Insights</div>
            <span className={`${chip} bg-blue-500/20 text-blue-300`}>
              <Brain size={10} /> AI
            </span>
          </div>
          <div className="flex-1 flex items-center">
            <div className="text-sm text-blue-200 leading-relaxed">
              "📈 TOTY players showing 15% uptick. Consider investing in high-rated defenders before Friday's content drop."
            </div>
          </div>
          <div className={`${subText} text-blue-300`}>Updated 5 minutes ago</div>
        </div>
      </PremiumGate>
    );
  };

  const AdvancedAnalyticsCard = () => {
    return (
      <PremiumGate feature="advanced_analytics" featureName="Advanced Analytics">
        <div className={`${cardBase} bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/20`}>
          <div className="flex items-center justify-between">
            <div className={cardTitle}>Advanced Analytics</div>
            <span className={`${chip} bg-purple-500/20 text-purple-300`}>
              <BarChart3 size={10} /> PRO
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 flex-1 items-center">
            <div>
              <div className="text-xs text-purple-300">Sharpe Ratio</div>
              <div className="text-lg font-bold text-purple-200">2.31</div>
            </div>
            <div>
              <div className="text-xs text-purple-300">Max Drawdown</div>
              <div className="text-lg font-bold text-purple-200">-8.2%</div>
            </div>
          </div>
          <div className={`${subText} text-purple-300`}>Risk-adjusted returns</div>
        </div>
      </PremiumGate>
    );
  };

  const MarketPredictionsCard = () => {
    return (
      <PremiumGate feature="market_predictions" featureName="Market Predictions">
        <div className={`${cardBase} bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-500/20`}>
          <div className="flex items-center justify-between">
            <div className={cardTitle}>Market Predictions</div>
            <span className={`${chip} bg-green-500/20 text-green-300`}>
              <LineChart size={10} /> LIVE
            </span>
          </div>
          <div className="flex items-center gap-3 flex-1">
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
              📊
            </div>
            <div>
              <div className="text-sm font-semibold text-green-200">Icons likely to drop 12%</div>
              <div className="text-xs text-green-300">Next 48-72 hours</div>
            </div>
          </div>
          <div className={`${subText} text-green-300`}>87% confidence • ML Model v2.1</div>
        </div>
      </PremiumGate>
    );
  };

  /* -------------------- Render widgets -------------------- */
  const renderWidget = (key) => {
    switch (key) {
      // Premium
      case "smart_insights":
        return <SmartInsightsCard />;
      case "advanced_analytics":
        return <AdvancedAnalyticsCard />;
      case "market_predictions":
        return <MarketPredictionsCard />;

      // Core
      case "profit":
        return (
          <div className={cardBase}>
            <div className={cardTitle}>Net Profit</div>
            <div className="text-green-400">
              <span className={cardBig}>{formatCurrency(netProfit ?? 0)} coins</span>
            </div>
            <div className={subText}>Total earnings after costs</div>
          </div>
        );

      case "tax":
        return (
          <div className={cardBase}>
            <div className={cardTitle}>EA Tax Paid</div>
            <div className="text-red-400">
              <span className={cardBig}>{formatCurrency(taxPaid ?? 0)} coins</span>
            </div>
            <div className={subText}>Transaction fees</div>
          </div>
        );

      case "trades":
        return (
          <div className={cardBase}>
            <div className={cardTitle}>Total Trades</div>
            <div className="text-blue-400">
              <span className={cardHuge}>{trades.length}</span>
            </div>
            <div className={subText}>Completed transactions</div>
          </div>
        );

      case "profit_trend":
        return (
          <ProfitTrendCard trades={trades} formatCurrency={formatCurrency} />
        );

      case "winrate":
        return (
          <div className={cardBase}>
            <div className={cardTitle}>Win Rate</div>
            <div className="text-green-400">
              <span className={cardHuge}>{winRate.toFixed(1)}%</span>
            </div>
            <div className={subText}>Profitable trades</div>
          </div>
        );

      case "avg_profit":
        return (
          <div className={cardBase}>
            <div className={cardTitle}>Average Profit / Trade</div>
            <div className="text-yellow-400">
              <span className={cardBig}>{formatCurrency(avgProfit)} coins</span>
            </div>
            <div className={subText}>Per transaction</div>
          </div>
        );

      case "best_trade":
        return (
          <div className={cardBase}>
            <div className={cardTitle}>Best Trade</div>
            <div className="text-green-400">
              <span className={cardBig}>{formatCurrency(bestTrade)} coins</span>
            </div>
            <div className={subText}>Highest single profit</div>
          </div>
        );

      case "volume":
        return (
          <div className={cardBase}>
            <div className={cardTitle}>Coin Volume</div>
            <div className="text-purple-400">
              <span className={cardBig}>{formatCurrency(totalVolume)} coins</span>
            </div>
            <div className={subText}>Total traded value</div>
          </div>
        );

      case "balance":
        return (
          <div className={cardBase}>
            <div className={cardTitle}>Starting Balance</div>
            <div className="text-gray-300">
              <span className={cardBig}>{formatCurrency(startingBalance ?? 0)} coins</span>
            </div>
            <div className={subText}>Initial investment</div>
          </div>
        );

      case "roi":
        return (
          <div className={cardBase}>
            <div className={cardTitle}>ROI</div>
            <div className={roi >= 0 ? "text-green-400" : "text-red-400"}>
              <span className={cardHuge}>{roi.toFixed(1)}%</span>
            </div>
            <div className={subText}>Return on investment</div>
          </div>
        );

      case "latest_trade":
        return (
          <div className={cardBase}>
            <div className={cardTitle}>Latest Trade</div>
            {recentTrades.length > 0 ? (
              <div className="flex-1 flex flex-col justify-center">
                <div className="text-sm font-semibold text-white">
                  {recentTrades[0].player_name}
                </div>
                <div
                  className={`text-lg font-bold ${
                    (recentTrades[0].profit || 0) >= 0
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {formatCurrency(recentTrades[0].profit || 0)} coins
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
                No trades yet
              </div>
            )}
            <div className={subText}>Most recent transaction</div>
          </div>
        );

      case "daily_target":
        return (
          <div className={cardBase}>
            <div className={cardTitle}>Daily Target</div>
            <div className="flex-1 flex items-center">
              <div className="w-full">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-300">
                    {formatCurrency(netProfit ?? 0)} coins
                  </span>
                  <span className="text-gray-400">
                    {formatCurrency(daily_target ?? 10000)} coins
                  </span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        (((netProfit ?? 0) / (daily_target ?? 10000)) * 100) |
                          0,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
            <div className={subText}>
              {(((netProfit ?? 0) / (daily_target ?? 10000)) * 100).toFixed(0)}%
              complete
            </div>
          </div>
        );

      case "quick_actions":
        return (
          <div className={`${cardBase} bg-gradient-to-br from-blue-900/20 to-cyan-900/20`}>
            <div className="flex items-center justify-between">
              <div className={cardTitle}>Quick Actions</div>
              <span className={chip}>
                <Zap size={10} /> shortcuts
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Link
                to="/add-trade"
                className="bg-green-600 hover:bg-green-700 rounded-lg p-2 flex flex-col items-center gap-1 transition-all transform hover:scale-105"
              >
                <Plus size={16} className="text-white" />
                <span className="text-[10px] text-white font-medium">
                  Add Trade
                </span>
              </Link>
              <Link
                to="/analytics"
                className="bg-blue-600 hover:bg-blue-700 rounded-lg p-2 flex flex-col items-center gap-1 transition-all transform hover:scale-105"
              >
                <BarChart3 size={16} className="text-white" />
                <span className="text-[10px] text-white font-medium">
                  Analytics
                </span>
              </Link>
              <PremiumGate feature="smart_buy">
                <Link
                  to="/smart-buy"
                  className="bg-purple-600 hover:bg-purple-700 rounded-lg p-2 flex flex-col items-center gap-1 transition-all transform hover:scale-105"
                >
                  <Brain size={16} className="text-white" />
                  <span className="text-[10px] text-white font-medium">
                    Smart Buy
                  </span>
                </Link>
              </PremiumGate>
              <Link
                to="/settings"
                className="bg-gray-600 hover:bg-gray-700 rounded-lg p-2 flex flex-col items-center gap-1 transition-all transform hover:scale-105"
              >
                <Cog size={16} className="text-white" />
                <span className="text-[10px] text-white font-medium">
                  Settings
                </span>
              </Link>
            </div>
          </div>
        );

      case "alerts":
        return (
          <div className={cardBase}>
            <div className="flex items-center justify-between">
              <div className={cardTitle}>Watchlist Alerts</div>
              <span className={chip}>
                <Bell size={10} /> live
              </span>
            </div>
            <div className="flex-1 flex items-center">
              {alerts && alerts.length > 0 ? (
                <div className="text-sm text-orange-300">
                  {alerts.length} active alert{alerts.length !== 1 ? "s" : ""}
                </div>
              ) : (
                <div className="text-sm text-gray-500">No active alerts</div>
              )}
            </div>
            <div className={subText}>Price notifications</div>
          </div>
        );

      // Default placeholder
      default:
        return (
          <div className={cardBase}>
            <div className={cardTitle}>{ALL_WIDGET_LABELS[key] || key}</div>
            <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
              Widget not implemented
            </div>
            <div className={subText}>Coming soon</div>
          </div>
        );
    }
  };

  // Enhanced toggle function (keeps local + context in sync)
  const enhancedToggleWidget = useCallback(
    (key, show) => {
      if (show) setLocalVisibleWidgets((prev) => [...prev, key]);
      else setLocalVisibleWidgets((prev) => prev.filter((k) => k !== key));
      toggleWidget(key, show);
    },
    [toggleWidget]
  );

  if (isLoading || settingsLoading) {
    return (
      <div className="p-4 max-w-6xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-800 rounded w-40" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="bg-gray-900/70 rounded-2xl h-[150px] border border-gray-800"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) return <div className="text-red-500 p-4">{String(error)}</div>;

  return (
    <div className="p-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
        <h1 className="text-xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-2">
          <div className="text-xs text-gray-400">
            Last updated: {formatDate(new Date())}
          </div>
          <div className="w-px h-4 bg-gray-700" />
          <div className="bg-gray-900/70 border border-gray-800 rounded-xl p-1 flex">
            {["7D", "30D", "ALL"].map((k) => (
              <button
                key={k}
                onClick={() => setTf(k)}
                className={`px-2.5 py-1 text-xs rounded-lg ${
                  tf === k
                    ? "bg-gray-800 text-white"
                    : "text-gray-400 hover:text-gray-200"
                }`}
                style={
                  tf === k ? { outline: `1px solid ${ACCENT}` } : undefined
                }
              >
                {k}
              </button>
            ))}
          </div>
          <div className="w-px h-4 bg-gray-700" />
          <button
            onClick={() => setEditLayout((v) => !v)}
            className={`text-xs px-3 py-1 rounded-lg border ${
              editLayout
                ? "bg-gray-800 border-gray-700"
                : "bg-gray-900/70 border-gray-800 hover:border-gray-700"
            } flex items-center gap-1.5`}
            title="Reorder / show / hide widgets"
          >
            <PencilLine size={12} /> {editLayout ? "Done" : "Edit"}
          </button>
          {editLayout && (
            <>
              <button
                onClick={() => setPickerOpen(true)}
                className="text-xs px-3 py-1 rounded-lg bg-gray-900/70 border border-gray-800 hover:border-gray-700 flex items-center gap-1.5"
                title="Add hidden widgets"
              >
                <Plus size={12} /> Add
              </button>
            </>
          )}
        </div>
      </div>

      {/* Add widget picker */}
      {editLayout && pickerOpen && (
        <div className="mb-3 p-3 bg-gray-950 border border-gray-800 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-300">Hidden widgets</div>
            <button
              onClick={() => setPickerOpen(false)}
              className="text-gray-400 hover:text-gray-200"
            >
              <X size={16} />
            </button>
          </div>
          {hiddenWidgets.length === 0 ? (
            <div className="text-xs text-gray-500">
              All widgets are currently visible.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {hiddenWidgets.map((k) => (
                <button
                  key={k}
                  className="text-xs px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 hover:border-gray-700 hover:bg-gray-800 transition-colors flex items-center gap-1.5"
                  onClick={() => {
                    enhancedToggleWidget(k, true);
                    setPickerOpen(false);
                  }}
                >
                  <Plus size={12} />
                  {ALL_WIDGET_LABELS[k] || k}
                  {["smart_insights", "advanced_analytics", "market_predictions"].includes(
                    k
                  ) && <Crown size={10} className="text-yellow-400" />}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {vis.map((key) => (
          <div
            key={key}
            className={`${editLayout ? "cursor-move" : ""} group relative transition-transform`}
            style={
              editLayout
                ? {
                    outline: "2px dashed rgba(145,219,50,0.3)",
                    borderRadius: "1rem",
                    backgroundColor: "rgba(145,219,50,0.05)",
                  }
                : undefined
            }
          >
            {editLayout && (
              <button
                onClick={() => enhancedToggleWidget(key, false)}
                className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 border border-red-500 rounded-full p-1 text-white z-10 transition-colors"
                title="Hide widget"
              >
                <X size={14} />
              </button>
            )}
            {renderWidget(key)}
          </div>
        ))}
      </div>

      {/* Recent Trades */}
      {recentTrades.length > 0 && (
        <div className="bg-gray-900/70 rounded-2xl p-4 border border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Recent Trades</h2>
            <Link
              to="/trades"
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              View all <TrendingUp size={12} />
            </Link>
          </div>
          <div className="space-y-2">
            {recentTrades.map((trade, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center text-xs font-semibold">
                    {(trade.player_name || "U")[0]}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">
                      {trade.player_name}
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatDate(new Date(trade.date || Date.now()))}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`text-sm font-semibold ${
                      (trade.profit || 0) >= 0
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {formatCurrency(trade.profit || 0)} coins
                  </div>
                  <div className="text-xs text-gray-400">
                    {typeof trade.buy_price === "number" &&
                    typeof trade.sell_price === "number"
                      ? `${formatCurrency(trade.buy_price)} → ${formatCurrency(
                          trade.sell_price
                        )}`
                      : "No price data"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No trades message */}
      {trades.length === 0 && !isLoading && (
        <div className="bg-gray-900/70 rounded-2xl p-8 border border-gray-800 text-center">
          <div className="text-gray-400 mb-2">No trades yet</div>
          <div className="text-sm text-gray-500 mb-4">
            Start by adding your first trade to see your dashboard populate with
            data.
          </div>
          <Link
            to="/add-trade"
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={16} />
            Add Your First Trade
          </Link>
        </div>
      )}
    </div>
  );
}
