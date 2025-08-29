// Updated Dashboard component with settings integration (hardened)
import React from "react";
import { useDashboard } from "../context/DashboardContext";
import { useSettings } from "../context/SettingsContext";

const Dashboard = () => {
  // Pull from contexts
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
    calculateProfit,
    visible_widgets: rawWidgets,
    include_tax_in_profit,
    isLoading: settingsLoading,
  } = useSettings();

  // ✅ Safe fallbacks so UI never crashes on first render / bad data
  const trades = Array.isArray(rawTrades) ? rawTrades : [];
  const visible_widgets = Array.isArray(rawWidgets) ? rawWidgets : [];

  if (isLoading || settingsLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-800 rounded mb-4"></div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-800 rounded-lg p-4">
                <div className="h-4 bg-gray-700 rounded mb-2"></div>
                <div className="h-8 bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) return <div className="text-red-500 p-4">{String(error)}</div>;

  // Derived helpers (guard against NaN)
  const gross = (netProfit ?? 0) + (taxPaid ?? 0);
  const taxPct = gross > 0 ? ((taxPaid ?? 0) / gross) * 100 : 0;

  // Widget components
  const widgets = {
    profit: (
      <div className="bg-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-medium text-gray-300">Net Profit</h2>
        <p className="text-2xl font-bold text-green-400">
          {formatCurrency(netProfit ?? 0)} coins
        </p>
        {!include_tax_in_profit && (
          <p className="text-sm text-gray-400">
            (Before tax: {formatCurrency(gross)} coins)
          </p>
        )}
      </div>
    ),
    tax: (
      <div className="bg-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-medium text-gray-300">EA Tax Paid</h2>
        <p className="text-2xl font-bold text-red-400">
          {formatCurrency(taxPaid ?? 0)} coins
        </p>
        <p className="text-sm text-gray-400">
          {taxPaid > 0 ? `${taxPct.toFixed(1)}% of gross profit` : "No tax yet"}
        </p>
      </div>
    ),
    balance: (
      <div className="bg-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-medium text-gray-300">Starting Balance</h2>
        <p className="text-2xl font-bold text-blue-400">
          {formatCurrency(startingBalance ?? 0)} coins
        </p>
        {(startingBalance ?? 0) > 0 && (netProfit ?? 0) > 0 && (
          <p className="text-sm text-gray-400">
            ROI: {(((netProfit ?? 0) / (startingBalance ?? 1)) * 100).toFixed(1)}%
          </p>
        )}
      </div>
    ),
    trades: (
      <div className="bg-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-medium text-gray-300">Total Trades</h2>
        <p className="text-2xl font-bold text-purple-400">{trades.length}</p>
        {trades.length > 0 && (
          <p className="text-sm text-gray-400">
            Avg profit:{" "}
            {formatCurrency(
              (netProfit ?? 0) / (trades.length || 1) // avoid divide-by-zero
            )}{" "}
            coins
          </p>
        )}
      </div>
    ),
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="text-sm text-gray-400">Last updated: {formatDate(new Date())}</div>
      </div>

      {/* Stats Grid - Only show widgets that are enabled in settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {visible_widgets.map((widgetKey) => widgets[widgetKey]).filter(Boolean)}
      </div>

      {/* Recent Trades Section */}
      <div className="bg-gray-900 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Trades</h2>
          <span className="text-sm text-gray-400">
            Showing last {Math.min(trades.length, 10)} trades
          </span>
        </div>

        {trades.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">No trades logged yet</div>
            <p className="text-sm text-gray-500">
              Start by adding your first trade to see your progress here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {trades.slice(0, 10).map((trade, i) => {
              const baseProfit = trade?.profit ?? 0;
              const tax = trade?.ea_tax ?? 0;
              const displayProfit = include_tax_in_profit ? baseProfit - tax : baseProfit;

              return (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{trade?.player ?? "Unknown"}</span>
                      <span className="text-sm text-gray-400">
                        ({trade?.version ?? "N/A"})
                      </span>
                      {trade?.tag && (
                        <span className="text-xs bg-gray-700 px-2 py-1 rounded-full">
                          {trade.tag}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      {formatCurrency(trade?.buy ?? 0)} → {formatCurrency(trade?.sell ?? 0)}
                      {trade?.quantity > 1 && ` (${trade.quantity}x)`}
                      {" • "}{trade?.platform ?? "Console"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`font-semibold ${
                        displayProfit >= 0 ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {displayProfit >= 0 ? "+" : ""}
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

        {trades.length > 10 && (
          <div className="mt-4 text-center">
            <button className="text-blue-400 hover:text-blue-300 text-sm">
              View all {trades.length} trades →
            </button>
          </div>
        )}
      </div>

      {/* Quick Stats Bar */}
      {trades.length > 0 && (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              {trades.filter((t) => (t?.profit ?? 0) > 0).length}
            </div>
            <div className="text-sm text-gray-400">Winning Trades</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400">
              {trades.filter((t) => (t?.profit ?? 0) < 0).length}
            </div>
            <div className="text-sm text-gray-400">Losing Trades</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">
              {trades.length > 0
                ? (
                    (trades.filter((t) => (t?.profit ?? 0) > 0).length / trades.length) *
                    100
                  ).toFixed(1)
                : 0}
              %
            </div>
            <div className="text-sm text-gray-400">Win Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">
              {trades.length > 0
                ? formatCurrency(
                    Math.max(...trades.map((t) => t?.profit ?? Number.NEGATIVE_INFINITY)) ||
                      0
                  )
                : 0}
            </div>
            <div className="text-sm text-gray-400">Best Trade</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
