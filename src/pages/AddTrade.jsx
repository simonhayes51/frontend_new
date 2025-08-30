import React, { useMemo, useState } from "react";
import { useDashboard } from "../context/DashboardContext";
import { useSettings } from "../context/SettingsContext";
import { useNavigate } from "react-router-dom";

const parseNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export default function AddTrade() {
  const navigate = useNavigate();

  // Contexts (guarded)
  const dash = useDashboard?.() || {};
  const settings = useSettings?.() || {};

  const addTrade =
    typeof dash.addTrade === "function"
      ? dash.addTrade
      : (t) => {
          console.warn("[AddTrade] dash.addTrade missing; trade:", t);
        };

  const formatCurrency =
    typeof settings.formatCurrency === "function"
      ? settings.formatCurrency
      : (n) => (Number(n) || 0).toLocaleString("en-GB");

  // Form state (never iterable-destructured)
  const [form, setForm] = useState({
    player: "",
    version: "",
    platform: "Console",
    quantity: 1,
    buy: "",
    sell: "",
    tag: "",
    timestamp: new Date().toISOString(),
  });

  const qty = Math.max(1, parseNum(form.quantity));
  const buy = parseNum(form.buy);
  const sell = parseNum(form.sell);

  // FUT: EA tax is 5% of sell price
  const eaTax = useMemo(() => Math.round(sell * qty * 0.05), [sell, qty]);

  // In your data model, `profit` is BEFORE tax (the UI subtracts tax if the user wants)
  const baseProfit = useMemo(() => (sell - buy) * qty, [sell, buy, qty]);

  const canSubmit =
    form.player.trim().length > 0 &&
    sell > 0 &&
    buy >= 0 &&
    qty > 0;

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    const trade = {
      player: form.player.trim(),
      version: form.version.trim() || "N/A",
      platform: form.platform || "Console",
      quantity: qty,
      buy,
      sell,
      profit: baseProfit,       // stored pre-tax (matches your Dashboard logic)
      ea_tax: eaTax,
      tag: form.tag.trim() || undefined,
      timestamp: form.timestamp || new Date().toISOString(),
    };

    try {
      addTrade(trade);
      navigate("/trades");
    } catch (err) {
      console.error("Failed to add trade", err);
      alert("Failed to add trade. Check console for details.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Add Trade</h1>

      <form onSubmit={onSubmit} className="space-y-4 bg-gray-900/70 border border-gray-800 p-4 rounded-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-300">Player *</span>
            <input
              className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-200"
              name="player"
              value={form.player}
              onChange={onChange}
              placeholder="e.g., Mbappé"
              required
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-300">Version</span>
            <input
              className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-200"
              name="version"
              value={form.version}
              onChange={onChange}
              placeholder="e.g., Gold, IF, TOTW"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-300">Platform</span>
            <select
              className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-200"
              name="platform"
              value={form.platform}
              onChange={onChange}
            >
              <option value="Console">Console</option>
              <option value="PlayStation">PlayStation</option>
              <option value="Xbox">Xbox</option>
              <option value="PC">PC</option>
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-300">Quantity</span>
            <input
              type="number"
              min={1}
              className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-200"
              name="quantity"
              value={form.quantity}
              onChange={onChange}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-300">Buy Price</span>
            <input
              type="number"
              min={0}
              className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-200"
              name="buy"
              value={form.buy}
              onChange={onChange}
              placeholder="e.g., 12000"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-300">Sell Price</span>
            <input
              type="number"
              min={0}
              className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-200"
              name="sell"
              value={form.sell}
              onChange={onChange}
              placeholder="e.g., 15000"
              required
            />
          </label>

          <label className="flex flex-col gap-1 md:col-span-2">
            <span className="text-sm text-gray-300">Tag</span>
            <input
              className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-200"
              name="tag"
              value={form.tag}
              onChange={onChange}
              placeholder="optional label (e.g., SBC fodder, flip)"
            />
          </label>
        </div>

        {/* Live preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-3">
            <div className="text-xs text-gray-400">EA Tax (5%)</div>
            <div className="text-lg font-semibold text-red-400">{formatCurrency(eaTax)} coins</div>
          </div>
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-3">
            <div className="text-xs text-gray-400">Profit (before tax)</div>
            <div className="text-lg font-semibold">{formatCurrency(baseProfit)} coins</div>
          </div>
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-3">
            <div className="text-xs text-gray-400">Profit (after tax)</div>
            <div className={`text-lg font-semibold ${baseProfit - eaTax >= 0 ? "text-green-400" : "text-red-400"}`}>
              {formatCurrency(baseProfit - eaTax)} coins
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            type="submit"
            disabled={!canSubmit}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              canSubmit
                ? "bg-purple-600 hover:bg-purple-500 text-white"
                : "bg-gray-800 text-gray-500 cursor-not-allowed"
            }`}
          >
            Save Trade
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-lg text-sm bg-gray-900 border border-gray-700 hover:border-gray-600 text-gray-200"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
