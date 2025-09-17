// src/pages/BestBuys.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  Flame,
  SlidersHorizontal,
  Copy,
  ExternalLink,
} from "lucide-react";

const API_BASE =
  (import.meta?.env?.VITE_API_URL?.replace(/\/$/, "")) || "https://api.futhub.co.uk";

function formatCoins(n) {
  const x = Number(n || 0);
  if (!Number.isFinite(x)) return "—";
  return x.toLocaleString() + " c";
}

function classNames(...xs) {
  return xs.filter(Boolean).join(" ");
}

function RiskPill({ label = "Unknown" }) {
  const map = {
    Low: "bg-emerald-500/20 text-emerald-200 border-emerald-400/30",
    Medium: "bg-amber-500/20 text-amber-200 border-amber-400/30",
    High: "bg-rose-600/20 text-rose-200 border-rose-400/30",
    Unknown: "bg-white/10 text-zinc-200 border-white/10",
  };
  return (
    <span className={classNames("px-2.5 py-1 rounded-full border text-xs font-medium", map[label] || map.Unknown)}>
      {label}
    </span>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-white/70">{label}</span>
      <span className={classNames("tabular-nums font-semibold", accent)}>{value}</span>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="p-4 rounded-3xl bg-white/5 border border-white/10 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-white/10" />
        <div className="flex-1">
          <div className="h-4 w-40 bg-white/10 rounded mb-2" />
          <div className="h-3 w-28 bg-white/10 rounded" />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-4 bg-white/10 rounded" />
        ))}
      </div>
      <div className="mt-4 h-8 bg-white/10 rounded" />
    </div>
  );
}

