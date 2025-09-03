import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { useDashboard } from "../context/DashboardContext";
import { useSettings } from "../context/SettingsContext";
import { Plus, TrendingUp, Users, Search, BarChart3, Eye } from "lucide-react";

const LIME = "#91db32";

const QuickActionCard = ({ to, icon: Icon, title, subtitle, color = LIME }) => (
  <Link
    to={to}
    className="group relative overflow-hidden rounded-2xl p-4 bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 hover:border-gray-600/50 active:scale-[0.98] transition-all duration-200"
  >
    <div className="absolute -top-10 -right-10 w-20 h-20 rounded-full bg-white/5 pointer-events-none" />
    <div className="relative z-10 flex items-center gap-3">
      <div
        className="w-12 h-12 rounded-xl grid place-items-center text-black font-bold"
        style={{ backgroundColor: color }}
      >
        <Icon className="w-6 h-6" />
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-white text-sm">{title}</p>
        <p className="text-xs text-gray-400">{subtitle}</p>
      </div>
    </div>
  </Link>
);

const StatCard = ({ icon, title, value, subtitle, intent = "neutral" }) => {
  const intents = {
    profit: {
      bg: "from-green-500/10 to-green-600/5",
      border: "border-green-500/20",
      text: "text-green-400",
      chip: "bg-green-500/15 text-green-400",
    },
    danger: {
      bg: "from-red-500/10 to-red-600/5",
      border: "border-red-500/20",
      text: "text-red-400",
      chip: "bg-red-500/15 text-red-400",
    },
    neutral: {
      bg: "from-gray-500/10 to-gray-600/5",
      border: "border-gray-600/20",
      text: "text-gray-100",
      chip: "bg-gray-500/15 text-gray-300",
    },
  }[intent];

  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br ${intents.bg} backdrop-blur-sm border ${intents.border} shadow-lg`}
    >
      <div className="absolute -top-8 -right-8 w-20 h-20 rounded-full bg-white/5 pointer-events-none" />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 grid place-items-center">
            <span className="text-lg">{icon}</span>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-white/60 uppercase tracking-wide">
              {title}
            </p>
            <p className={`text-2xl font-bold leading-tight ${intents.text}`}>
              {value}
            </p>
          </div>
        </div>
        {subtitle && (
          <div
            className={`inline-block px-2 py-1 rounded-lg text-[10px] font-medium ${intents.chip}`}
          >
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
};

const TradeRow = ({ trade, formatCurrency, formatDate }) => {
  const positive = trade.profit >= 0;
  return (
    <div className="group rounded-2xl p-3 bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 hover:border-gray-600/50 transition-all duration-200">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 grid place-items-center font-bold text-sm text-white">
          {trade.player?.[0]?.toUpperCase() || "?"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white truncate">
            {trade.player}
          </p>
          <p className="text-[11px] text-gray-400">
            {trade.version} • {trade.platform}
          </p>
        </div>
        <div className="text-right">
          <p
            className={`text-sm font-bold ${
              positive ? "text-green-400" : "text-red-400"
            }`}
          >
            {positive ? "+" : ""}
            {formatCurrency(trade.profit)}
          </p>
          <p className="text-[10px] text-gray-500">
            {formatDate(trade.timestamp).split(",")[0]}
          </p>
        </div>
      </div>
    </div>
  );
};

export default function MobileDashboard() {
  const { netProfit, taxPaid, startingBalance, trades } = useDashboard();
  const { formatCurrency, formatDate } = useSettings();

  const grossProfit = netProfit + taxPaid;
  const pct = startingBalance > 0 ? (netProfit / startingBalance) * 100 : 0;
  const avg = trades.length > 0 ? netProfit / trades.length : 0;
  const recent = useMemo(() => trades.slice(0, 6), [trades]);

  const netIntent = netProfit >= 0 ? "profit" : "danger";

  const quickActions = [
    {
      to: "/add-trade",
      icon: Plus,
      title: "Add Trade",
      subtitle: "Record new trade",
      color: LIME,
    },
    {
      to: "/player-search",
      icon: Search,
      title: "Player Search",
      subtitle: "Find players",
      color: "#3B82F6",
    },
    {
      to: "/analytics",
      icon: BarChart3,
      title: "Analytics",
      subtitle: "View insights",
      color: "#8B5CF6",
    },
    {
      to: "/trending",
      icon: TrendingUp,
      title: "Trending",
      subtitle: "Market trends",
      color: "#F59E0B",
    },
    {
      to: "/watchlist",
      icon: Eye,
      title: "Watchlist",
      subtitle: "Saved players",
      color: "#EF4444",
    },
    {
      to: "/squad",
      icon: Users,
      title: "Squad Builder",
      subtitle: "Build teams",
      color: "#10B981",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Gradient Background */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background: `radial-gradient(1400px 600px at 50% -10%, rgba(145,219,50,0.08), transparent 70%), radial-gradient(1000px 400px at -10% 20%, rgba(139,92,246,0.06), transparent 70%), radial-gradient(800px 300px at 90% 80%, rgba(59,130,246,0.05), transparent 70%), linear-gradient(180deg, rgba(17,24,39,0.8), rgba(3,7,18,0.95) 60%, #030712)`,
        }}
      />

      <main className="px-4 pb-8">
        {/* Welcome Section */}
        <section className="mb-6">
          <div className="text-center py-6">
            <h1 className="text-2xl font-bold mb-2">
              Welcome back, Trader! 👋
            </h1>
            <p className="text-gray-400">Here's your trading overview</p>
          </div>
        </section>

        {/* Stats Overview */}
        <section className="mb-6">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-lg font-semibold">Portfolio Overview</h2>
            <span className="text-xs px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/20">
              {trades.length} trades
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <StatCard
              icon={netProfit >= 0 ? "💰" : "📉"}
              title="Net Profit"
              value={formatCurrency(netProfit)}
              subtitle={`${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`}
              intent={netIntent}
            />
            <StatCard
              icon="🎯"
              title="Avg Trade"
              value={formatCurrency(avg)}
              subtitle="Per trade"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon="🏛️"
              title="EA Tax"
              value={formatCurrency(taxPaid)}
              subtitle={
                grossProfit > 0
                  ? `${((taxPaid / grossProfit) * 100).toFixed(1)}%`
                  : "0%"
              }
            />
            <StatCard
              icon="📊"
              title="Balance"
              value={formatCurrency(startingBalance)}
              subtitle="Starting funds"
            />
          </div>
        </section>

        {/* Quick Actions */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.slice(0, 6).map((action, index) => (
              <QuickActionCard
                key={index}
                to={action.to}
                icon={action.icon}
                title={action.title}
                subtitle={action.subtitle}
                color={action.color}
              />
            ))}
          </div>
        </section>

        {/* Recent Trades */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Trades</h2>
            <Link
              to="/trades"
              className="text-sm font-medium hover:underline"
              style={{ color: LIME }}
            >
              View all
            </Link>
          </div>

          {recent.length ? (
            <div className="space-y-3">
              {recent.map((trade, index) => (
                <TradeRow
                  key={index}
                  trade={trade}
                  formatCurrency={formatCurrency}
                  formatDate={formatDate}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl p-8 text-center bg-gray-800/40 backdrop-blur-sm border border-gray-700/50">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-700/50 grid place-items-center">
                <span className="text-2xl">📊</span>
              </div>
              <p className="text-lg font-semibold mb-2">No trades yet</p>
              <p className="text-sm text-gray-400 mb-4">
                Start your trading journey by adding your first trade
              </p>
              <Link
                to="/add-trade"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-black transition-all duration-200 active:scale-95"
                style={{ backgroundColor: LIME }}
              >
                <Plus className="w-4 h-4" />
                Add First Trade
              </Link>
            </div>
          )}
        </section>
      </main>

      {/* Floating Action Button */}
      <Link
        to="/add-trade"
        aria-label="Add Trade"
        className="fixed bottom-6 right-6 w-14 h-14 rounded-2xl grid place-items-center font-bold text-lg text-black shadow-lg shadow-black/25 active:scale-95 transition-all duration-200 z-40"
        style={{ backgroundColor: LIME }}
      >
        <Plus className="w-6 h-6" />
      </Link>
    </div>
  );
}