import React, { useEffect, useMemo, useState, useCallback } from "react";
import { RefreshCcw, TrendingUp, TrendingDown, Loader2 } from "lucide-react";

const ACCENT = "#91db32";
const API_BASE = import.meta.env.VITE_API_URL || "";

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
  const [trendType, setTrendType] = useState("fallers");
  const [timeframe, setTimeframe] = useState("24");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchTrending = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const url = `${API_BASE}/api/trending?type=${trendType}&tf=${timeframe}`;
      const r = await fetch(url, { credentials: "include" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      setItems(data.items || []);
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Trending</h1>
          <p className="text-sm text-gray-400">
            Live market movers from FUT.GG Momentum. Console prices (PS only).
          </p>
        </div>

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

          {/* Timeframe pills */}
          <div className="h-6 w-px bg-gray-700 hidden md:block" />
          <div className="inline-flex rounded-xl border border-gray-800 overflow-hidden">
            {["6","12","24"].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
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
          Showing {trendType} for <span className="font-medium">{timeframe}h</span>.
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
                  <div className="shrink-0 text-lg">{numberEmoji[idx * 5 + i]}</div>

                  {p.image ? (
                    <img
                      src={p.image}
                      alt={p.name}
                      className="h-16 w-12 object-contain rounded-lg bg-gray-800/60"
                    />
                  ) : (
                    <div className="h-16 w-12 rounded-lg bg-gray-800" />
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="truncate text-white font-semibold">
                        {p.name}
                        {p.rating ? <span className="text-gray-400"> • {p.rating}</span> : null}
                      </div>
                      {p.version ? (
                        <span
                          className={`${pillBase}`}
                          style={{ background: "rgba(145,219,50,0.08)", color: ACCENT }}
                        >
                          {p.version}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-1 text-sm text-gray-300 leading-tight flex items-center gap-2">
                      <span>{trendType === "risers" ? "📈" : "📉"}</span>
                      <strong
                        className="tabular-nums"
                        style={{ color: p.percent > 0 ? ACCENT : "#f87171" }}
                      >
                        {pctString(p.percent)}
                      </strong>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span
                        className={`${pillBase} border border-gray-800 bg-gray-900/60 text-gray-200`}
                        title="PlayStation"
                      >
                        PS: {p.price_ps ? p.price_ps.toLocaleString() : "N/A"}
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