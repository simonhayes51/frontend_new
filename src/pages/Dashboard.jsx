// src/pages/Dashboard.jsx - Enhanced with premium widget examples

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { useDashboard } from "../context/DashboardContext";
import { useSettings, ALL_WIDGET_KEYS } from "../context/SettingsContext";
import PremiumGate from "../components/PremiumGate";
import {
  LineChart, PencilLine, RotateCcw, Plus, X, CalendarClock, TrendingUp, TrendingDown,
  Bell, Settings as Cog, Target, Zap, Trophy, Activity, BarChart3, Timer, Brain, Crown
} from "lucide-react";

const ACCENT = "#91db32";

/* ---------------- Layout persistence ---------------- */
const LAYOUT_STORAGE_KEY = "dashboard_layout_v2";
const WIDGET_SETTINGS_KEY = "dashboard_widgets_v2";

const saveLayoutToStorage = (layout) => {
  try { localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layout)); } catch {}
};
const loadLayoutFromStorage = () => {
  try { const s = localStorage.getItem(LAYOUT_STORAGE_KEY); return s ? JSON.parse(s) : null; } catch { return null; }
};
const saveWidgetSettingsToStorage = (settings) => {
  try { localStorage.setItem(WIDGET_SETTINGS_KEY, JSON.stringify(settings)); } catch {}
};
const loadWidgetSettingsFromStorage = () => {
  try { const s = localStorage.getItem(WIDGET_SETTINGS_KEY); return s ? JSON.parse(s) : null; } catch { return null; }
};

/* ---------------- UI bits ---------------- */
const cardBase =
  "bg-gray-900/70 rounded-2xl p-4 border border-gray-800 hover:border-gray-700 transition-colors h-[150px] flex flex-col justify-between";
const cardTitle = "text-[13px] font-semibold text-gray-200/90 leading-none";
const cardBig = "text-[clamp(20px,1.8vw,26px)] font-extrabold leading-tight tracking-tight tabular-nums whitespace-nowrap";
const cardHuge = "text-[clamp(24px,2.4vw,36px)] font-extrabold leading-tight tracking-tight tabular-nums whitespace-nowrap";
const subText = "text-[12px] text-gray-400 leading-snug";
const chip = "inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-gray-800 text-gray-300";

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
  market_predictions: "Market Predictions"
};

