import React, { useEffect, useMemo, useRef, useState } from "react";
import { createChart } from "lightweight-charts";
import SmartBuyerSimpleRedesign from "../components/SmartBuyerSimpleRedesign";
import { Search, Gamepad2 } from "lucide-react";

const API_BASE =
  (import.meta?.env?.VITE_API_URL?.replace(/\/$/, "")) || "https://api.futhub.co.uk";

async function api(path, opts = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText} ${text || ""}`.trim());
  }
  return res.json();
}

// tiny debounce util (no deps)
function debounce(fn, wait = 200) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

const TF_TO_SERVICE = { "15m": "today", "1h": "today", "4h": "today", "24h": "today" };

export default function SmartBuyerPage() {
  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSug, setShowSug] = useState(false);

  const [platform, setPlatform] = useState("ps");
  const [timeframe, setTimeframe] = useState("15m");

  const [player, setPlayer] = useState(null);
  const [latestPrice, setLatestPrice] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- autocomplete ---
  const fetchSuggestions = useMemo(
    () => debounce(async (term) => {
      if (!term?.trim()) { setSuggestions([]); return; }
      try {
        const js = await api(`/api/players/autocomplete?q=${encodeURIComponent(term)}`);
        setSuggestions(js?.items || []);
        setShowSug(true);
      } catch { /* ignore */ }
    }, 200),
    []
  );

  useEffect(() => {
    fetchSuggestions(q);
    return () => {}; // noop cleanup (our debounce has internal timer)
  }, [q, fetchSuggestions]);

  async function selectSuggestion(item) {
    setShowSug(false);
    setQ(item.name);
    setPlayer({
      cardId: item.card_id,
      name: item.name,
      rating: item.rating,
      imageUrl: item.image_url,
      position: item.position,
    });
  }

  // --- resolve (with fallback to /search) ---
  async function resolveByName(name) {
    if (!name?.trim()) return;
    try {
      const js = await api(`/api/players/resolve?name=${encodeURIComponent(name)}`);
      setPlayer({ cardId: js.card_id, name: js.name, rating: js.rating, imageUrl: js.image_url, position: js.position });
    } catch {
      const r = await api(`/api/players/search?q=${encodeURIComponent(name)}&limit=1`);
      const first = r?.players?.[0];
      if (first) {
        setPlayer({ cardId: first.card_id, name: first.name, rating: first.rating, imageUrl: first.image_url, position: first.position });
      }
    }
  }

  // --- data loaders ---
  async function loadData() {
    if (!player?.cardId) return;
    setLoading(true);
    try {
      const [p, h] = await Promise.all([
        api(`/api/players/${player.cardId}/price?platform=${platform}`),
        api(`/api/players/${player.cardId}/history?platform=${platform}&tf=${TF_TO_SERVICE[timeframe] || "today"}`),
      ]);
      setLatestPrice(p?.price ?? null);
      setHistory(Array.isArray(h?.history) ? h.history : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (player) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player?.cardId, platform, timeframe]);

  // --- derive bands ---
  const { avgPrice, cheapZone, expensiveZone, rsi, atr } = useMemo(() => {
    if (!history?.length) return { avgPrice: null, cheapZone: null, expensiveZone: null, rsi: null, atr: null };
    const closes = history.map((c) => Number(c.close) || 0).filter(Boolean);
    if (!closes.length) return { avgPrice: null, cheapZone: null, expensiveZone: null, rsi: null, atr: null };
    const avg = Math.round(closes.reduce((a, b) => a + b, 0) / closes.length);

    const cheapLo = Math.round(avg * 0.97);
    const cheapHi = Math.round(avg * 0.99);
    const expLo = Math.round(avg * 1.01);
    const expHi = Math.round(avg * 1.04);

    const diffs = closes.slice(1).map((v, i) => v - closes[i]);
    const gains = diffs.filter((d) => d > 0).reduce((a, b) => a + b, 0) / (diffs.length || 1);
    const losses = Math.abs(diffs.filter((d) => d < 0).reduce((a, b) => a + b, 0)) / (diffs.length || 1);
    const rs = losses ? gains / losses : 1;
    const rsiVal = Math.max(0, Math.min(100, 100 - 100 / (1 + rs)));
    const atrVal = Math.round(
      history.map((c) => Math.abs((Number(c.high) || 0) - (Number(c.low) || 0))).reduce((a, b) => a + b, 0) /
      (history.length || 1)
    );

    return {
      avgPrice: avg,
      cheapZone: [cheapLo, cheapHi],
      expensiveZone: [expLo, expHi],
      rsi: Number.isFinite(rsiVal) ? rsiVal : null,
      atr: Number.isFinite(atrVal) ? atrVal : null,
    };
  }, [history]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* Top controls */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        {/* Search + suggestions */}
        <div className="relative flex-1">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-3">
            <Search className="w-4 h-4 text-zinc-300" />
            <input
              className="w-full bg-transparent py-3 text-white placeholder:text-zinc-400 focus:outline-none"
              placeholder="Type a player name (e.g., Mohamed Salah)"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onFocus={() => suggestions.length && setShowSug(true)}
              onKeyDown={(e) => { if (e.key === "Enter") (suggestions[0] ? selectSuggestion(suggestions[0]) : resolveByName(q)); }}
            />
            <button
              onClick={() => (suggestions[0] ? selectSuggestion(suggestions[0]) : resolveByName(q))}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-3 py-2"
            >
              Select
            </button>
          </div>

          {showSug && suggestions.length > 0 && (
            <div className="absolute z-20 mt-2 w-full rounded-xl bg-[#1b1030] border border-white/10 shadow-xl overflow-hidden">
              {suggestions.map((s) => (
                <button
                  key={`${s.card_id}-${s.name}`}
                  onClick={() => selectSuggestion(s)}
                  className="w-full text-left px-3 py-2 hover:bg-white/5 flex items-center gap-2 text-sm text-white"
                >
                  <img src={s.image_url} alt="" className="w-6 h-6 rounded" />
                  <span className="flex-1">{s.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <select
          className="rounded-2xl bg-white/5 border border-white/10 px-3 py-2 text-white"
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
        >
          <option value="15m">15m</option>
          <option value="1h">1h</option>
          <option value="4h">4h</option>
          <option value="24h">24h</option>
        </select>

        <select
          className="rounded-2xl bg-white/5 border border-white/10 px-3 py-2 text-white"
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
        >
          <option value="ps">PS</option>
          <option value="xbox">Xbox</option>
          <option value="pc">PC</option>
        </select>

        <button
          onClick={() => player && loadData()}
          className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-sm font-medium text-white"
          disabled={!player || loading}
        >
          <Gamepad2 className={`w-4 h-4 ${loading ? "animate-pulse" : ""}`} />
          Reload
        </button>
      </div>

      <SmartBuyerSimpleRedesign
        player={player}
        platform={platform}
        timeframe={timeframe}
        latestPrice={latestPrice}
        avgPrice={avgPrice}
        cheapZone={cheapZone}
        expensiveZone={expensiveZone}
        rsi={rsi}
        atr={atr}
        onReload={() => player && loadData()}
        hideHeaderReload={true}
      >
        <Chart history={history} />
      </SmartBuyerSimpleRedesign>
    </div>
  );
}

/* Lightweight area chart */
function Chart({ history }) {
  const ref = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    if (!chartRef.current) {
      chartRef.current = createChart(ref.current, {
        width: ref.current.clientWidth,
        height: 360,
        layout: { background: { color: "transparent" }, textColor: "#e5e7eb" },
        grid: { horzLines: { visible: false }, vertLines: { visible: false } },
        rightPriceScale: { borderVisible: false },
        timeScale: { borderVisible: false },
        crosshair: { mode: 0 },
      });
      seriesRef.current = chartRef.current.addAreaSeries({ lineWidth: 2 });
    }
    const onResize = () => chartRef.current?.applyOptions({ width: ref.current.clientWidth, height: 360 });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!seriesRef.current) return;
    if (!history?.length) {
      seriesRef.current.setData([]);
      return;
    }
    const data = history.map((c) => ({
      time: Math.floor(new Date(c.open_time).getTime() / 1000),
      value: Number(c.close) || 0,
    }));
    seriesRef.current.setData(data);
  }, [history]);

  return <div ref={ref} className="h-[360px] w-full" />;
}
