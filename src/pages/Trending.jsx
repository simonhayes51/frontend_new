// src/pages/Trending.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  RefreshCcw,
  TrendingUp,
  TrendingDown,
  Loader2,
  BookmarkPlus,
} from "lucide-react";

const ACCENT = "#91db32";
const API_BASE = import.meta.env.VITE_API_URL || "";

function pctString(x) {
  if (x === null || x === undefined || isNaN(x)) return "N/A";
  const n = Number(x);
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

function chunkTop10(list) {
  const top10 = list.slice(0, 10);
  return [top10.slice(0, 5), top10.slice(5, 10)];
}

const pillBase = "inline-flex items-center px-2 py-0.5 rounded-full text-xs";
const cardBase =
  "bg-gray-900/70 rounded-2xl p-3 border border-gray-800 hover:border-gray-700 transition-colors";

/* ------- Rank badge (gold/silver/bronze for top 3; slightly larger) ------- */
function RankBadge({ rank }) {
  let bg = "bg-gray-800 text-gray-200";
  let size = "h-8 w-8 text-sm";

  if (rank === 1) {
    bg = "bg-yellow-500 text-black"; // gold
    size = "h-9 w-9 text-base";
  } else if (rank === 2) {
    bg = "bg-gray-400 text-black"; // silver
    size = "h-9 w-9 text-base";
  } else if (rank === 3) {
    bg = "bg-amber-700 text-white"; // bronze
    size = "h-9 w-9 text-base";
  }

  return (
    <div className={`flex items-center justify-center rounded-full font-bold ${bg} ${size}`}>
      {rank}
    </div>
  );
}

/* ------- normaliser to match backend payload ------- */
function normaliseItem(p) {
  return {
    name: p.name ?? "Unknown",
    rating: p.rating ?? p.ovr ?? null,
    pid: p.pid ?? p.card_id ?? p.id,
    version: p.version ?? p.card_type ?? "",
    image: p.image ?? p.image_url ?? null,
    // console-only price (falls back to legacy fields if needed)
    price_console:
      p.price_console ??
      p.price_ps ??
      p.ps ??
      (typeof p.price === "number" ? p.price : null),
    // generic percent for risers/fallers, fallback chain
    percent: p.percent ?? p.percent_24h ?? p.percent_12h ?? p.percent_6h ?? null,
    // smart movers fields (if present)
    p6: p.percent_6h ?? p.p6 ?? null,
    p24: p.percent_24h ?? p.p24 ?? null,
    club: p.club ?? null,
    league: p.league ?? null,
  };
}

/** Extract [timestamp(ms), price] pairs (or prices) from various shapes */
function extractPricesFromHistory(data) {
  let points = [];
  if (Array.isArray(data)) points = data;
  else if (Array.isArray(data?.points)) points = data.points;
  else if (Array.isArray(data?.series)) points = data.series;
  else if (Array.isArray(data?.data)) points = data.data;

  // Normalise to arrays of [t, v] or [v]
  const out = [];
  for (const p of points) {
    if (Array.isArray(p)) {
      if (p.length >= 2) out.push([Number(p[0]), Number(p[1])]);
      else if (p.length === 1) out.push([NaN, Number(p[0])]);
    } else if (p && typeof p === "object") {
      const t = Number(p.t ?? p.time ?? p.ts ?? p.timestamp);
      const v = Number(p.v ?? p.price ?? p.y ?? p.value);
      if (!Number.isNaN(v)) out.push([Number.isNaN(t) ? NaN : t, v]);
    } else if (typeof p === "number") {
      out.push([NaN, p]);
    }
  }
  return out;
}

function mean(nums) {
  if (!nums.length) return null;
  let sum = 0;
  for (const n of nums) sum += n;
  return sum / nums.length;
}

export default function Trending() {
  const [trendType, setTrendType] = useState("fallers"); // "risers" | "fallers" | "smart"
  const [timeframe, setTimeframe] = useState(24);        // 6 | 12 | 24 (number)
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  // Track which items were added (to disable the button)
  const [added, setAdded] = useState({}); // { [pid]: true }
  // Average price map (by pid)
  const [avgMap, setAvgMap] = useState({}); // { [pid]: number|null }

  const fetchTrending = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const allowed = new Set(["risers", "fallers", "smart"]);
      const kind = allowed.has((trendType || "").toLowerCase())
        ? (trendType || "").toLowerCase()
        : "fallers";
      const tfNum = parseInt(String(timeframe).replace(/[^\d]/g, ""), 10) || 24;

      const qs = new URLSearchParams({ type: kind, tf: String(tfNum) });
      const url = `${API_BASE}/api/trending?${qs.toString()}`;
      const r = await fetch(url, { credentials: "include" });
      if (!r.ok) {
        let detail = "";
        try { detail = await r.text(); } catch {}
        throw new Error(`HTTP ${r.status}${detail ? ` – ${detail}` : ""}`);
      }
      const data = await r.json();
      setItems((data.items || []).map(normaliseItem));
      setLastUpdated(new Date());
    } catch (e) {
      setErr(`Failed to load trending: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [trendType, timeframe]);

  useEffect(() => {
    fetchTrending();
  }, [fetchTrending]);

  // Fetch averages for visible items when list or timeframe changes
  useEffect(() => {
    if (!items.length) {
      setAvgMap({});
      return;
    }
    let cancelled = false;

    (async () => {
      const hours = Number(timeframe) || 24;
      const now = Date.now();
      const cutoff = now - hours * 3600 * 1000;

      const entries = await Promise.all(
        items.map(async (p) => {
          try {
            const url = `${API_BASE}/api/price-history?playerId=${encodeURIComponent(
              p.pid
            )}&platform=ps&tf=today`;
            const r = await fetch(url, { credentials: "include" });
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            const data = await r.json();

            const pts = extractPricesFromHistory(data);
            // Slice by cutoff if timestamps are present; else use all today's points
            const slice = pts.filter(
              ([t, v]) => !Number.isFinite(t) || t >= cutoff
            );
            const prices = slice.map(([_, v]) => v).filter((v) => Number.isFinite(v));
            const avg = mean(prices);

            return [p.pid, avg];
          } catch {
            return [p.pid, null];
          }
        })
      );

      if (!cancelled) {
        const next = {};
        for (const [pid, avg] of entries) next[pid] = avg;
        setAvgMap(next);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [items, timeframe]);

  const [left, right] = useMemo(() => chunkTop10(items), [items]);

  // Add to watchlist (store as PS under the hood; UI shows "Console")
  async function addToWatchlist(p) {
    try {
      const payload = {
        card_id: p.pid,
        player_name: p.name,
        version: p.version || null,
        platform: "ps", // backend expects 'ps' or 'xbox'; we treat Console as PS
        notes: null,
      };
      const r = await fetch(`${API_BASE}/api/watchlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (r.status === 401) {
        // not logged in -> bounce to login
        window.location.href = `${API_BASE}/api/login`;
        return;
      }
      if (!r.ok) {
        const text = await r.text().catch(() => "");
        throw new Error(text || `HTTP ${r.status}`);
      }

      setAdded((prev) => ({ ...prev, [p.pid]: true }));
    } catch (e) {
      alert(`Failed to add to watchlist: ${e.message}`);
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Trending</h1>
          <p className="text-sm text-gray-400">
            Live market movers. Console prices.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Type buttons */}
          <button
            onClick={() => setTrendType("fallers")}
            className={`px-3 py-2 rounded-xl border ${
              trendType === "fallers"
                ? "border-gray-700 bg-gray-900 text-white"
                : "border-gray-800 bg-gray-900/40 text-gray-300"
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <TrendingDown size={16} />
              Fallers
            </span>
          </button>
          <button
            onClick={() => setTrendType("risers")}
            className={`px-3 py-2 rounded-xl border ${
              trendType === "risers"
                ? "border-gray-700 bg-gray-900 text-white"
                : "border-gray-800 bg-gray-900/40 text-gray-300"
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <TrendingUp size={16} />
              Risers
            </span>
          </button>
          <button
            onClick={() => setTrendType("smart")}
            className={`px-3 py-2 rounded-xl border ${
              trendType === "smart"
                ? "border-gray-700 bg-gray-900 text-white"
                : "border-gray-800 bg-gray-900/40 text-gray-300"
            }`}
            title="Opposite moves on 6h vs 24h"
          >
            <span className="inline-flex items-center gap-2">🔁 Smart</span>
          </button>

          {/* Timeframe pills */}
          <div className="h-6 w-px bg-gray-700 hidden md:block" />
          <div className="inline-flex rounded-xl border border-gray-800 overflow-hidden">
            {[6, 12, 24].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(Number(tf))}
                className={`px-3 py-2 text-sm ${
                  timeframe === tf ? "bg-gray-900 text-white" : "bg-gray-900/40 text-gray-300"
                }`}
              >
                {tf}h
              </button>
            ))}
          </div>

          {/* Refresh */}
          <button
            onClick={fetchTrending}
            className="px-3 py-2 rounded-xl border border-gray-800 bg-gray-900/40 text-gray-200 hover:border-gray-700 inline-flex items-center gap-2"
            title="Refresh"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <RefreshCcw size={16} />}
            Refresh
          </button>
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-400">
        {trendType === "smart" ? (
          <>Showing smart (6h vs 24h). Add players to your watchlist using the button on each card.</>
        ) : (
          <>Showing {trendType} for <span className="font-medium">{timeframe}h</span>. Add players to your watchlist using the button on each card.</>
        )}
      </div>


      {/* Error */}
      {err && (
        <div className="p-3 rounded-xl border border-red-900/40 bg-red-900/10 text-red-200 text-sm">
          {err}
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[left, right].map((col, colIdx) => (
          <div key={colIdx} className="space-y-3">
            {loading && (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className={`${cardBase} h-[92px] animate-pulse flex items-center gap-3`}
                  >
                    <div className="h-16 w-12 bg-gray-800 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-1/3 bg-gray-800 rounded" />
                      <div className="h-3 w-1/2 bg-gray-800 rounded" />
                      <div className="h-3 w-1/4 bg-gray-800 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading &&
              col.map((p, i) => {
                const rank = colIdx * 5 + i + 1;
                const isUp = Number(p.percent ?? 0) > 0;
                const avg = avgMap[p.pid];

                return (
                  <div key={`${p.pid}-${i}`} className={`${cardBase} flex items-center gap-3`}>
                    {/* Rank */}
                    <RankBadge rank={rank} />

                    {/* Image */}
                    {p.image ? (
                      <img
                        src={p.image}
                        alt={p.name}
                        className="h-16 w-12 object-contain rounded-lg bg-gray-800/60"
                      />
                    ) : (
                      <div className="h-16 w-12 rounded-lg bg-gray-800" />
                    )}

                    {/* Main */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="truncate text-white font-semibold">
                          {p.name}
                          {p.rating ? <span className="text-gray-400"> • {p.rating}</span> : null}
                        </div>
                        {p.version ? (
                          <span
                            className={pillBase}
                            style={{
                              background: "rgba(145,219,50,0.08)",
                              color: ACCENT,
                              border: `1px solid ${ACCENT}22`,
                            }}
                          >
                            {p.version}
                          </span>
                        ) : null}
                      </div>

                      {/* Percent(s) */}
                      {trendType === "smart" ? (
                        <div className="mt-1 text-xs text-gray-300 leading-tight">
                          <div className="flex items-center gap-2">
                            <span className="opacity-80">🔁 6h:</span>
                            <strong
                              className="tabular-nums"
                              style={{ color: (p.p6 ?? 0) > 0 ? ACCENT : "#f87171" }}
                            >
                              {pctString(p.p6)}
                            </strong>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="opacity-80">🔁 24h:</span>
                            <strong
                              className="tabular-nums"
                              style={{ color: (p.p24 ?? 0) > 0 ? ACCENT : "#f87171" }}
                            >
                              {pctString(p.p24)}
                            </strong>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-1 text-sm text-gray-300 leading-tight flex items-center gap-2">
                          <strong
                            className="tabular-nums"
                            style={{ color: isUp ? ACCENT : "#f87171" }}
                          >
                            {pctString(p.percent)}
                          </strong>
                        </div>
                      )}

                      {/* Price (Console + Average) */}
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span
                          className={`${pillBase} border border-gray-800 bg-gray-900/60 text-gray-200`}
                          title="Console"
                        >
                          Console:{" "}
                          {typeof p.price_console === "number"
                            ? p.price_console.toLocaleString()
                            : p.price_console || "N/A"}
                        </span>

                        <span
                          className={`${pillBase} border border-gray-800 bg-gray-900/60 text-gray-300`}
                          title={`Average (${timeframe}h)`}
                        >
                          Avg ({timeframe}h):{" "}
                          {typeof avg === "number" ? Math.round(avg).toLocaleString() : "N/A"}
                        </span>
                      </div>
                    </div>

                    {/* Add to Watchlist */}
                    <div className="shrink-0">
                      <button
                        onClick={() => addToWatchlist(p)}
                        disabled={!!added[p.pid]}
                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${
                          added[p.pid]
                            ? "bg-gray-800 border-gray-700 text-gray-400 cursor-default"
                            : "bg-gray-900/50 border-gray-700 hover:border-gray-600 text-gray-100"
                        }`}
                        title="Add to Watchlist (Console)"
                      >
                        <BookmarkPlus size={16} />
                        {added[p.pid] ? "Added" : "Watchlist"}
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        ))}
      </div>
    </div>
  );
}
