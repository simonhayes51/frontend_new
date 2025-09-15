import { useEffect, useState } from "react";

const API_BASE =
  (import.meta?.env?.VITE_API_URL?.replace(/\/$/, "")) || "https://api.futhub.co.uk";

function RiskPill({ label }) {
  const cls =
    label === "Low"
      ? "bg-[#10351f] border-[#1f5a37] text-[#7cf3a1]"
      : label === "Medium"
      ? "bg-[#3a3010] border-[#6a5a2b] text-[#ffde7a]"
      : "bg-[#3a1a1a] border-[#6a2b2b] text-[#ff9b9b]";
  return (
    <span className={`px-2.5 py-1 rounded-full border text-sm ${cls}`}>{label}</span>
  );
}

export default function BestBuys() {
  const [rows, setRows] = useState([]);
  const [platform, setPlatform] = useState("ps");
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState(""); // player-name filter

  async function load() {
    setLoading(true);
    try {
      const r = await fetch(
        `${API_BASE}/api/ai/top-buys?platform=${encodeURIComponent(platform)}&limit=36`
      );
      const data = await r.json();
      // Defensive: API must return an array; if it returns {data: [...]}, unwrap it.
      const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
      setRows(list);
    } catch (e) {
      console.error("best-buys fetch failed:", e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platform]);

  const filtered = (Array.isArray(rows) ? rows : []).filter((r) => {
    const nm = (r?.player?.name || "").toLowerCase();
    const v = q.trim().toLowerCase();
    return !v || nm.includes(v);
  });

  return (
    <div className="min-h-screen text-[#e7edf3] bg-[#0b0f14]">
      <div className="max-w-6xl mx-auto p-4 space-y-4">
        <h2 className="text-2xl font-semibold">Best Buys Right Now</h2>

        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="opacity-80">Search</label>
            <br />
            <input
              className="px-2 py-1 rounded border border-[#223146] bg-[#0f141b]"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Player name…"
              style={{ width: 240 }}
            />
          </div>
          <div>
            <label className="opacity-80">Platform</label>
            <br />
            <select
              className="px-2 py-1 rounded border border-[#223146] bg-[#0f141b]"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
            >
              <option value="ps">ps</option>
              <option value="xbox">xbox</option>
            </select>
          </div>
          <button
            onClick={load}
            className="px-3 py-1 rounded-full border border-[#213247] bg-[#101923]"
          >
            {loading ? "Loading…" : "Reload"}
          </button>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full border text-sm border-[#213247] bg-[#101923]">
            {filtered.length} shown
          </span>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((r) => (
            <div
              key={r.player_card_id}
              className="p-3 rounded-xl border border-[#1c2633] bg-[#111821]"
            >
              <div className="flex items-center gap-3">
                {r.player?.image_url ? (
                  <img
                    src={r.player.image_url}
                    alt=""
                    className="w-12 h-12 rounded-md border border-[#1c2633]"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-md bg-[#0f141b]" />
                )}
                <div>
                  <div className="font-semibold">
                    {r.player?.name || r.player_card_id}
                  </div>
                  <div className="opacity-70 text-sm">
                    {r.player?.position || ""} • {r.player?.version || ""} •{" "}
                    {r.player?.rating || ""}
                  </div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-1 text-sm">
                <div>Current</div>
                <div className="text-right">
                  <b>{Number(r.current).toLocaleString()}</b>
                </div>
                <div>Usual</div>
                <div className="text-right">
                  <b>{Number(r.median7).toLocaleString()}</b>
                </div>
                <div>Cheap vs usual</div>
                <div className="text-right">
                  <b>{(Number(r.cheap_pct) * 100).toFixed(1)}%</b>
                </div>
                <div>24h volume</div>
                <div className="text-right">
                  <b>{Number(r.vol24).toLocaleString()}</b>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <RiskPill label={r.risk_label} />
                {/* Link by name for friendlier UX; SmartBuyer resolves to card_id */}
                <a
                  href={`#/smart-buyer-ai?name=${encodeURIComponent(
                    r.player?.name || ""
                  )}&platform=${platform}`}
                  className="px-3 py-1 rounded-full border border-[#213247] bg-[#101923]"
                >
                  View
                </a>
              </div>
            </div>
          ))}
        </div>

        {!filtered.length && !loading && (
          <div className="opacity-75">No signals right now — try again soon.</div>
        )}
      </div>
    </div>
  );
}