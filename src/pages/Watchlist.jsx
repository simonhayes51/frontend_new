// src/pages/Watchlist.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { RefreshCcw, Trash2, AlertTriangle, Clock, MonitorSmartphone } from "lucide-react";
import { useSettings } from "../context/SettingsContext";

/**
 * This version:
 * - Restores the "nice" card layout you had
 * - Calls the new backend directly (so we don't depend on a missing getWatchlist export)
 * - Shows name/rating/club/nation + prices + change% + updated time
 * - Has Refresh (all) and refresh per card + Delete
 */

const platformLabel = (p) => (p || "").toUpperCase();

export default function Watchlist() {
  const { formatCoins, formatDate } = useSettings();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const r = await fetch("/api/watchlist", { credentials: "include" });
      const j = await r.json();
      if (!j?.ok) throw new Error(j?.error || "Failed to load watchlist");
      setItems(j.items || []);
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onDelete = async (id) => {
    if (!confirm("Remove this from your watchlist?")) return;
    try {
      await fetch(`/api/watchlist/${id}`, { method: "DELETE", credentials: "include" });
      setItems((xs) => xs.filter((x) => x.id !== id));
    } catch (e) {
      alert("Could not delete.");
    }
  };

  const onRefresh = async (id) => {
    try {
      const r = await fetch(`/api/watchlist/${id}/refresh`, { method: "POST", credentials: "include" });
      const j = await r.json();
      if (!j?.ok) throw new Error("Refresh failed");
      const updated = j.item;
      setItems((xs) => xs.map((x) => (x.id === id ? updated : x)));
    } catch (e) {
      alert("Could not refresh item.");
    }
  };

  const headerStats = useMemo(() => {
    if (!items?.length) return null;
    const n = items.length;
    const gains = items.filter((i) => (i.change_pct ?? 0) > 0);
    const losers = items.filter((i) => (i.change_pct ?? 0) < 0);
    return {
      count: n,
      up: gains.length,
      down: losers.length,
    };
  }, [items]);

  return (
    <div className="p-4 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-100">Watchlist</h1>
          <div className="text-xs text-gray-400 mt-1">
            {headerStats ? (
              <>
                Tracking <b>{headerStats.count}</b> cards • <span className="text-lime-400">{headerStats.up} up</span>{" "}
                • <span className="text-rose-400">{headerStats.down} down</span>
              </>
            ) : (
              "Track cards across platforms and get quick change signals."
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-sm"
          >
            <RefreshCcw size={16} /> Refresh all
          </button>
        </div>
      </div>

      {err && (
        <div className="flex items-center gap-2 text-amber-400 text-sm">
          <AlertTriangle size={16} /> {err}
        </div>
      )}

      {loading && <div className="text-gray-400">Loading…</div>}

      {!loading && items.length === 0 && (
        <div className="text-gray-400">No watched players yet. Add from Trade Finder or player pages.</div>
      )}

      {/* Grid */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => {
          const img =
            it.image ||
            it.image_url ||
            `https://game-assets.fut.gg/cdn-cgi/image/quality=100,format=auto,width=500/2025/player-item-card/25-${it.card_id}.webp`;

          const priceNow = it.current_price ?? null;
          const start = it.started_price ?? null;
          const diff = it.change ?? (priceNow != null && start != null ? priceNow - start : null);
          const diffPct =
            it.change_pct ??
            (priceNow != null && start ? Math.round(((priceNow - start) / start) * 10000) / 100 : null);

          return (
            <div
              key={it.id}
              className="rounded-2xl bg-zinc-900/70 border border-zinc-800 p-4 flex gap-4 items-center shadow-sm"
            >
              <img src={img} alt={it.player_name || it.name} className="w-16 h-24 object-cover rounded-lg" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 justify-between">
                  <div className="truncate">
                    <div className="text-base text-gray-100 font-semibold truncate">
                      {it.player_name || it.name}{" "}
                      {it.rating ? <span className="text-gray-400">({it.rating})</span> : null}
                    </div>
                    <div className="text-xs text-gray-400 truncate">
                      {it.version ? `${it.version} • ` : ""}
                      {it.club ? `${it.club} • ` : ""}
                      {it.nation || it.league || ""}
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-gray-300">
                    {platformLabel(it.platform)}
                  </span>
                </div>

                {/* Stat tiles */}
                <div className="mt-2 grid grid-cols-4 gap-2 text-sm">
                  <Tile label="Start" value={start != null ? `${formatCoins(start)}c` : "—"} />
                  <Tile label="Current" value={priceNow != null ? `${formatCoins(priceNow)}c` : "—"} />
                  <Tile
                    label="Change"
                    value={
                      diff != null ? (
                        <span className={diff >= 0 ? "text-lime-400" : "text-rose-400"}>
                          {diff >= 0 ? "+" : ""}
                          {formatCoins(diff)}c
                        </span>
                      ) : (
                        "—"
                      )
                    }
                  />
                  <Tile
                    label="Δ %"
                    value={
                      diffPct != null ? (
                        <span className={diffPct >= 0 ? "text-lime-400" : "text-rose-400"}>
                          {diffPct >= 0 ? "+" : ""}
                          {diffPct.toFixed(2)}%
                        </span>
                      ) : (
                        "—"
                      )
                    }
                  />
                </div>

                {/* Footer line */}
                <div className="mt-2 text-[11px] text-gray-400 flex items-center gap-3">
                  <span className="inline-flex items-center gap-1">
                    <Clock size={12} />
                    {it.updated_at ? `Updated ${formatDate(it.updated_at)}` : "Freshness unknown"}
                  </span>
                  {it.is_extinct ? (
                    <span className="inline-flex items-center gap-1 text-amber-400">
                      <MonitorSmartphone size={12} /> Extinct
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => onRefresh(it.id)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-sm"
                  title="Refresh"
                >
                  <RefreshCcw size={16} />
                </button>
                <button
                  onClick={() => onDelete(it.id)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-rose-600/40 bg-rose-600/10 hover:bg-rose-600/20 text-sm text-rose-300"
                  title="Remove"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Tile({ label, value }) {
  return (
    <div className="bg-zinc-950/50 rounded-xl p-2 border border-zinc-800">
      <div className="text-[11px] text-gray-400">{label}</div>
      <div className="text-gray-100 font-medium truncate">{value}</div>
    </div>
  );
}