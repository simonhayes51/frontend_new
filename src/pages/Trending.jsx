import React, { useEffect, useMemo, useState, useCallback } from "react";
import { RefreshCcw, TrendingUp, TrendingDown, Shuffle, Loader2 } from "lucide-react";

const ACCENT = "#91db32";
const API_BASE = import.meta.env.VITE_API_URL || "";

/**
 * Expected backend response shape (examples):
 *  - For risers/fallers:
 *    { items: [{ name, rating, pid, version, percent, price_ps, price_xb, image, club, league }], timeframe: "4h"|"24h", type: "risers"|"fallers" }
 *  - For smart:
 *    { items: [{ name, rating, pid, version, percent_4h, percent_24h, price_ps, price_xb, image }], type: "smart" }
 *
 * This component is resilient: if percent is missing it falls back to percent_4h/percent_24h depending on selected timeframe.
 */

const numberEmoji = ["1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣","🔟"];

function pctString(x) {
  if (x === null || x === undefined || isNaN(x)) return "N/A";
  const sign = x > 0 ? "+" : "";
  return `${sign}${x.toFixed(2)}%`;
}

function chunkTop10(list) {
  const top10 = list.slice(0, 10);
  return [top10.slice(0, 5), top10.slice(5, 10)];
}

const pillBase = "inline-flex items-center px-2 py-0.5 rounded-full text-xs";
const cardBase =
  "bg-gray-900/70 rounded-2xl p-3 border border-gray-800 hover:border-gray-700 transition-colors";

export default function Trending() {
  const [trendType, setTrendType] = useState("fallers"); // "risers" | "fallers" | "smart"
  const [timeframe, setTimeframe] = useState("24h");     // "4h" | "24h"  (ignored for smart display, but kept for context)
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchTrending = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      // Smart movers: server computes both timeframes; risers/fallers: use the selected tf
      const url =
        trendType === "smart"
          ? `${API_BASE}/api/trending?type=smart`
          : `${API_BASE}/api/trending?type=${trendType}&tf=${timeframe}`;
      const r = await fetch(url, { credentials: "include" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();

      // Normalise items for consistent rendering
      const normalised = (data.items || []).map((p) => {
        // Pick a single percent for risers/fallers; for smart we keep both
        let percent = p.percent;
        if (percent === undefined || percent === null) {
          if (timeframe === "4h") percent = p.percent_4h;
          if (timeframe === "24h") percent = p.percent_24h;
        }
        return {
          name: p.name ?? "Unknown",
          rating: p.rating ?? p.ovr ?? null,
          pid: p.pid ?? p.id,
          version: p.version ?? p.card_type ?? "",
          image: p.image ?? p.image_url ?? null,
          price_ps: p.price_ps ?? p.ps ?? null,
          price_xb: p.price_xb ?? p.xb ?? p.xbox ?? null,
          percent,
          percent_4h: p.percent_4h ?? null,
          percent_24h: p.percent_24h ?? null,
          club: p.club ?? null,
          league: p.league ?? null,
        };
      });

      setItems(normalised);
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

  const [left, right] = useMemo(() => chunkTop10(items), [items]);

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Trending</h1>
          <p className="text-sm text-gray-400">
            Live market movers from FUT.GG via your bot logic. Console prices only (PS / Xbox).
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Trend type buttons */}
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
          >
            <span className="inline-flex items-center gap-2">
              <Shuffle size={16} />
              Smart Movers
            </span>
          </button>

          {/* Timeframe (kept visible for consistency; ignored by smart in backend) */}
          <div className="h-6 w-px bg-gray-700 hidden md:block" />
          <div className="inline-flex rounded-xl border border-gray-800 overflow-hidden">
            {["4h", "24h"].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-2 text-sm ${
                  timeframe === tf ? "bg-gray-900 text-white" : "bg-gray-900/40 text-gray-300"
                }`}
              >
                {tf}
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

      {/* Status row */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-400">
          {trendType === "smart" ? (
            <span>
              Smart Movers show players moving opposite ways across timeframes.
              <span className="ml-2 opacity-80">
                🔁 4h and 🔁 24h displayed per player.
              </span>
            </span>
          ) : (
            <span>
              Showing {trendType} for <span className="font-medium">{timeframe}</span>.
            </span>
          )}
        </div>
        {lastUpdated && (
          <div className="text-xs text-gray-400">
            Updated {lastUpdated.toLocaleTimeString()}
          </div>
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
        {[left, right].map((col, idx) => (
          <div key={idx} className="space-y-3">
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
              col.map((p, i) => (
                <div key={`${p.pid}-${i}`} className={`${cardBase} flex items-center gap-3`}>
                  {/* Rank */}
                  <div className="shrink-0 text-lg">{numberEmoji[idx * 5 + i]}</div>

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
                          className={`${pillBase}`}
                          style={{ background: "rgba(145,219,50,0.08)", color: ACCENT, border: `1px solid ${ACCENT}22` }}
                          title="Card version"
                        >
                          {p.version}
                        </span>
                      ) : null}
                    </div>

                    {/* Trend lines */}
                    {trendType === "smart" ? (
                      <div className="mt-1 text-sm text-gray-300 leading-tight">
                        <div className="flex items-center gap-2">
                          <span className="opacity-80">🔁 4h:</span>
                          <strong
                            className="tabular-nums"
                            style={{ color: smartColour(p.percent_4h) }}
                          >
                            {pctString(p.percent_4h)}
                          </strong>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="opacity-80">🔁 24h:</span>
                          <strong
                            className="tabular-nums"
                            style={{ color: smartColour(p.percent_24h) }}
                          >
                            {pctString(p.percent_24h)}
                          </strong>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-1 text-sm text-gray-300 leading-tight">
                        <div className="flex items-center gap-2">
                          {/* emoji on the LEFT of % */}
                          <span>{trendType === "risers" ? "📈" : "📉"}</span>
                          <strong
                            className="tabular-nums"
                            style={{ color: p.percent > 0 ? ACCENT : "#f87171" }}
                          >
                            {pctString(p.percent)}
                          </strong>
                        </div>
                      </div>
                    )}

                    {/* Prices row */}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span
                        className={`${pillBase} border border-gray-800 bg-gray-900/60 text-gray-200`}
                        title="PlayStation"
                      >
                        PS: {p.price_ps ? p.price_ps.toLocaleString() : "N/A"}
                      </span>
                      <span
                        className={`${pillBase} border border-gray-800 bg-gray-900/60 text-gray-200`}
                        title="Xbox"
                      >
                        XB: {p.price_xb ? p.price_xb.toLocaleString() : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function smartColour(v) {
  if (v == null || isNaN(v)) return "#d1d5db"; // gray-300
  return v >= 0 ? ACCENT : "#f87171"; // red-400
}
