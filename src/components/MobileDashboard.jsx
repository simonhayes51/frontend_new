import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { useDashboard } from "../context/DashboardContext";
import { useSettings } from "../context/SettingsContext";
import { useAuth } from "../context/AuthContext";

const AVATAR_FALLBACK = (name = "?") =>
  name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export default function MobileDashboard() {
  const { netProfit, taxPaid, startingBalance, trades } = useDashboard();
  const { formatCurrency, formatDate } = useSettings();
  const { user } = useAuth();

  const grossProfit = netProfit + taxPaid;
  const profitPercentage =
    startingBalance > 0 ? (netProfit / startingBalance) * 100 : 0;
  const avgProfit = trades.length > 0 ? netProfit / trades.length : 0;

  const recentTrades = useMemo(() => trades.slice(0, 6), [trades]);

  const stats = [
    {
      title: "Net Profit",
      value: formatCurrency(netProfit),
      color: netProfit >= 0 ? "text-[#91db32]" : "text-red-400",
      bg: netProfit >= 0 ? "bg-[#91db32]/10" : "bg-red-500/10",
      border: netProfit >= 0 ? "border-[#91db32]/25" : "border-red-500/20",
      subtitle: `${profitPercentage >= 0 ? "+" : ""}${profitPercentage.toFixed(
        1
      )}%`,
      icon: netProfit >= 0 ? "📈" : "📉",
    },
    {
      title: "EA Tax Paid",
      value: formatCurrency(taxPaid),
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      subtitle:
        grossProfit > 0
          ? `${((taxPaid / grossProfit) * 100).toFixed(1)}% of gross`
          : "0%",
      icon: "🏛️",
    },
    {
      title: "Total Trades",
      value: trades.length.toString(),
      color: "text-sky-400",
      bg: "bg-sky-500/10",
      border: "border-sky-500/20",
      subtitle: `Avg: ${formatCurrency(avgProfit)}`,
      icon: "🎯",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Safe-area top spacer for notches */}
      <div className="h-[env(safe-area-inset-top)]" />

      {/* Top App Bar */}
      <header className="sticky top-0 z-20 bg-gray-900/95 backdrop-blur border-b border-gray-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user?.global_name || "User"}
                className="w-10 h-10 rounded-full border-2 border-[#91db32]/60 object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full border-2 border-[#91db32]/60 bg-gray-800 grid place-items-center text-sm font-semibold">
                {AVATAR_FALLBACK(user?.global_name)}
              </div>
            )}
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#91db32] border-2 border-gray-900" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-300">Welcome back</p>
            <p className="font-semibold leading-tight">
              {user?.global_name || "Trader"}
            </p>
          </div>

          {/* Quick Add FAB (small) */}
          <Link
            to="/add-trade"
            aria-label="Add Trade"
            className="px-3 py-2 rounded-lg bg-[#91db32] active:scale-95 transition shadow hover:opacity-90 text-gray-900 font-semibold"
          >
            + Trade
          </Link>
        </div>
      </header>

      {/* Content */}
      <main
        className="
          px-4 pt-4 pb-[calc(80px+env(safe-area-inset-bottom))] 
          /* bottom padding so content never hides behind the nav */
        "
      >
        {/* Stats Grid */}
        <section className="mb-5">
          <h2 className="text-base font-semibold mb-3">Portfolio Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {stats.map((s, i) => (
              <div
                key={i}
                className={`${s.bg} ${s.border} border rounded-2xl p-4 shadow-sm`}
              >
                <div className="flex items-start gap-3">
                  <div className="shrink-0 px-2 py-1.5 bg-white/10 rounded-lg">
                    <span className="text-lg leading-none">{s.icon}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {s.title}
                    </p>
                    <p className={`text-xl font-bold ${s.color} truncate`}>
                      {s.value}
                    </p>
                    <p className="text-[11px] mt-0.5 text-gray-500 dark:text-gray-400">
                      {s.subtitle}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="mb-6">
          <h3 className="text-base font-semibold mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/add-trade"
              className="rounded-2xl p-4 bg-[#91db32] text-gray-900 font-semibold shadow hover:opacity-90 active:scale-95 transition"
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl leading-none">➕</span>
                <span className="text-sm">Add Trade</span>
              </div>
            </Link>

            <Link
              to="/trades"
              className="rounded-2xl p-4 bg-gray-800 text-white shadow hover:bg-gray-700 active:scale-95 transition"
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl leading-none">📋</span>
                <span className="text-sm">View Trades</span>
              </div>
            </Link>

            <Link
              to="/analytics"
              className="rounded-2xl p-4 bg-gray-800 text-white shadow hover:bg-gray-700 active:scale-95 transition"
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl leading-none">📊</span>
                <span className="text-sm">Analytics</span>
              </div>
            </Link>

            <Link
              to="/player-search"
              className="rounded-2xl p-4 bg-gray-800 text-white shadow hover:bg-gray-700 active:scale-95 transition"
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl leading-none">🔍</span>
                <span className="text-sm">Search Players</span>
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
              className="text-[#91db32] text-sm font-medium hover:underline"
            >
              View all
            </Link>
          </div>

          {recentTrades.length ? (
            <ul className="space-y-2.5">
              {recentTrades.map((t, i) => (
                <li
                  key={i}
                  className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-3.5 shadow-sm active:scale-[0.99] transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#91db32] to-[#91db32]/60 text-gray-900 grid place-items-center font-bold text-xs">
                      {t.player?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">
                        {t.player}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t.version} • {t.platform}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p
                        className={`text-sm font-semibold ${
                          t.profit >= 0 ? "text-[#2ecc71]" : "text-red-500"
                        }`}
                      >
                        {t.profit >= 0 ? "+" : ""}
                        {formatCurrency(t.profit)}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {formatDate(t.timestamp).split(",")[0]}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-700 grid place-items-center mx-auto mb-3">
                <span className="text-xl">📦</span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                No trades yet
              </p>
              <Link
                to="/add-trade"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#91db32] text-gray-900 font-semibold hover:opacity-90 active:scale-95 transition"
              >
                <span>➕</span>
                Add your first trade
              </Link>
            </div>
          )}
        </section>
      </main>

      {/* Bottom safe-area spacer is handled by nav component height */}
    </div>
  );
}