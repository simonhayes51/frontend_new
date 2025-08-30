import React from "react";
import { useSettings } from "../context/SettingsContext";

const ALL_WIDGETS = [
  { key: "profit", label: "Net Profit" },
  { key: "tax", label: "EA Tax Paid" },
  { key: "balance", label: "Starting Balance" },
  { key: "trades", label: "Total Trades" },
  { key: "roi", label: "ROI" },
  { key: "winrate", label: "Win Rate" },
  { key: "best_trade", label: "Best Trade" },
  { key: "avg_profit", label: "Average Profit / Trade" },
  { key: "volume", label: "Coin Volume" },
  { key: "profit_trend", label: "Profit Trend (7D)" },
  { key: "latest_trade", label: "Latest Trade" },
  { key: "top_earner", label: "Top Earner" },
];

export default function SettingsWidgets() {
  const {
    include_tax_in_profit,
    visible_widgets,
    recent_trades_limit,
    saveSettings,
  } = useSettings();

  const toggleWidget = (key) => {
    if (visible_widgets.includes(key)) {
      saveSettings({ visible_widgets: visible_widgets.filter((w) => w !== key) });
    } else {
      saveSettings({ visible_widgets: [...visible_widgets, key] });
    }
  };

  const resetDefaults = () => {
    localStorage.removeItem("user_settings");
    window.location.reload();
  };

  return (
    <div>
      {/* Profit calc */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Profit Calculation</h2>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={include_tax_in_profit}
            onChange={(e) => saveSettings({ include_tax_in_profit: e.target.checked })}
          />
          <span className="text-gray-300">Include EA Tax in profit numbers</span>
        </label>
      </div>

      {/* Recent trades limit */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Recent Trades Limit</h2>
        <select
          className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-200"
          value={recent_trades_limit}
          onChange={(e) => saveSettings({ recent_trades_limit: Number(e.target.value) })}
        >
          <option value={5}>Show last 5</option>
          <option value={10}>Show last 10</option>
          <option value={20}>Show last 20</option>
        </select>
      </div>

      {/* Widget toggles */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Visible Widgets</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ALL_WIDGETS.map((w) => (
            <label
              key={w.key}
              className="flex items-center gap-3 bg-gray-900 rounded-lg p-3 border border-gray-700 hover:border-gray-600 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={visible_widgets.includes(w.key)}
                onChange={() => toggleWidget(w.key)}
              />
              <span className="text-gray-200">{w.label}</span>
            </label>
          ))}
        </div>
      </div>

      <button
        onClick={resetDefaults}
        className="text-sm px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 hover:border-gray-600"
      >
        Reset to defaults
      </button>
    </div>
  );
}