import React, { useMemo } from "react";
import DraggableList from "../components/DraggableList";
import { useSettings } from "../context/SettingsContext";

const ALL_WIDGETS = [
  { key: "profit", label: "Net Profit", desc: "Shows total net profit with tax option." },
  { key: "tax", label: "EA Tax Paid", desc: "Total coin tax paid and % of gross." },
  { key: "balance", label: "Starting Balance", desc: "Initial bank and ROI hint." },
  { key: "trades", label: "Total Trades", desc: "Trade count + average profit." },
  { key: "roi", label: "ROI %", desc: "Return on initial starting balance." },
  { key: "winrate", label: "Win Rate", desc: "Winning vs losing trades." },
  { key: "best_trade", label: "Best Trade", desc: "Top profit single trade." },
  { key: "avg_profit", label: "Avg Profit / Trade", desc: "Average profit per executed trade." },
  { key: "volume", label: "Coin Volume", desc: "Total buy + sell coin volume." },
  { key: "profit_trend", label: "Profit Trend (7D)", desc: "Simple 7-day sparkline." },
  { key: "latest_trade", label: "Latest Trade", desc: "Most recent trade summary." },
];

export default function SettingsWidgets() {
  const {
    isLoading,
    error,
    visible_widgets,
    widget_order,
    saveSettings,
    include_tax_in_profit,
  } = useSettings();

  const visibleSet = useMemo(() => new Set(visible_widgets), [visible_widgets]);

  const toggle = (key) => {
    const next = new Set(visible_widgets);
    if (next.has(key)) next.delete(key);
    else next.add(key);

    // Keep order stable: if enabling, insert at end; if disabling, just remove
    const visArr = [...next];
    const order = widget_order.filter((k) => visArr.includes(k));
    // Add any newly-enabled keys not present in order to the end
    for (const k of visArr) if (!order.includes(k)) order.push(k);

    saveSettings({ visible_widgets: visArr, widget_order: order });
  };

  const reorderVisible = (newOrder) => {
    // Only keys that are visible should be in this list
    const sanitized = newOrder.filter((k) => visibleSet.has(k));
    // Keep hidden ones at the back in their old order
    const hidden = widget_order.filter((k) => !visibleSet.has(k));
    saveSettings({ widget_order: [...sanitized, ...hidden] });
  };

  const resetToDefaults = () => {
    const defaults = ALL_WIDGETS.map((w) => w.key);
    saveSettings({ visible_widgets: defaults, widget_order: defaults });
  };

  if (isLoading) return <div className="p-4">Loading settings…</div>;
  if (error) return <div className="p-4 text-red-500">{String(error)}</div>;

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Dashboard Widgets</h1>

      <div className="bg-gray-900/70 rounded-2xl border border-gray-800 p-4 mb-6">
        <h2 className="text-lg font-semibold mb-2">Visibility</h2>
        <p className="text-sm text-gray-400 mb-4">
          Toggle which widgets appear on your Dashboard. Then reorder the visible set below.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ALL_WIDGETS.map((w) => (
            <label
              key={w.key}
              className="flex items-start gap-3 p-3 rounded-xl border border-gray-800 bg-gray-900 hover:border-gray-700 transition-colors cursor-pointer"
            >
              <input
                type="checkbox"
                className="mt-1"
                checked={visibleSet.has(w.key)}
                onChange={() => toggle(w.key)}
              />
              <div>
                <div className="font-medium">{w.label}</div>
                <div className="text-xs text-gray-400">{w.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="bg-gray-900/70 rounded-2xl border border-gray-800 p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Order (Visible Only)</h2>
          <button
            onClick={resetToDefaults}
            className="text-sm px-3 py-1 rounded-lg bg-gray-800 border border-gray-700 hover:border-gray-600"
          >
            Reset to defaults
          </button>
        </div>
        <p className="text-sm text-gray-400 mb-4">
          Drag to change the order of widgets shown on your Dashboard.
        </p>

        <DraggableList
          items={widget_order.filter((k) => visibleSet.has(k))}
          onChange={reorderVisible}
          renderItem={(key) => {
            const meta = ALL_WIDGETS.find((w) => w.key === key);
            return (
              <div className="flex flex-col">
                <span className="font-medium">{meta?.label ?? key}</span>
                <span className="text-xs text-gray-400">{meta?.desc ?? ""}</span>
              </div>
            );
          }}
        />
      </div>

      <div className="bg-gray-900/70 rounded-2xl border border-gray-800 p-4">
        <h2 className="text-lg font-semibold mb-2">Preferences</h2>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={include_tax_in_profit}
            onChange={(e) => saveSettings({ include_tax_in_profit: e.target.checked })}
          />
          <span className="text-sm">Include EA tax in profit numbers</span>
        </label>
      </div>
    </div>
  );
}
