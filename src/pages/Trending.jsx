// Trending.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  RefreshCcw,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Loader2,
  BookmarkPlus,
} from "lucide-react";

const ACCENT = "#91db32";
const API_BASE = import.meta.env.VITE_API_URL || "";

function pctString(x, digits = 2) {
  if (x === null || x === undefined || isNaN(x)) return "N/A";
  const n = Number(x);
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(digits)}%`;
}

function chunkTop10(list) {
  const top10 = list.slice(0, 10);
  return [top10.slice(0, 5), top10.slice(5, 10)];
}

const pillBase = "inline-flex items-center px-2 py-0.5 rounded-full text-xs";
const cardBase =
  "bg-gray-900/70 rounded-2xl p-3 border border-gray-800 hover:border-gray-700 transition-colors";

function RankBadge({ rank }) {
  let bg = "bg-gray-800 text-gray-200";
  let size = "h-8 w-8 text-sm";
  if (rank === 1) {
    bg = "bg-yellow-500 text-black";
    size = "h-9 w-9 text-base";
  } else if (rank === 2) {
    bg = "bg-gray-400 text-black";
    size = "h-9 w-9 text-base";
  } else if (rank === 3) {
    bg = "bg-amber-700 text-white";
    size = "h-9 w-9 text-base";
  }
  return (
    <div
      className={`flex items-center justify-center rounded-full font-bold ${bg} ${size}`}
    >
      {rank}
    </div>
  );
}

/* ------------ normalisers ------------ */
function normaliseItem(p) {
  const platform = (p.platform ?? "ps").toString().toLowerCase();
  const pid = p.pid ?? p.card_id ?? p.player_id ?? p.id ?? null;

  return {
    name: p.name ?? "Unknown",
    rating: p.rating ?? p.ovr ?? null,
    pid,
    card_id: p.card_id ?? pid, // keep for debugging / stability
    version: p.version ?? p.card_type ?? "",
    image: p.image ?? p.image_url ?? null,
    platform,

    // prefer flat field, support nested too
    price_console:
      p.price_console ??
      p.price_ps ??
      p.ps ??
      p.prices?.console ??
      (typeof p.price === "number" ? p.price : null),

    percent: p.percent ?? p.percent_24h ?? p.percent_12h ?? p.percent_6h ?? null,

    club: p.club ?? null,
    league: p.league ?? null,
  };
}

function normaliseSmart(it) {
  const platform = (it.platform ?? "ps").toString().toLowerCase();
  const pid = it.pid ?? it.card_id ?? it.id ?? null;

  return {
    name: it.name ?? "Unknown",
    rating: it.rating ?? null,
    pid,
    card_id: it.card_id ?? pid,
    image: it.image ?? it.image_url ?? null,
    version: it.version ?? "",

    platform,

    // backend may return percent_6h/percent_24h OR trend object
    percent6: it.percent_6h ?? it.trend?.chg6hPct ?? it.percent ?? null,
    percent24: it.percent_24h ?? it.trend?.chg24hPct ?? null,

    price_console:
      it.price_console ??
      it.price_ps ??
      it.ps ??
      it.prices?.console ??
      it.price ??
      null,
  };
}

function dedupeByPid(list) {
  const out = [];
  const seen = new Set();

  for (const it of list) {
    // if pid is missing, fall back to card_id; if still missing, skip
    const rawId = it?.pid ?? it?.card_id ?? null;
    if (rawId === null || rawId === undefined) continue;

    const key = `${String(rawId)}-${String(it.platform || "ps")}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(it);
  }
  return out;
}

