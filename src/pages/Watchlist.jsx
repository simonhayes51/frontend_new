// src/pages/Watchlist.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Plus, RefreshCcw, Trash2, Settings as Cog } from "lucide-react";
import { apiFetch } from "../api/http";

/**
 * Row/table layout matching the “good” screenshot:
 * - Tight rows
 * - Change column shows absolute + pct with red/green color
 * - Quick refresh & remove per row
 * - “Smart” (sort) selector preserved as a simple local UI
 */

const ACCENT = "#91db32";

function fmtCoins(n) {
  const v = Number(n) || 0;
  return v.toLocaleString("en-GB") + "c";
}
function pct(a, b) {
  if (typeof a !== "number" || typeof b !== "number" || !b) return 0;
  return ((a - b) / b) * 100;
}

export default function Watchlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    card_id: "",
    player_name: "",
    version: "",
    platform: "ps",
  });
  const [sortKey, setSortKey] = useState("smart"); // smart | up | down | name

  async function load() {
    setLoading(true);
    try {
      const j = await apiFetch("/api/watchlist");
      const rows = Array.isArray(j?.items) ? j.items : [];
      // normalize expected fields
      const norm = rows.map((w) => {
        const started = Number(w.started_price || 0);
        const cur =
          typeof w.current_price === "number" ? w.current_price : w.last_price;
        const now = typeof cur === "number" ? cur : null;
        const chAbs =
          now !== null && started > 0 ? now - started : (now ?? 0) - started;
        const chPct =
          now !== null && started > 0 ? pct(now, started) : null;
        return {
          id: w.id,
          card_id: String(w.card_id),
          player_name: w.player_name || w.name || `Card ${w.card_id}`,
          version: w.version || w.card_version || "",
          platform: String(w.platform || "ps").toUpperCase(),
          price_start: started,
          price_now: now,
          change_abs: chAbs,
          change_pct: chPct,
          started_at: w.started_at || null,
          last_checked: w.updated_at || w.last_checked || null,
        };
      });
      setItems(norm);
    } catch (e) {
      console.error("watchlist load failed:", e?.message || e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function addQuick() {
    if (!form.card_id || !form.player_name) return;
    setAdding(true);
    try {
      await apiFetch("/api/watchlist", {
        method: "POST",
        body: JSON.stringify({
          card_id: Number(form.card_id),
          player_name: form.player_name,
          version: form.version || null,
          platform: form.platform.toLowerCase(),
          notes: "",
        }),
      });
      setForm({ ...form, card_id: "", player_name: "", version: "" });
      await load();
    } catch (e) {
      alert("Failed to add watch item");
    } finally {
      setAdding(false);
    }
  }

  async function refreshRow(id) {
    try {
      await apiFetch(`/api/watchlist/${id}/refresh`, { method: "POST" });
      await load();
    } catch {
      /* ignore */
    }
  }

  async function removeRow(id) {
    if (!confirm("Remove this watch item?")) return;
    try {
      await apiFetch(`/api/watchlist/${id}`, { method: "DELETE" });
      setItems((xs) => xs.filter((x) => x.id !== id));
    } catch {
      /* ignore */
    }
  }

  const sorted = useMemo(() => {
    const xs = [...items];
    if (sortKey === "up") {
      xs.sort((a, b) => (b.change_pct ?? -1e9) - (a.change_pct ?? -1e9));
    } else if (sortKey === "down") {
      xs.sort((a, b) => (a.change_pct ?? 1e9) - (b.change_pct ?? 1e9));
    } else if (sortKey === "name") {
      xs.sort((a, b) => a.player_name.localeCompare(b.player_name));
    } else {
      // smart: larger magnitude first
      xs.sort(
        (a, b) =>
          Math.abs(b.change_pct ?? 0) - Math.abs(a.change_pct ?? 0) ||
          (b.price_now ?? 0) - (a.price_now ?? 0)
      );
    }
    return xs;
  }, [items, sortKey]);

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-white">Player Watchlist</h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value)}
              className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-gray-200"
              title="Sort"
            >
              <option value="smart">Smart</option>
              <option value="up">Top risers</option>
              <option value="down">Top fallers</option>
              <option value="name">Name A–Z</option>
            </select>
          </div>
          <button
            onClick={load}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-800 bg-gray-900 text-gray-200 hover:bg-gray-800"
          >
            <RefreshCcw size={16} /> Refresh
          </button>
          <div className="hidden md:flex items-center gap-2 text-gray-400 text-sm px-3 py-2 rounded-xl border border-gray-800 bg-gray-900/50">
            <Cog size={16} />
            Track starting price vs current price.
          </div>
        </div>
      </div>

      {/* Add row */}
      <div className="mb-4 grid md:grid-cols-4 gap-2">
        <input
          placeholder="Card ID"
          className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-gray-100"
          value={form.card_id}
          onChange={(e) => setForm((f) => ({ ...f, card_id: e.target.value }))}
        />
        <input
          placeholder="Name"
          className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-gray-100"
          value={form.player_name}
          onChange={(e) =>
            setForm((f) => ({ ...f, player_name: e.target.value }))
          }
        />
        <input
          placeholder="Version (optional)"
          className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-gray-100"
          value={form.version}
          onChange={(e) => setForm((f) => ({ ...f, version: e.target.value }))}
        />
        <div className="flex gap-2">
          <select
            className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-gray-100"
            value={form.platform}
            onChange={(e) =>
              setForm((f) => ({ ...f, platform: e.target.value }))
            }
          >
            <option value="ps">PS</option>
            <option value="xbox">XBOX</option>
            <option value="pc">PC</option>
          </select>
          <button
            onClick={addQuick}
            disabled={adding}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-green-600 bg-green-600/10 text-green-400 hover:bg-green-600/20"
          >
            <Plus size={16} />
            Quick Add
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-gray-800 bg-gray-950/50">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-900/70 text-gray-400 text-xs">
              <th className="px-3 py-2 text-left">PLAYER</th>
              <th className="px-3 py-2 text-right">STARTED</th>
              <th className="px-3 py-2 text-right">CURRENT</th>
              <th className="px-3 py-2 text-right">CHANGE</th>
              <th className="px-3 py-2 text-center">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td className="px-3 py-6 text-center text-gray-400" colSpan={5}>
                  Loading…
                </td>
              </tr>
            )}
            {!loading && sorted.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-center text-gray-400" colSpan={5}>
                  No items yet. Add a card above to start tracking.
                </td>
              </tr>
            )}
            {sorted.map((w) => (
              <tr
                key={w.id}
                className="border-t border-gray-800 hover:bg-gray-900/40"
              >
                <td className="px-3 py-3">
                  <div className="text-white font-semibold">
                    {w.player_name}
                  </div>
                  <div className="text-xs text-gray-400">
                    ID {w.card_id} • {w.version || "—"} • {w.platform}
                  </div>
                </td>
                <td className="px-3 py-3 text-right">
                  {w.price_start ? fmtCoins(w.price_start) : "—"}
                </td>
                <td className="px-3 py-3 text-right">
                  {typeof w.price_now === "number" ? fmtCoins(w.price_now) : "—"}
                </td>
                <td className="px-3 py-3 text-right">
                  {typeof w.price_now === "number" && w.price_start ? (
                    <span
                      className={
                        (w.change_pct ?? 0) >= 0
                          ? "text-lime-400"
                          : "text-red-400"
                      }
                    >
                      {w.change_abs >= 0 ? "↑ " : "↓ "}
                      {fmtCoins(Math.abs(w.change_abs))} (
                      {(w.change_pct ?? 0).toFixed(2)}%)
                    </span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2 justify-center">
                    <button
                      onClick={() => refreshRow(w.id)}
                      className="px-2 py-1 rounded-lg bg-gray-900 border border-gray-800 text-gray-200 hover:bg-gray-800 text-xs inline-flex items-center gap-1"
                      title="Refresh"
                    >
                      <RefreshCcw size={14} />
                      Refresh
                    </button>
                    <button
                      onClick={() => removeRow(w.id)}
                      className="px-2 py-1 rounded-lg bg-red-600/90 hover:bg-red-600 text-white text-xs inline-flex items-center gap-1"
                      title="Remove"
                    >
                      <Trash2 size={14} />
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style>{`
        :root { --accent: ${ACCENT}; }
      `}</style>
    </div>
  );
}