// Tiny, dependency-free sparkline (expects an array of numbers)
function Sparkline({ data }) {
  if (!Array.isArray(data) || data.length < 2) return null;
  const w = 120;
  const h = 36;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = Math.max(max - min, 1);
  const step = w / (data.length - 1);
  const pts = data.map((v, i) => {
    const x = i * step;
    const y = h - ((v - min) / span) * h;
    return `${x},${y}`;
  }).join(" ");
  const last = data[data.length - 1];
  const first = data[0];
  const up = last >= first;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} className="block">
      <polyline
        fill="none"
        stroke={up ? "rgb(110, 231, 183)" : "rgb(252, 165, 165)"} // emerald/rose
        strokeWidth="2"
        points={pts}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function BestBuys() {
  const [rows, setRows] = useState([]);
  const [platform, setPlatform] = useState("ps");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [q, setQ] = useState("");
  const [risk, setRisk] = useState("All"); // All | Low | Medium | High
  const [sort, setSort] = useState("cheap"); // cheap | current | volume | rating | name

  const navigate = useNavigate();

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(
        `${API_BASE}/api/ai/top-buys?platform=${encodeURIComponent(platform)}&limit=48`,
        { credentials: "include" }
      );
      if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`);
      const data = await r.json();
      const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
      setRows(list);
    } catch (e) {
      setError(e.message || "Failed to load Best Buys");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [platform]);

  // Derived filters + sorting
  const filteredSorted = useMemo(() => {
    let arr = Array.isArray(rows) ? rows.slice() : [];

    // text filter
    const term = q.trim().toLowerCase();
    if (term) {
      arr = arr.filter((r) => (r?.player?.name || "").toLowerCase().includes(term));
    }

    // risk filter
    if (["Low", "Medium", "High"].includes(risk)) {
      arr = arr.filter((r) => (r?.risk_label || "").toLowerCase() === risk.toLowerCase());
    }

    // sorting
    arr.sort((a, b) => {
      const cheapA = Number(a.cheap_pct || 0);
      const cheapB = Number(b.cheap_pct || 0);
      const curA = Number(a.current || 0);
      const curB = Number(b.current || 0);
      const volA = Number(a.vol24 || 0);
      const volB = Number(b.vol24 || 0);
      const ratA = Number(a?.player?.rating || 0);
      const ratB = Number(b?.player?.rating || 0);
      const nameA = (a?.player?.name || "").localeCompare(b?.player?.name || "");

      switch (sort) {
        case "cheap": return cheapA === cheapB ? volB - volA : cheapA - cheapB; // cheapest first
        case "current": return curA - curB; // lowest price first
        case "volume": return volB - volA; // highest volume first
        case "rating": return ratB - ratA; // highest rating first
        case "name": return nameA;
        default: return cheapA - cheapB;
      }
    });

    return arr;
  }, [rows, q, risk, sort]);

  function goToSmartBuyer(name) {
    const nm = (name || q || "").trim();
    if (!nm) return;
    navigate(`/smart-buyer-ai?name=${encodeURIComponent(nm)}&platform=${platform}`);
  }

  function copyLink(name) {
    const url = `${location.origin}${location.pathname}#/smart-buyer-ai?name=${encodeURIComponent(
      name || ""
    )}&platform=${platform}`;
    navigator.clipboard?.writeText(url);
  }

  // Headline KPIs (use top of filtered set)
  const kpi = useMemo(() => {
    const list = filteredSorted.slice(0, 8);
    const avgCheap = list.length ? list.reduce((a, r) => a + Number(r.cheap_pct || 0), 0) / list.length : 0;
    const avgVol = list.length ? Math.round(list.reduce((a, r) => a + Number(r.vol24 || 0), 0) / list.length) : 0;
    const medianPrice = list.length
      ? list.map((r) => Number(r.current || 0)).sort((a, b) => a - b)[Math.floor(list.length / 2)]
      : 0;
    return { avgCheap, avgVol, medianPrice };
  }, [filteredSorted]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#180a2e] to-[#0e0a19] text-white">
      <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-white/10 border border-white/10 p-2">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Best Buys — Live Picks</h1>
            <p className="text-sm text-white/70">
              Underpriced cards right now. Click a card to open Smart Buyer for details.
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-3">
          {/* search */}
          <div className="relative flex-1">
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-3">
              <Search className="w-4 h-4 text-zinc-300" />
              <input
                className="w-full bg-transparent py-3 text-white placeholder:text-zinc-400 focus:outline-none"
                placeholder="Search a player (e.g., Mohamed Salah)"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && goToSmartBuyer()}
              />
              <button
                onClick={() => goToSmartBuyer()}
                className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-3 py-2"
              >
                Search
              </button>
            </div>
          </div>

          {/* risk filter */}
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-2xl p-1">
            {["All", "Low", "Medium", "High"].map((r) => (
              <button
                key={r}
                onClick={() => setRisk(r)}
                className={classNames(
                  "px-3 py-2 rounded-xl text-sm",
                  risk === r ? "bg-white/15" : "hover:bg-white/10"
                )}
                title={`Show ${r.toLowerCase()} risk picks`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* sort */}
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-3">
            <SlidersHorizontal className="w-4 h-4 text-zinc-300" />
            <select
              className="bg-transparent py-2 pr-1 text-white focus:outline-none"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              title="Sort picks"
            >
              <option value="cheap">Cheapest vs usual</option>
              <option value="volume">Highest volume</option>
              <option value="current">Lowest current price</option>
              <option value="rating">Highest rating</option>
              <option value="name">Name A→Z</option>
            </select>
          </div>

          {/* platform */}
          <select
            className="rounded-2xl bg-white/5 border border-white/10 px-3 py-2 text-white"
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            title="Platform"
          >
            <option value="ps">PS</option>
            <option value="xbox">Xbox</option>
            <option value="pc">PC</option>
          </select>

          {/* reload */}
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-4 py-2 text-sm font-medium"
            title="Reload"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Reload
          </button>
        </div>

        {/* KPIs */}
        <div className="grid md:grid-cols-3 gap-3">
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <div className="text-xs uppercase text-white/70">Avg. Cheap vs Usual (top picks)</div>
            <div className="mt-1 text-2xl font-bold tabular-nums text-emerald-300">
              {(kpi.avgCheap * 100).toFixed(1)}%
            </div>
          </div>
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <div className="text-xs uppercase text-white/70">Avg. 24h Volume (top picks)</div>
            <div className="mt-1 text-2xl font-bold tabular-nums">{kpi.avgVol.toLocaleString()}</div>
          </div>
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <div className="text-xs uppercase text-white/70">Median Current Price</div>
            <div className="mt-1 text-2xl font-bold tabular-nums">{formatCoins(kpi.medianPrice)}</div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-3xl bg-rose-600/20 border border-rose-400/30 p-4">
            <p className="font-semibold">Error loading Best Buys</p>
            <p className="text-sm text-rose-100/80 mt-1">{error}</p>
            <button
              onClick={load}
              className="mt-3 rounded-xl bg-rose-600/30 hover:bg-rose-600/40 px-3 py-2 text-sm"
            >
              Try again
            </button>
          </div>
        )}

        {/* Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading &&
            Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={`s-${i}`} />)}

          {!loading &&
            filteredSorted.map((r, i) => {
              const name = r.player?.name || r.player_card_id || "Unknown Player";
              const img = r.player?.image_url;
              const metaLine =
                [r.player?.position, r.player?.version, r.player?.rating]
                  .filter(Boolean)
                  .join(" • ") || "\u00A0";

              // build a tiny sparkline from current/median if no series is present
              const sparkData =
                Array.isArray(r.spark) && r.spark.length >= 2
                  ? r.spark
                  : [Number(r.median7 || r.current || 0), Number(r.current || r.median7 || 0)];

              const cheapPct = Number(r.cheap_pct || 0);

              return (
                <div
                  key={r.player_card_id || i}
                  className="group p-4 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                  onClick={() => goToSmartBuyer(name)}
                  title="Open in Smart Buyer"
                >
                  {/* Header row */}
                  <div className="flex items-center gap-3">
                    {img ? (
                      <img
                        src={img}
                        alt=""
                        className="w-12 h-12 rounded-lg border border-white/10 bg-black/20 object-cover"
                        onError={(e) => (e.currentTarget.style.display = "none")}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-black/20 border border-white/10" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{name}</div>
                      <div className="text-sm text-white/70 truncate">{metaLine}</div>
                    </div>
                    <RiskPill label={r.risk_label || "Unknown"} />
                  </div>

                  {/* Sparkline + stats */}
                  <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-2">
                    <Sparkline data={sparkData.map((x) => Number(x || 0))} />
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1">
                    <Stat label="Current" value={formatCoins(r.current)} />
                    <Stat label="Usual" value={formatCoins(r.median7)} />
                    <Stat
                      label="Cheap vs usual"
                      value={`${(cheapPct * 100).toFixed(1)}%`}
                      accent={cheapPct < 0 ? "text-emerald-300" : cheapPct > 0 ? "text-rose-300" : ""}
                    />
                    <Stat label="24h volume" value={Number(r.vol24 || 0).toLocaleString()} />
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex gap-2">
                      {Math.abs(cheapPct) >= 0.08 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200">
                          <Flame className="w-3.5 h-3.5" />
                          Hot
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-white/10 border border-white/10">
                          {platform.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="inline-flex items-center gap-2 rounded-2xl bg-white/10 hover:bg-white/15 px-3 py-2 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyLink(name);
                        }}
                        title="Copy Smart Buyer link"
                      >
                        <Copy className="w-3.5 h-3.5" /> Copy Link
                      </button>
                      <a
                        href={`#/smart-buyer-ai?name=${encodeURIComponent(name)}&platform=${platform}`}
                        className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 px-3 py-2 text-sm font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View <ArrowRight className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Empty */}
        {!loading && !error && !filteredSorted.length && (
          <div className="text-center text-white/70 py-10">
            No signals right now — try different filters or check back soon.
          </div>
        )}

        {/* Footer hint */}
        <div className="pt-2 text-xs text-white/60 flex items-center gap-2">
          <ExternalLink className="w-4 h-4" />
          Tip: Click any card to open Smart Buyer. Sort by <em>Cheapest vs usual</em> for bargain hunting,
          or by <em>Volume</em> to find liquid flips.
        </div>
      </div>
    </div>
  );
}