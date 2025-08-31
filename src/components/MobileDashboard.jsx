import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { useDashboard } from "../context/DashboardContext";
import { useSettings } from "../context/SettingsContext";
import { useAuth } from "../context/AuthContext";

const LIME = "#91db32";

const AvatarFallback = ({ name }) => {
  const initials = (name || "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="w-10 h-10 rounded-full bg-gray-800 border-2 border-white/15 grid place-items-center text-xs font-bold">
      {initials}
    </div>
  );
};

const StatCard = ({ icon, title, value, subtitle, intent = "neutral" }) => {
  const intents = {
    profit: {
      ring: `ring-[${LIME}]/30`,
      bg: "bg-white/5",
      text: `text-[${LIME}]`,
      chip: `bg-[${LIME}]/15 text-[${LIME}]`,
    },
    danger: {
      ring: "ring-red-500/25",
      bg: "bg-white/5",
      text: "text-red-400",
      chip: "bg-red-500/10 text-red-400",
    },
    neutral: {
      ring: "ring-white/10",
      bg: "bg-white/5",
      text: "text-gray-100",
      chip: "bg-white/10 text-gray-300",
    },
  }[intent];

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl p-4 backdrop-blur
        ${intents.bg} ring-1 ${intents.ring}
        shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)]
        active:scale-[0.99] transition
      `}
    >
      <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-white/5 pointer-events-none" />
      <div className="flex items-start gap-3">
        <div className="shrink-0 grid place-items-center w-10 h-10 rounded-xl bg-white/10">
          <span className="text-xl">{icon}</span>
        </div>
        <div className="min-w-0">
          <p className="text-[11px] text-white/60">{title}</p>
          <p className={`text-2xl font-extrabold leading-tight ${intents.text}`}>
            {value}
          </p>
          {subtitle && (
            <span className={`inline-block mt-1 px-2 py-0.5 rounded-lg text-[10px] ${intents.chip}`}>
              {subtitle}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const TradeRow = ({ trade, formatCurrency, formatDate }) => {
  const positive = trade.profit >= 0;
  return (
    <li
      className="
        group rounded-2xl px-3.5 py-3 bg-white/5 ring-1 ring-white/10
        backdrop-blur shadow-[0_10px_30px_-12px_rgba(0,0,0,0.6)]
        hover:bg-white/7 active:scale-[0.99] transition
      "
    >
      <div className="flex items-center gap-3">
        <div
          className="
            w-10 h-10 rounded-xl bg-gradient-to-br from-white/15 to-white/5
            grid place-items-center font-bold text-sm text-white/90
          "
        >
          {trade.player?.[0]?.toUpperCase() || "?"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate">{trade.player}</p>
          <p className="text-[11px] text-white/60">
            {trade.version} • {trade.platform}
          </p>
        </div>
        <div className="text-right">
          <p className={`text-sm font-bold ${positive ? `text-[${LIME}]` : "text-red-400"}`}>
            {positive ? "+" : ""}
            {formatCurrency(trade.profit)}
          </p>
          <p className="text-[11px] text-white/50">
            {formatDate(trade.timestamp).split(",")[0]}
          </p>
        </div>
      </div>
    </li>
  );
};

export default function MobileDashboard() {
  const { netProfit, taxPaid, startingBalance, trades } = useDashboard();
  const { formatCurrency, formatDate } = useSettings();
  const { user } = useAuth();

  const grossProfit = netProfit + taxPaid;
  const pct = startingBalance > 0 ? (netProfit / startingBalance) * 100 : 0;
  const avg = trades.length > 0 ? netProfit / trades.length : 0;
  const recent = useMemo(() => trades.slice(0, 8), [trades]);

  const netIntent = netProfit >= 0 ? "profit" : "danger";

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 relative">
      {/* Subtle app background with gradients */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(1200px 600px at 80% -10%, rgba(145,219,50,0.15), transparent 60%), radial-gradient(900px 500px at -10% 20%, rgba(99,102,241,0.08), transparent 60%), linear-gradient(180deg, rgba(255,255,255,0.04), transparent 20%)",
        }}
      />

      {/* Safe-area spacer */}
      <div className="h-[env(safe-area-inset-top)]" />

      {/* App bar */}
      <header className="sticky top-0 z-20 px-4 pt-3 pb-3 bg-gray-950/70 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center gap-3">
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user?.global_name || "User"}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-white/15"
            />
          ) : (
            <AvatarFallback name={user?.global_name} />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-white/60">Welcome back</p>
            <p className="font-semibold truncate">
              {user?.global_name || "Trader"}
            </p>
          </div>

          <Link
            to="/settings"
            className="px-3 py-2 rounded-xl bg-white/5 ring-1 ring-white/10 hover:bg-white/10 active:scale-95 transition text-sm"
          >
            Settings
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 pt-4 pb-[calc(120px+env(safe-area-inset-bottom))]">
        {/* Overview */}
        <section className="mb-5">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-base font-semibold">Portfolio Overview</h2>
            <span className={`text-xs px-2 py-0.5 rounded-lg bg-white/5 ring-1 ring-white/10`}>
              {trades.length} trades
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <StatCard
              icon={netProfit >= 0 ? "📈" : "📉"}
              title="Net Profit"
              value={formatCurrency(netProfit)}
              subtitle={`${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`}
              intent={netIntent}
            />
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                icon="🏛️"
                title="EA Tax Paid"
                value={formatCurrency(taxPaid)}
                subtitle={
                  grossProfit > 0
                    ? `${((taxPaid / grossProfit) * 100).toFixed(1)}% of gross`
                    : "0%"
                }
              />
              <StatCard
                icon="🎯"
                title="Avg / Trade"
                value={formatCurrency(avg)}
                subtitle="Across all trades"
              />
            </div>
          </div>
        </section>

        {/* Quick lanes */}
        <section className="mb-6">
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/trades"
              className="
                rounded-2xl p-4 bg-white/5 ring-1 ring-white/10 backdrop-blur
                shadow-[0_10px_30px_-12px_rgba(0,0,0,0.6)]
                active:scale-[0.99] transition
              "
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">📋</span>
                <span className="font-semibold text-sm">View Trades</span>
              </div>
            </Link>
            <Link
              to="/analytics"
              className="
                rounded-2xl p-4 bg-white/5 ring-1 ring-white/10 backdrop-blur
                shadow-[0_10px_30px_-12px_rgba(0,0,0,0.6)]
                active:scale-[0.99] transition
              "
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">📊</span>
                <span className="font-semibold text-sm">Analytics</span>
              </div>
            </Link>
          </div>
        </section>

        {/* Recent Trades */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-semibold">Recent Trades</h3>
            <Link
              to="/trades"
              className={`text-sm font-medium hover:underline`}
              style={{ color: LIME }}
            >
              View all
            </Link>
          </div>

          {recent.length ? (
            <ul className="space-y-2.5">
              {recent.map((t, i) => (
                <TradeRow
                  key={i}
                  trade={t}
                  formatCurrency={formatCurrency}
                  formatDate={formatDate}
                />
              ))}
            </ul>
          ) : (
            <div
              className="
              rounded-2xl p-8 text-center bg-white/5 ring-1 ring-white/10 backdrop-blur
              "
            >
              <div className="w-14 h-14 mx-auto mb-3 rounded-full grid place-items-center bg-white/10">
                <span className="text-xl">🧾</span>
              </div>
              <p className="text-sm text-white/70 mb-3">No trades yet</p>
              <Link
                to="/add-trade"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold active:scale-95 transition"
                style={{ backgroundColor: LIME, color: "#0a0a0a" }}
              >
                <span>➕</span> Add your first trade
              </Link>
            </div>
          )}
        </section>
      </main>

      {/* Floating Action Button (centre) */}
      <Link
        to="/add-trade"
        aria-label="Add Trade"
        className="
          fixed bottom-[calc(72px+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2
          w-16 h-16 rounded-2xl grid place-items-center font-extrabold text-lg
          shadow-[0_20px_40px_-12px_rgba(145,219,50,0.6)]
          active:scale-95 transition
        "
        style={{ backgroundColor: LIME, color: "#0a0a0a" }}
      >
        +
      </Link>
    </div>
  );
}