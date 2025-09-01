// src/pages/AddTrade.jsx
import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useDashboard } from "../context/DashboardContext";
import { useSettings } from "../context/SettingsContext";

const API_BASE = import.meta.env.VITE_API_URL || "";

const toNum = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

/** ---- lightweight player search (endpoint-agnostic) ---- */
const ENDPOINTS = [
  "/api/player-search",
  "/api/players/search",
  "/api/search/players",
  "/api/search",
];

function pickName(p) {
  return (
    p?.name ||
    p?.player_name ||
    p?.full_name ||
    [p?.first_name, p?.last_name].filter(Boolean).join(" ") ||
    p?.shortName ||
    ""
  );
}
function pickVersion(p) {
  return (
    p?.version ||
    p?.card_type ||
    p?.rarity ||
    p?.program ||
    p?.type ||
    p?.cardType ||
    ""
  );
}
function pickRating(p) {
  return p?.rating ?? p?.ovr ?? p?.overall ?? p?.r ?? null;
}
function normaliseResults(res) {
  const arr = Array.isArray(res)
    ? res
    : res?.results || res?.players || res?.data || [];
  return (arr || [])
    .map((p) => ({
      id:
        p?.id ||
        p?.pid ||
        p?.player_id ||
        p?.futbin_id ||
        p?.futgg_id ||
        `${pickName(p)}-${pickRating(p) || ""}`,
      name: pickName(p),
      version: pickVersion(p),
      rating: pickRating(p),
      raw: p,
    }))
    .filter((x) => x.name);
}

async function searchPlayersAPI(query, signal) {
  if (!query || query.trim().length < 2) return [];
  for (const path of ENDPOINTS) {
    try {
      const url = `${API_BASE}${path}?q=${encodeURIComponent(query.trim())}`;
      const r = await fetch(url, { signal });
      if (!r.ok) continue;
      const data = await r.json();
      const list = normaliseResults(data);
      if (list.length) return list.slice(0, 10);
    } catch {
      // try next endpoint
    }
  }
  return [];
}

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

  // ---------- autocomplete state ----------
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const [searching, setSearching] = useState(false);
  const acRef = useRef(null);
  const abortRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function onDocClick(e) {
      if (!acRef.current) return;
      if (!acRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // Debounced search whenever form.player changes
  useEffect(() => {
    const q = form.player;
    if (!q || q.trim().length < 2) {
      setSuggestions([]);
      setOpen(false);
      setSearching(false);
      return;
    }

    setSearching(true);
    setOpen(true);
    setHighlight(-1);

    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;

    const t = setTimeout(async () => {
      try {
        const list = await searchPlayersAPI(q, controller.signal);
        setSuggestions(list);
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 200); // debounce

    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [form.player]);

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

  const chooseSuggestion = useCallback((s) => {
    setForm((prev) => ({
      ...prev,
      player: s.name,
      version: s.version || prev.version, // auto-fill version; preserve if empty from API
    }));
    setOpen(false);
    setHighlight(-1);
  }, []);

  const handleNameKeyDown = (e) => {
    if (!open || !suggestions.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      if (highlight >= 0) {
        e.preventDefault();
        chooseSuggestion(suggestions[highlight]);
      } else if (suggestions.length === 1) {
        e.preventDefault();
        chooseSuggestion(suggestions[0]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

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
        setSuggestions([]);
        setOpen(false);
      } else {
        setMessage(
          "Failed to log trade: " + (result?.message || "Unknown error")
        );
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
            message.toLowerCase().includes("success")
              ? "bg-green-800"
              : "bg-red-800"
          }`}
        >
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Player with autocomplete */}
          <Field label="Player Name">
            <div className="relative" ref={acRef}>
              <input
                name="player"
                placeholder="e.g. Cristiano Ronaldo"
                autoComplete="off"
                value={form.player}
                onChange={handleChange}
                onKeyDown={handleNameKeyDown}
                onFocus={() => {
                  if (form.player.trim().length >= 2 && suggestions.length) {
                    setOpen(true);
                  }
                }}
                className="w-full p-3 bg-gray-800 rounded-lg"
                required
              />

              {open && (
                <div className="absolute z-20 mt-1 w-full max-h-64 overflow-auto rounded-lg border border-gray-700 bg-gray-800 shadow-lg">
                  {searching && (
                    <div className="px-3 py-2 text-sm text-gray-400">
                      Searching…
                    </div>
                  )}
                  {!searching && suggestions.length === 0 && (
                    <div className="px-3 py-2 text-sm text-gray-400">
                      No matches
                    </div>
                  )}
                  {!searching &&
                    suggestions.map((s, idx) => (
                      <button
                        type="button"
                        key={s.id || idx}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          chooseSuggestion(s);
                        }}
                        onMouseEnter={() => setHighlight(idx)}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-700 ${
                          idx === highlight ? "bg-gray-700" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{s.name}</div>
                          {s.rating != null && (
                            <span className="ml-3 inline-flex items-center rounded-full bg-gray-900 px-2 py-0.5 text-xs">
                              {s.rating}
                            </span>
                          )}
                        </div>
                        {s.version && (
                          <div className="text-xs text-gray-400">{s.version}</div>
                        )}
                      </button>
                    ))}
                </div>
              )}
            </div>
          </Field>

          {/* Auto-filled but still editable */}
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
