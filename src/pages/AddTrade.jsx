// src/pages/AddTrade.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useDashboard } from "../context/DashboardContext";
import { useSettings } from "../context/SettingsContext";

const toNum = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

export default function AddTrade() {
  const { addTrade } = useDashboard();
  const {
    default_platform = "Console",
    custom_tags = [],
    isLoading: settingsLoading,
  } = useSettings();

  const [form, setForm] = useState({
    player: "",
    version: "",
    buy: "",
    sell: "",
    quantity: 1,
    platform: "Console",
    tag: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Adopt settings when they arrive
  useEffect(() => {
    if (!settingsLoading && default_platform) {
      setForm((s) => ({ ...s, platform: default_platform }));
    }
  }, [settingsLoading, default_platform]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Coerce numeric fields before posting
    const payload = {
      player: form.player.trim(),
      version: form.version.trim(),
      buy: toNum(form.buy),
      sell: toNum(form.sell),
      quantity: toNum(form.quantity, 1),
      platform: form.platform || "Console",
      tag: form.tag.trim(),
      notes: form.notes.trim(),
    };

    try {
      const result = await addTrade(payload);

      if (result?.success) {
        setMessage("Trade logged successfully!");
        // Clear entry fields; keep platform & quantity for speed
        setForm((s) => ({
          ...s,
          player: "",
          version: "",
          buy: "",
          sell: "",
          tag: "",
          notes: "",
        }));
      } else {
        setMessage("Failed to log trade: " + (result?.message || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      setMessage("Failed to log trade.");
    } finally {
      setLoading(false);
    }
  };

  const allTags = useMemo(() => {
    const common = ["Snipe", "Investment", "Flip", "Pack Pull", "SBC", "Risky"];
    // de-dupe
    return [...new Set([...(custom_tags || []), ...common])];
  }, [custom_tags]);

  // Calculated preview numbers (always numeric)
  const qty = toNum(form.quantity, 1);
  const buy = toNum(form.buy, 0);
  const sell = toNum(form.sell, 0);
  const gross = (sell - buy) * qty;
  const tax = Math.floor(sell * qty * 0.05);
  const net = gross - tax;

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Add Trade</h1>

      {message && (
        <div
          className={`mb-4 p-3 rounded ${
            message.toLowerCase().includes("success") ? "bg-green-800" : "bg-red-800"
          }`}
        >
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Player Name">
            <input
              name="player"
              placeholder="e.g. Cristiano Ronaldo"
              value={form.player}
              onChange={handleChange}
              className="w-full p-3 bg-gray-800 rounded-lg"
              required
            />
          </Field>

          <Field label="Version">
            <input
              name="version"
              placeholder="e.g. Gold Rare, TOTW"
              value={form.version}
              onChange={handleChange}
              className="w-full p-3 bg-gray-800 rounded-lg"
              required
            />
          </Field>

          <Field label="Buy Price">
            <input
              name="buy"
              type="number"
              inputMode="numeric"
              placeholder="Purchase price"
              value={form.buy}
              onChange={handleChange}
              className="w-full p-3 bg-gray-800 rounded-lg"
              required
            />
          </Field>

          <Field label="Sell Price">
            <input
              name="sell"
              type="number"
              inputMode="numeric"
              placeholder="Sale price"
              value={form.sell}
              onChange={handleChange}
              className="w-full p-3 bg-gray-800 rounded-lg"
              required
            />
          </Field>

          <Field label="Quantity">
            <input
              name="quantity"
              type="number"
              min="1"
              step="1"
              placeholder="Number of cards"
              value={form.quantity}
              onChange={handleChange}
              className="w-full p-3 bg-gray-800 rounded-lg"
              required
            />
          </Field>

          <Field label="Platform">
            <select
              name="platform"
              value={form.platform}
              onChange={handleChange}
              className="w-full p-3 bg-gray-800 rounded-lg"
            >
              <option value="Console">Console</option>
              <option value="PC">PC</option>
              <option value="PS">PS</option>
              <option value="Xbox">Xbox</option>
            </select>
          </Field>
        </div>

        <div>
          <label className="block mb-2 font-medium">Tag</label>
          <div className="flex gap-2">
            <input
              name="tag"
              placeholder="Custom tag or select from dropdown"
              value={form.tag}
              onChange={handleChange}
              className="flex-1 p-3 bg-gray-800 rounded-lg"
            />
            <select
              onChange={(e) => setForm((s) => ({ ...s, tag: e.target.value }))}
              className="p-3 bg-gray-800 rounded-lg"
              value=""
            >
              <option value="">Quick Tags</option>
              {allTags.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {(buy > 0 || sell > 0) && qty > 0 && (
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Trade Preview</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <PreviewItem label="Gross Profit">
                {gross.toLocaleString()} coins
              </PreviewItem>
              <PreviewItem label="EA Tax (5%)" className="text-red-400">
                -{tax.toLocaleString()} coins
              </PreviewItem>
              <PreviewItem
                label="Net Profit"
                className={net >= 0 ? "text-green-400" : "text-red-400"}
              >
                {net.toLocaleString()} coins
              </PreviewItem>
            </div>
          </div>
        )}

        <button
          disabled={loading}
          type="submit"
          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {loading ? "Logging Trade..." : "Log Trade"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block mb-2 font-medium">{label}</span>
      {children}
    </label>
  );
}

function PreviewItem({ label, children, className = "" }) {
  return (
    <div>
      <span className="text-gray-400">{label}:</span>
      <p className={`font-mono ${className}`}>{children}</p>
    </div>
  );
}