/* ============================== Component ============================== */
export default function Trending() {
  // tabs: 'fallers' | 'risers' | 'smart'
  const [tab, setTab] = useState("fallers");
  const [timeframe, setTimeframe] = useState("24"); // passed to backend for risers/fallers
  const [platform, setPlatform] = useState("ps"); // platform selection

  // risers/fallers state
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // smart-movers state
  const [smartItems, setSmartItems] = useState([]);
  const [smartLoading, setSmartLoading] = useState(true);
  const [smartErr, setSmartErr] = useState("");

  const [lastUpdated, setLastUpdated] = useState(null);
  const [added, setAdded] = useState({}); // watchlist added ids

  /* ------- fetch risers/fallers when tab/timeframe changes ------- */
  const fetchTrending = useCallback(async () => {
    if (tab === "smart") return;
    setLoading(true);
    setErr("");
    try {
      // explicitly request 10 (backend should respect this once paywall removed)
      const url = `${API_BASE}/api/trending?type=${tab}&tf=${timeframe}&limit=10&platform=${platform}`;
      const r = await fetch(url, { credentials: "include" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();

      const mapped = (data.items || []).map(normaliseItem);
      setItems(dedupeByPid(mapped));
      setLastUpdated(new Date());
    } catch (e) {
      setErr(`Failed to load trending: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [tab, timeframe, platform]);

  useEffect(() => {
    fetchTrending();
  }, [fetchTrending]);

  /* ------- fetch smart movers (and allow refresh) ------- */
  const fetchSmart = useCallback(async () => {
    setSmartLoading(true);
    setSmartErr("");
    try {
      const r = await fetch(`${API_BASE}/api/trending?type=smart&limit=10&platform=${platform}`, {
        credentials: "include",
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();

      const mapped = (data.items || []).map(normaliseSmart);
      setSmartItems(dedupeByPid(mapped));
    } catch (e) {
      setSmartErr(`Failed to load Smart Movers: ${e.message}`);
    } finally {
      setSmartLoading(false);
    }
  }, [platform]);

  useEffect(() => {
    fetchSmart();
  }, [fetchSmart]);

  /* ------- layout helpers (dedupe again just in case) ------- */
  const safeList = useMemo(() => {
    return tab === "smart" ? dedupeByPid(smartItems) : dedupeByPid(items);
  }, [tab, smartItems, items]);

  const [left, right] = useMemo(() => chunkTop10(safeList), [safeList]);

  async function addToWatchlist(p) {
    try {
      const payload = {
        card_id: p.pid ?? p.card_id,
        player_name: p.name,
        version: p.version || null,
        platform: p.platform || "ps",
        notes: null,
      };

      const r = await fetch(`${API_BASE}/api/watchlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (r.status === 401) {
        window.location.href = `${API_BASE}/api/login`;
        return;
      }
      if (!r.ok) {
        const text = await r.text().catch(() => "");
        throw new Error(text || `HTTP ${r.status}`);
      }
      setAdded((prev) => ({ ...prev, [payload.card_id]: true }));
    } catch (e) {
      alert(`Failed to add to watchlist: ${e.message}`);
    }
  }

  /* ------- header controls ------- */
  const TabButton = ({ id, icon, children }) => (
    <button
      onClick={() => setTab(id)}
      className={`px-3 py-2 rounded-xl border ${
        tab === id
          ? "border-gray-700 bg-gray-900 text-white"
          : "border-gray-800 bg-gray-900/40 text-gray-300"
      }`}
    >
      <span className="inline-flex items-center gap-2">
        {icon}
        {children}
      </span>
    </button>
  );

  const isTabLoading = tab === "smart" ? smartLoading : loading;

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Trending</h1>
          <p className="text-sm text-gray-400">Live market movers. Console prices.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <TabButton id="fallers" icon={<TrendingDown size={16} />}>
            Fallers
          </TabButton>
          <TabButton id="risers" icon={<TrendingUp size={16} />}>
            Risers
          </TabButton>
          <TabButton id="smart" icon={<Sparkles size={16} color={ACCENT} />}>
            Smart Movers
          </TabButton>

          {/* timeframe only for risers/fallers */}
          {tab !== "smart" && (
            <>
              <div className="h-6 w-px bg-gray-700 hidden md:block" />
              <div className="inline-flex rounded-xl border border-gray-800 overflow-hidden">
                {["6", "12", "24"].map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-3 py-2 text-sm ${
                      timeframe === tf
                        ? "bg-gray-900 text-white"
                        : "bg-gray-900/40 text-gray-300"
                    }`}
                  >
                    {tf}h
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="h-6 w-px bg-gray-700 hidden md:block" />
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-800 bg-gray-900/40 text-gray-200 hover:border-gray-700 text-sm focus:outline-none"
          >
            <option value="ps">PS</option>
            <option value="xbox">Xbox</option>
            <option value="pc">PC</option>
          </select>

          {/* Refresh current tab */}
          <button
            onClick={() => (tab === "smart" ? fetchSmart() : fetchTrending())}
            className="px-3 py-2 rounded-xl border border-gray-800 bg-gray-900/40 text-gray-200 hover:border-gray-700 inline-flex items-center gap-2"
            title="Refresh"
          >
            {isTabLoading ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <RefreshCcw size={16} />
            )}
            Refresh
          </button>
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-400">
          {tab === "smart" ? (
            <>
              Showing <span className="font-medium">Smart Movers</span> (short vs
              long divergence).
            </>
          ) : (
            <>
              Showing {tab} for{" "}
              <span className="font-medium">{timeframe}h</span>.
            </>
          )}
        </div>
        {lastUpdated && tab !== "smart" && (
          <div className="text-xs text-gray-400">
            Updated {lastUpdated.toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Errors */}
      {tab !== "smart" && err && (
        <div className="p-3 rounded-xl border border-red-900/40 bg-red-900/10 text-red-200 text-sm">
          {err}
        </div>
      )}
      {tab === "smart" && smartErr && (
        <div className="p-3 rounded-xl border border-red-900/40 bg-red-900/10 text-red-200 text-sm">
          {smartErr}
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[left, right].map((col, colIdx) => (
          <div key={colIdx} className="space-y-3">
            {isTabLoading && (
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

            {!isTabLoading &&
              col.map((p, i) => {
                const rank = colIdx * 5 + i + 1;

                const isUp =
                  tab === "smart"
                    ? Number(p.percent6 ?? 0) > 0
                    : Number(p.percent ?? 0) > 0;

                return (
                  <div
                    key={String(p.pid ?? p.card_id)}
                    className={`${cardBase} flex items-center gap-3`}
                  >
                    <RankBadge rank={rank} />

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
                          {p.rating ? (
                            <span className="text-gray-400"> • {p.rating}</span>
                          ) : null}
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

                      {/* Percent */}
                      <div className="mt-1 text-sm text-gray-300 leading-tight flex items-center gap-3">
                        {tab === "smart" ? (
                          <>
                            <strong
                              className="tabular-nums"
                              style={{ color: isUp ? ACCENT : "#f87171" }}
                            >
                              Short: {pctString(p.percent6)}
                            </strong>
                            <span className="text-gray-400 tabular-nums">
                              Long: {pctString(p.percent24)}
                            </span>
                          </>
                        ) : (
                          <strong
                            className="tabular-nums"
                            style={{ color: isUp ? ACCENT : "#f87171" }}
                          >
                            {pctString(p.percent)}
                          </strong>
                        )}
                      </div>

                      {/* Price row */}
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span
                          className={`${pillBase} border border-gray-800 bg-gray-900/60 text-gray-200`}
                          title="Console price"
                        >
                          Console:{" "}
                          {typeof p.price_console === "number"
                            ? p.price_console.toLocaleString()
                            : p.price_console ?? "N/A"}
                        </span>

                        {/* Uncomment this temporarily if you want to debug duplicates */}
                        {/* <span className={`${pillBase} border border-gray-800 bg-gray-900/60 text-gray-400`}>
                          ID: {String(p.pid ?? p.card_id)}
                        </span> */}
                      </div>
                    </div>

                    {/* Watchlist */}
                    <div className="shrink-0">
                      <button
                        onClick={() => addToWatchlist(p)}
                        disabled={!!added[p.pid ?? p.card_id]}
                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${
                          added[p.pid ?? p.card_id]
                            ? "bg-gray-800 border-gray-700 text-gray-400 cursor-default"
                            : "bg-gray-900/50 border-gray-700 hover:border-gray-600 text-gray-100"
                        }`}
                        title="Add to Watchlist"
                      >
                        <BookmarkPlus size={16} />
                        {added[p.pid ?? p.card_id] ? "Added" : "Watchlist"}
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