export default function Dashboard() {
  const { netProfit, taxPaid, startingBalance, trades: rawTrades, isLoading, error } = useDashboard();
  const {
    formatCurrency, formatDate,
    visible_widgets, widget_order,
    include_tax_in_profit, alerts, saveSettings, toggleWidget,
    recent_trades_limit, isLoading: settingsLoading,
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
  useEffect(() => { saveLayoutToStorage({ widget_order: localWidgetOrder }); }, [localWidgetOrder]);
  useEffect(() => { saveWidgetSettingsToStorage({ visible_widgets: localVisibleWidgets }); }, [localVisibleWidgets]);

  // Rest of your existing dashboard logic...
  const trades = Array.isArray(rawTrades) ? rawTrades : [];
  const vis = Array.isArray(localVisibleWidgets) ? localVisibleWidgets : [];
  const order = Array.isArray(localWidgetOrder) ? localWidgetOrder : [];
  const previewLimit = Number.isFinite(recent_trades_limit) && recent_trades_limit > 0 ? recent_trades_limit : 5;

  const hiddenWidgets = ALL_WIDGET_KEYS.filter((k) => !vis.includes(k));

  // ... (include all your existing dashboard logic here - filterByTimeframe, totals, etc.)

  /* -------------------- Premium Widgets -------------------- */
  
  // AI Smart Insights Widget (Premium)
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

  // Advanced Analytics Widget (Premium)
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

  // Market Predictions Widget (Premium)
  const MarketPredictionsCard = () => {
    return (
      <PremiumGate feature="market_predictions" featureName="Market Predictions">
        <div className={`${cardBase} bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-500/20`}>
          <div className="flex items-center justify-between">
            <div className={cardTitle}>Market Predictions</div>
            <span className={`${chip} bg-green-500/20 text-green-300`}>
              <Activity size={10} /> LIVE
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

  const renderWidget = (key) => {
    switch (key) {
      // Premium widgets
      case "smart_insights": return <SmartInsightsCard />;
      case "advanced_analytics": return <AdvancedAnalyticsCard />;
      case "market_predictions": return <MarketPredictionsCard />;
      
      // Your existing widgets (profit, tax, trades, etc.)
      case "profit": return (
        <div className={cardBase}>
          <div className={cardTitle}>Net Profit</div>
          <div className="text-green-400"><span className={cardBig}>{formatCurrency(netProfit ?? 0)} coins</span></div>
          <div className={subText}></div>
        </div>
      );
      
      case "quick_actions": return (
        <div className={`${cardBase} bg-gradient-to-br from-blue-900/20 to-cyan-900/20`}>
          <div className="flex items-center justify-between">
            <div className={cardTitle}>Quick Actions</div>
            <span className={chip}><Zap size={10} /> shortcuts</span>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <Link to="/add-trade" className="bg-green-600 hover:bg-green-700 rounded-lg p-2 flex flex-col items-center gap-1 transition-all transform hover:scale-105">
              <Plus size={16} className="text-white" />
              <span className="text-[10px] text-white font-medium">Add Trade</span>
            </Link>
            <Link to="/analytics" className="bg-blue-600 hover:bg-blue-700 rounded-lg p-2 flex flex-col items-center gap-1 transition-all transform hover:scale-105">
              <BarChart3 size={16} className="text-white" />
              <span className="text-[10px] text-white font-medium">Analytics</span>
            </Link>
            <PremiumGate feature="smart_buy">
              <Link to="/smart-buy" className="bg-purple-600 hover:bg-purple-700 rounded-lg p-2 flex flex-col items-center gap-1 transition-all transform hover:scale-105">
                <Brain size={16} className="text-white" />
                <span className="text-[10px] text-white font-medium">Smart Buy</span>
              </Link>
            </PremiumGate>
            <Link to="/settings" className="bg-gray-600 hover:bg-gray-700 rounded-lg p-2 flex flex-col items-center gap-1 transition-all transform hover:scale-105">
              <Cog size={16} className="text-white" />
              <span className="text-[10px] text-white font-medium">Settings</span>
            </Link>
          </div>
        </div>
      );

      // Add all your other existing widgets here...
      default: return null;
    }
  };

  // Enhanced toggle function
  const enhancedToggleWidget = useCallback((key, show) => {
    if (show) setLocalVisibleWidgets(prev => [...prev, key]);
    else setLocalVisibleWidgets(prev => prev.filter(k => k !== key));
    toggleWidget(key, show);
  }, [toggleWidget]);

  if (isLoading || settingsLoading) {
    return (
      <div className="p-4 max-w-6xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-800 rounded w-40" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => <div key={i} className="bg-gray-900/70 rounded-2xl h-[150px] border border-gray-800" />)}
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
          <div className="text-xs text-gray-400">Last updated: {formatDate(new Date())}</div>
          <div className="w-px h-4 bg-gray-700" />
          <div className="bg-gray-900/70 border border-gray-800 rounded-xl p-1 flex">
            {["7D", "30D", "ALL"].map((k) => (
              <button key={k} onClick={() => setTf(k)} className={`px-2.5 py-1 text-xs rounded-lg ${tf === k ? "bg-gray-800 text-white" : "text-gray-400 hover:text-gray-200"}`} style={tf === k ? { outline: `1px solid ${ACCENT}` } : undefined}>{k}</button>
            ))}
          </div>
          <div className="w-px h-4 bg-gray-700" />
          <button onClick={() => setEditLayout((v) => !v)} className={`text-xs px-3 py-1 rounded-lg border ${editLayout ? "bg-gray-800 border-gray-700" : "bg-gray-900/70 border-gray-800 hover:border-gray-700"} flex items-center gap-1.5`} title="Reorder / show / hide widgets">
            <PencilLine size={12} /> {editLayout ? "Done" : "Edit"}
          </button>
          {editLayout && (
            <>
              <button onClick={() => setPickerOpen(true)} className="text-xs px-3 py-1 rounded-lg bg-gray-900/70 border border-gray-800 hover:border-gray-700 flex items-center gap-1.5" title="Add hidden widgets">
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
            <button onClick={() => setPickerOpen(false)} className="text-gray-400 hover:text-gray-200"><X size={16} /></button>
          </div>
          {hiddenWidgets.length === 0 ? (
            <div className="text-xs text-gray-500">All widgets are currently visible.</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {hiddenWidgets.map((k) => (
                <button
                  key={k}
                  className="text-xs px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 hover:border-gray-700 hover:bg-gray-800 transition-colors flex items-center gap-1.5"
                  onClick={() => { enhancedToggleWidget(k, true); setPickerOpen(false); }}
                >
                  <Plus size={12} />
                  {ALL_WIDGET_LABELS[k] || k}
                  {/* Show premium badge for premium widgets */}
                  {['smart_insights', 'advanced_analytics', 'market_predictions'].includes(k) && (
                    <Crown size={10} className="text-yellow-400" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {vis.map((key, idx) => (
          <div
            key={key}
            className={`${editLayout ? "cursor-move" : ""} group relative transition-transform`}
            style={editLayout ? { outline: "2px dashed rgba(145,219,50,0.3)", borderRadius: "1rem", backgroundColor: "rgba(145,219,50,0.05)" } : undefined}
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

      {/* Recent Trades section remains the same... */}
    </div>
  );
}
