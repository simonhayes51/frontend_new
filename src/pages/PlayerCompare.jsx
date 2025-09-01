// src/pages/PlayerCompare.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import PriceTrendChart from "../components/PriceTrendChart.jsx";

const API_BASE = import.meta.env.VITE_API_URL || "";
const PLACEHOLDER = "/img/card-placeholder.png";
const buildProxy = (url) => `${API_BASE}/img?url=${encodeURIComponent(url)}`;

async function fetchPlayerDefinition(cardId) {
  try {
    const r = await fetch(`${API_BASE}/api/fut-player-definition/${cardId}`, { credentials: "include" });
    if (!r.ok) return null;
    const data = await r.json();
    return data?.data || null;
  } catch (e) {
    console.error("def err", e);
    return null;
  }
}

async function fetchPlayerPrice(cardId) {
  try {
    const r = await fetch(`${API_BASE}/api/fut-player-price/${cardId}`, { credentials: "include" });
    if (!r.ok) return null;
    const data = await r.json();
    return {
      current: data?.data?.currentPrice?.price ?? null,
      isExtinct: data?.data?.currentPrice?.isExtinct ?? false,
      updatedAt: data?.data?.currentPrice?.priceUpdatedAt ?? null,
      auctions: data?.data?.completedAuctions ?? [],
    };
  } catch (e) {
    console.error("price err", e);
    return null;
  }
}

async function addToWatchlist({ player_name, card_id, version, platform, notes }) {
  const r = await fetch(`${API_BASE}/api/watchlist`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ player_name, card_id, version, platform, notes }),
  });
  const payload = await r.json().catch(() => null);
  if (!r.ok) throw new Error(payload?.detail || "Failed to add to watchlist");
  return payload;
}

function number(v) {
  if (v == null) return "—";
  return Number(v).toLocaleString();
}

function priceRangeFromAuctions(auctions) {
  const values = (auctions || []).map(a => a?.soldPrice).filter(Boolean);
  if (!values.length) return null;
  return { min: Math.min(...values), max: Math.max(...values) };
}

