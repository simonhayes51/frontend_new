// src/pages/BestBuys.jsx
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, RefreshCw, ArrowRight, TrendingUp } from "lucide-react";

const API_BASE =
  (import.meta?.env?.VITE_API_URL?.replace(/\/$/, "")) || "https://api.futhub.co.uk";

function Coin({ n }) {
  const v = Number(n || 0);
  return <b>{v.toLocaleString()} c</b>;
}

function RiskPill({ label = "Unknown" }) {
  const map = {
    Low: "bg-emerald-600/20 text-emerald-300 border-emerald-400/30",
    Medium: "bg-amber-500/20 text-amber-200 border-amber-400/30",
    High: "bg-rose-600/20 text-rose-200 border-rose-400/30",
    Unknown: "bg-white/10 text-zinc-200 border-white/10",
  };
  return (
    <span className={`px-2.5 py-1 rounded-full border text-xs md:text-sm ${map[label] || map.Unknown}`}>
      {label}
    </span>
  );
}

function SkeletonCard() {
  return (
    <div className="p-4 rounded-3xl bg-white/5 border border-white/10 animate-pulse">
      <div className="flex gap-3">
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

export default function BestBuys() {
  const [rows, setRows] = useState([]);
  const [platform, setPlatform] = useState("ps");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = Array.isArray(rows) ? rows : [];
    if (!term) return list;
    return list.filter((r) => (r?.player?.name || "").toLowerCase().includes(term));
  }, [rows, q]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(
        `${API_BASE}/api/ai/top-buys?platform=${encodeURIComponent(platform)}&limit=36`,
        { credentials: "include" }
      );
      if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`);
      const data = await r.json();
      const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
      setRows(list);
    } catch (e) {
      setError(e.message || "Failed to fetch");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [platform]);

  function goToSmartBuyer() {
    const name = q.trim();
    if (!name) return;
    navigate(`/smart-buyer-ai?name=${encodeURIComponent(name)}&platform=${platform}`);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#180a2e] to-[#0e0a19] text-white">
      <div className="mx-auto max-w-6xl px-4 py-6 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-white/10 border border-white/10 p-2">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Best Buys — Live Picks</h1>
            <p className="text-sm text-white/70">Quick picks that look underpriced right now.</p>
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
                placeholder="Type a player name (e.g., Mohamed Salah)"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && goToSmartBuyer()}
              />
              <button
                onClick={goToSmartBuyer}
                className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-3 py-2"
              >
                Search
              </button>
            </div>
          </div>

          {/* platform */}
          <select
            className="rounded-2xl bg-white/5 border border-white/10 px-3 py-2 text-white"
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
          >
            <option value="ps">PS</option>
            <option value="xbox">Xbox</option>
            <option value="pc">PC</option>
          </select>

          {/* reload + count */}
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-4 py-2 text-sm font-medium"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Reload
          </button>
          <span className="inline-flex items-center px-3 py-2 rounded-2xl bg-white/10 border border-white/10 text-sm">
            {shown.length} shown
          </span>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-3xl bg-rose-600/20 border border-rose-400/30 p-4">
            <p className="font-semibold">Error loading best buys</p>
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
            shown.map((r, i) => (
              <div
                key={r.player_card_id || i}
                className="group p-4 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              >
                {/* Header row */}
                <div className="flex items-center gap-3">
                  {r.player?.image_url ? (
                    <img
                      src={r.player.image_url}
                      alt=""
                      className="w-12 h-12 rounded-lg border border-white/10 bg-black/20 object-cover"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-black/20 border border-white/10" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{r.player?.name || r.player_card_id || "Unknown Player"}</div>
                    <div className="text-sm text-white/70">
                      {r.player?.position || ""} • {r.player?.version || ""} • {r.player?.rating || ""}
                    </div>
                  </div>
                  <RiskPill label={r.risk_label || "Unknown"} />
                </div>

                {/* Stats */}
                <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                  <div className="text-white/70">Current</div>
                  <div className="text-right"><Coin n={r.current} /></div>

                  <div className="text-white/70">Usual</div>
                  <div className="text-right"><Coin n={r.median7} /></div>

                  <div className="text-white/70">Cheap vs usual</div>
                  <div className="text-right">
                    <b>{((r.cheap_pct || 0) * 100).toFixed(1)}%</b>
                  </div>

                  <div className="text-white/70">24h volume</div>
                  <div className="text-right"><b>{Number(r.vol24 || 0).toLocaleString()}</b></div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex gap-2">
                    <span className="px-2 py-1 text-xs rounded-full bg-white/10 border border-white/10">
                      {platform.toUpperCase()}
                    </span>
                    {r.player?.rating ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-white/10 border border-white/10">
                        {r.player.rating}
                      </span>
                    ) : null}
                  </div>
                  <a
                    href={`#/smart-buyer-ai?name=${encodeURIComponent(r.player?.name || "")}&platform=${platform}`}
                    className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 px-3 py-2 text-sm font-medium"
                  >
                    View <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
        </div>

        {!loading && !error && !shown.length && (
          <div className="text-center text-white/70 py-10">
            No signals right now — try again soon.
          </div>
        )}
      </div>
    </div>
  );
}