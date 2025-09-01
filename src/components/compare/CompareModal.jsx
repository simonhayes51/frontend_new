import React, { useMemo, useState } from "react";
import { useCompare } from "../../context/CompareContext";
import { addToWatchlist, platformLabel } from "../../api/compare";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";

function Chip({ children }) {
  return <span className="px-2 py-0.5 rounded-full text-[11px] bg-neutral-800 border border-neutral-700">{children}</span>;
}

function Stat({ label, value }) {
  return (
    <div className="flex items-center justify-between text-sm py-1">
      <span className="text-neutral-400">{label}</span>
      <span className="font-medium">{value ?? "—"}</span>
    </div>
  );
}

function number(v) {
  if (v === null || v === undefined) return "—";
  if (typeof v !== "number") return String(v);
  return v.toLocaleString();
}

function pct(v) {
  if (v === null || v === undefined) return "—";
  return `${v > 0 ? "+" : ""}${v}%`;
}

function PriceGraph({ data, short }) {
  const tsFmt = (v) => {
    const d = new Date(v);
    return short ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : d.toLocaleDateString();
  };
  const vals = (data || []).map((d) => d.price).filter((x) => typeof x === "number");
  const ymin = vals.length ? Math.max(0, Math.floor(Math.min(...vals) * 0.95)) : undefined;
  const ymax = vals.length ? Math.ceil(Math.max(...vals) * 1.05) : undefined;
  return (
    <div className="h-40">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data || []} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <XAxis dataKey="t" tickFormatter={tsFmt} hide={short} />
          <YAxis domain={[ymin ?? "auto", ymax ?? "auto"]} tickFormatter={(v) => (typeof v === "number" ? v.toLocaleString() : v)} />
          <Tooltip formatter={(v) => (typeof v === "number" ? v.toLocaleString() + "c" : v)} labelFormatter={(l) => new Date(l).toLocaleString()} />
          <Line type="monotone" dataKey="price" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function Card({ p, platform }) {
  const [period, setPeriod] = useState("short"); // short=24h, long=7d
  const pr = p?.priceRange || {};
  const trend = p?.trend || {};
  const short = p?.history?.short || [];
  const long = p?.history?.long || [];
  const graphData = period === "short" ? short : long;

  const liquidity = useMemo(() => {
    const n = (p?.recentSales || []).length;
    if (n >= 15) return "High";
    if (n >= 6) return "Medium";
    if (n > 0) return "Low";
    return "—";
  }, [p?.recentSales]);

  return (
    <div className="bg-neutral-900 rounded-2xl p-4 shadow-xl border border-neutral-800">
      <div className="flex items-center gap-3">
        {p.image ? (
          <img src={p.image} alt={p.name} className="w-14 h-20 object-contain" />
        ) : (
          <div className="w-14 h-20 bg-neutral-800 rounded" />
        )}
        <div className="min-w-0">
          <div className="text-lg font-semibold truncate">{p.name} <span className="text-neutral-400">{p.rating}</span></div>
          <div className="flex flex-wrap gap-1 mt-1 text-[11px] text-neutral-400">
            <Chip>{p.position || "—"}</Chip>
            {p.club && <Chip>{p.club}</Chip>}
            {p.nation && <Chip>{p.nation}</Chip>}
            {p.league && <Chip>{p.league}</Chip>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <Stat label={`Price (${platformLabel(platform)})`} value={p?.prices?.console ? number(p.prices.console) + "c" : "—"} />
        <Stat label="Price (PC)" value={p?.prices?.pc ? number(p.prices.pc) + "c" : "—"} />
        <Stat label="Range Price" value={pr.min && pr.max ? `${number(pr.min)}–${number(pr.max)}c` : "—"} />
        <Stat label="24h Low / High" value={trend.low24h && trend.high24h ? `${number(trend.low24h)} / ${number(trend.high24h)}c` : "—"} />
        <Stat label="Trend 4h" value={pct(trend.chg4hPct)} />
        <Stat label="Trend 24h" value={pct(trend.chg24hPct)} />
        <Stat label="Liquidity" value={liquidity} />
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-neutral-400">Price Graph</div>
          <div className="flex gap-1 text-xs">
            <button onClick={() => setPeriod("short")} className={`px-2 py-1 rounded ${period === "short" ? "bg-neutral-800" : "bg-neutral-900 border border-neutral-800"}`}>24h</button>
            <button onClick={() => setPeriod("long")} className={`px-2 py-1 rounded ${period === "long" ? "bg-neutral-800" : "bg-neutral-900 border border-neutral-800"}`}>7d</button>
          </div>
        </div>
        <PriceGraph data={graphData} short={period === "short"} />
      </div>

      <div className="mt-4">
        <div className="text-sm text-neutral-400 mb-2">Recent Sales</div>
        {p.recentSales && p.recentSales.length ? (
          <div className="max-h-28 overflow-auto text-sm divide-y divide-neutral-800 border border-neutral-800 rounded-xl">
            {p.recentSales.slice(0, 10).map((s, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2">
                <span>{new Date(s.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                <span className="font-medium">{number(s.price)}c</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-neutral-500">No recent sales.</div>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={async () => {
            try {
              await addToWatchlist({ cardId: p.id, name: p.name, version: p.version || "", platform });
              alert("Added to watchlist");
            } catch (e) {
              alert(e?.message || "Failed to add to watchlist");
            }
          }}
          className="px-3 py-2 rounded-xl bg-lime-400/20 border border-lime-400 text-lime-300 text-sm"
        >
          + Add to Watchlist
        </button>
      </div>
    </div>
  );
}

export default function CompareModal() {
  const { open, setOpen, data, platform, setPlatform, selected, clear, loading, error } = useCompare();
  const p1 = data?.[0];
  const p2 = data?.[1];

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 top-8 mx-auto max-w-6xl px-4">
            <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="text-lg font-semibold">Compare Players</div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-neutral-400">Platform:</span>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-1"
                  >
                    <option value="ps">PlayStation</option>
                    <option value="xbox">Xbox</option>
                    <option value="pc">PC</option>
                  </select>
                  <button onClick={() => setOpen(false)} className="px-3 py-1 rounded-xl border border-neutral-700 hover:bg-neutral-800 text-sm">Close</button>
                </div>
              </div>

              {error && <div className="mt-3 text-sm text-red-400">{error}</div>}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {p1 ? <Card p={p1} platform={platform} /> : <div className="h-80 border border-neutral-800 rounded-2xl" />}
                {p2 ? <Card p={p2} platform={platform} /> : <div className="h-80 border border-neutral-800 rounded-2xl" />}
              </div>

              <div className="flex items-center justify-between mt-4 text-xs text-neutral-400">
                <div>Selected: {selected.join(", ") || "—"}</div>
                <button onClick={clear} className="underline">Clear selection</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {loading && (
        <div className="fixed inset-0 z-40 pointer-events-none flex items-center justify-center">
          <div className="px-3 py-1 rounded bg-neutral-900 border border-neutral-700 text-sm">Loading…</div>
        </div>
      )}
    </>
  );
}