function CardBlock({ cardId, platform }) {
  const [loading, setLoading] = useState(true);
  const [def, setDef] = useState(null);
  const [price, setPrice] = useState(null);
  const [notes, setNotes] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let live = true;
    (async () => {
      setLoading(true);
      const [d, p] = await Promise.all([fetchPlayerDefinition(cardId), fetchPlayerPrice(cardId)]);
      if (!live) return;
      setDef(d);
      setPrice(p);
      setLoading(false);
    })();
    return () => { live = false; };
  }, [cardId]);

  const meta = useMemo(() => {
    const fullName =
      def?.commonName ||
      (def?.firstName && def?.lastName ? `${def.firstName} ${def.lastName}` : `Card ${cardId}`);
    const club = def?.club?.name || "—";
    const nation = def?.nation?.name || "—";
    const league = def?.league?.name || "—";
    const rating = def?.overall ?? "—";
    const version = def?.rarity?.name || "Base";
    const position =
      def?.positionName ||
      def?.shortPosition ||
      def?.mainPosition ||
      def?.preferredPosition1Name ||
      "—";
    const cardImage = def?.futggCardImagePath
      ? `https://game-assets.fut.gg/cdn-cgi/image/quality=90,format=auto,width=500/${def.futggCardImagePath}`
      : PLACEHOLDER;

    return { fullName, club, nation, league, rating, version, position, cardImage };
  }, [def]);

  const range = useMemo(() => priceRangeFromAuctions(price?.auctions), [price]);
  const recentSales = (price?.auctions || []).slice(0, 8);

  return (
    <div className="bg-black/40 border border-white/10 rounded-2xl p-4">
      <div className="flex items-start gap-4">
        <div className="relative">
          <img
            src={meta.cardImage}
            alt={meta.fullName}
            className="w-36 h-52 object-contain"
            onError={(e) => {
              const img = e.currentTarget;
              if (!img.dataset.triedProxy && meta.cardImage) {
                img.dataset.triedProxy = "1";
                img.src = buildProxy(meta.cardImage);
              } else {
                img.src = PLACEHOLDER;
              }
            }}
            referrerPolicy="no-referrer"
          />
          <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
            {meta.version}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-xl font-semibold mb-1 truncate">{meta.fullName} <span className="text-white/60">{meta.rating}</span></div>
          <div className="text-sm text-white/70 mb-3">
            {meta.position} · {meta.club} · {meta.league} · {meta.nation}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 rounded-md p-3 border border-white/10">
              <div className="text-xs text-white/70">Current Price ({platform.toUpperCase()})</div>
              <div className="text-lg font-bold text-yellow-300 mt-1">
                {loading ? "…" : price?.isExtinct ? "Extinct" : number(price?.current)}
              </div>
            </div>
            <div className="bg-white/5 rounded-md p-3 border border-white/10">
              <div className="text-xs text-white/70">Range (recent sales)</div>
              <div className="text-sm font-medium mt-1">
                {range ? `${number(range.min)} – ${number(range.max)}` : "—"}
              </div>
            </div>
          </div>

          {/* Watchlist */}
          <div className="mt-3 flex items-center gap-2">
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes (optional)"
              className="w-56 px-2 py-1 rounded-md bg-black/50 border border-white/15 text-white text-sm"
            />
            <button
              disabled={adding}
              onClick={async () => {
                try {
                  setAdding(true);
                  await addToWatchlist({
                    player_name: meta.fullName,
                    card_id: Number(cardId),
                    version: meta.version,
                    platform,
                    notes: notes?.trim() || null,
                  });
                  alert("Added to watchlist ✓");
                  setNotes("");
                } catch (e) {
                  alert(e?.message || "Failed");
                } finally {
                  setAdding(false);
                }
              }}
              className="px-3 py-2 rounded-md bg-lime-400/90 hover:bg-lime-400 text-black font-semibold text-sm"
            >
              {adding ? "Adding…" : "+ Add to Watchlist"}
            </button>
          </div>
        </div>
      </div>

      {/* Recent sales */}
      <div className="mt-4">
        <div className="text-sm text-white/70 mb-2">Recent Sales</div>
        {recentSales.length ? (
          <div className="grid grid-cols-2 gap-2">
            {recentSales.map((a, i) => (
              <div key={i} className="flex items-center justify-between text-sm bg-white/10 border border-white/10 rounded px-2 py-1">
                <span className="text-white/80">{a?.soldDate ? new Date(a.soldDate).toLocaleString() : "—"}</span>
                <span className="font-medium text-yellow-300">{a?.soldPrice ? number(a.soldPrice) : "—"}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-white/60">No recent sales.</div>
        )}
      </div>

      {/* Chart (today / week) */}
      <div className="mt-4">
        <PriceTrendChart playerId={Number(cardId)} platform={platform} initialTimeframe="today" height={220} />
      </div>
    </div>
  );
}

export default function PlayerCompare() {
  const [sp, setSp] = useSearchParams();
  const navigate = useNavigate();
  const [platform, setPlatform] = useState("ps");

  // Read up to two ids from the query string: /player-compare?ids=123,456
  const idsParam = sp.get("ids") || "";
  const ids = idsParam.split(",").map(s => s.trim()).filter(Boolean).slice(0, 2);
  const idA = ids[0] || "";
  const idB = ids[1] || "";

  const [inputA, setInputA] = useState(idA);
  const [inputB, setInputB] = useState(idB);

  const applyIds = () => {
    const next = [inputA.trim(), inputB.trim()].filter(Boolean).slice(0, 2).join(",");
    if (next) {
      sp.set("ids", next);
    } else {
      sp.delete("ids");
    }
    navigate({ pathname: "/player-compare", search: sp.toString() });
  };

  return (
    <div className="min-h-screen relative text-white">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-black" />
      <div className="relative z-10 p-6">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-6 flex flex-wrap items-end gap-3">
            <h1 className="text-3xl font-bold">Player Compare</h1>
            <div className="ml-auto flex items-center gap-2">
              <label className="text-sm text-white/70">Platform</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="px-2 py-1 rounded-md bg-black/50 border border-white/15 text-white text-sm"
              >
                <option value="ps">PS</option>
                <option value="xbox">Xbox</option>
              </select>
            </div>
          </div>

          {/* ID inputs */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                value={inputA}
                onChange={(e) => setInputA(e.target.value)}
                placeholder="First Card ID (e.g. 12345)"
                className="px-3 py-2 rounded-md bg-black/50 border border-white/15 text-white text-sm"
              />
              <input
                value={inputB}
                onChange={(e) => setInputB(e.target.value)}
                placeholder="Second Card ID (optional)"
                className="px-3 py-2 rounded-md bg-black/50 border border-white/15 text-white text-sm"
              />
              <button
                onClick={applyIds}
                className="px-3 py-2 rounded-md bg-blue-500 hover:bg-blue-400 text-black font-semibold text-sm"
              >
                Compare
              </button>
            </div>
            <div className="text-xs text-white/60 mt-2">
              Tip: you can deep-link like <code>/player-compare?ids=12345,67890</code>
            </div>
          </div>

          {/* Cards */}
          {ids.length === 0 ? (
            <div className="text-white/80">Enter 1–2 card IDs above to compare.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CardBlock cardId={ids[0]} platform={platform} />
              {ids[1] ? <CardBlock cardId={ids[1]} platform={platform} /> : <div className="border border-dashed border-white/15 rounded-2xl p-4 text-white/60 flex items-center justify-center">Add a second ID to compare</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
