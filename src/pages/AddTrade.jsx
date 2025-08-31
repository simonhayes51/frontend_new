import React, { useMemo, useState, useEffect } from "react";
import { useSettings } from "../context/SettingsContext";
import { useNavigate } from "react-router-dom";

const parseNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const eaTaxEach = (sell) => Math.floor(parseNum(sell) * 0.05);
const netEach = (sell) => parseNum(sell) - eaTaxEach(sell);
const profitEach = (buy, sell) => netEach(sell) - parseNum(buy);

// If you have an env for API base, use it. Otherwise, relative works when
// frontend is served behind the same domain/proxy as the backend.
const API_BASE = import.meta?.env?.VITE_API_BASE || "";

export default function AddTrade() {
  const navigate = useNavigate();
  const settings = (typeof useSettings === "function" ? useSettings() : {}) || {};

  const formatCurrency =
    typeof settings.formatCurrency === "function"
      ? settings.formatCurrency
      : (n) => (Number(n) || 0).toLocaleString("en-GB");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    player: "",
    version: "",
    platform: settings?.default_platform || "Console",
    quantity: settings?.default_quantity || 1,
    buy: "",
    sell: "",
    tag: "",
    timestamp: new Date().toISOString(),
  });

  // keep defaults in sync if user changes settings elsewhere
  useEffect(() => {
    if (settings?.default_platform) {
      setForm((f) => ({ ...f, platform: settings.default_platform }));
    }
  }, [settings?.default_platform]);

  useEffect(() => {
    if (settings?.default_quantity) {
      setForm((f) => ({ ...f, quantity: settings.default_quantity }));
    }
  }, [settings?.default_quantity]);

  const qty = Math.max(1, parseNum(form.quantity));
  const buy = parseNum(form.buy);
  const sell = parseNum(form.sell);

  const taxTotal = useMemo(() => eaTaxEach(sell) * qty, [sell, qty]);
  const profitBeforeTax = useMemo(() => (sell - buy) * qty, [sell, buy, qty]);
  const profitAfterTax = useMemo(() => (profitEach(buy, sell) * qty), [buy, sell, qty]);

  const canSubmit =
    form.player.trim().length > 0 &&
    sell > 0 &&
    buy >= 0 &&
    qty > 0;

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!canSubmit || submitting) return;

    // Backend expects: player, version, buy, sell, quantity, platform, tag
    const payload = {
      player: form.player.trim(),
      version: form.version.trim() || "N/A",
      platform: form.platform || "Console",
      quantity: qty,
      buy,
      sell,
      // Send tag, default to "General" so your backend required_fields passes
      tag: (form.tag || "").trim() || "General",
      // backend calculates profit/ea_tax again (authoritative),
      // no need to send profit/ea_tax from client
      timestamp: form.timestamp || new Date().toISOString(),
    };

    try {
      setSubmitting(true);
      const res = await fetch(`${API_BASE}/api/trades`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // IMPORTANT for your SessionMiddleware
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.detail || `HTTP ${res.status}`);
      }

      // success – go to Trades list
      navigate("/trades");
    } catch (err) {
      console.error("[AddTrade] submit failed:", err);
      setError(String(err.message || err));
      // keep user on the form; they can retry
    } finally {
      setSubmitting(false);
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
              placeholder="optional (e.g., SBC fodder, flip)"
            />
          </label>
        </div>

        {/* Live preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-3">
            <div className="text-xs text-gray-400">EA Tax (5%)</div>
            <div className="text-lg font-semibold text-red-400">
              {formatCurrency(taxTotal)} coins
            </div>
          </div>
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-3">
            <div className="text-xs text-gray-400">Profit (before tax)</div>
            <div className="text-lg font-semibold">
              {formatCurrency(profitBeforeTax)} coins
            </div>
          </div>
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-3">
            <div className="text-xs text-gray-400">Profit (after tax)</div>
            <div className={`text-lg font-semibold ${profitAfterTax >= 0 ? "text-green-400" : "text-red-400"}`}>
              {formatCurrency(profitAfterTax)} coins
            </div>
          </div>
        </div>

        {error && (
          <div className="text-red-400 text-sm">{error}</div>
        )}

        <div className="flex items-center gap-2 pt-2">
          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              canSubmit && !submitting
                ? "bg-[#91db32] hover:opacity-90 text-black"
                : "bg-gray-800 text-gray-500 cursor-not-allowed"
            }`}
          >
            {submitting ? "Saving..." : "Save Trade"}
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
