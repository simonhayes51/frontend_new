import { useEffect, useMemo, useRef, useState } from "react";
import { createChart, CrosshairMode } from "lightweight-charts";

const API_BASE =
  (import.meta?.env?.VITE_API_URL?.replace(/\/$/, "")) || "https://api.futhub.co.uk";

const toUnix = (ts) => Math.floor(new Date(ts).getTime() / 1000);
const seriesFromCandles = (c) =>
  c.map((x) => ({
    time: toUnix(x.open_time),
    open: x.open,
    high: x.high,
    low: x.low,
    close: x.close,
  }));
const lineFrom = (candles, arr) => {
  const out = [];
  if (!Array.isArray(arr)) return out;
  for (let i = 0; i < candles.length; i++) {
    const v = arr[i];
    if (v != null) out.push({ time: toUnix(candles[i].open_time), value: v });
  }
  return out;
};

// Simple banner logic
function computeSignal(candles, ind) {
  if (!candles?.length || !ind) return { label: "Loading…", tone: "neutral" };
  const price = candles[candles.length - 1]?.close;
  const arr = (a) => (Array.isArray(a) ? a.filter((v) => v != null) : []);
  const rsi = arr(ind.rsi14).slice(-1)[0];
  const bbU = arr(ind.bb_upper).slice(-1)[0];
  const bbL = arr(ind.bb_lower).slice(-1)[0];
  const ema20 = arr(ind.ema20).slice(-1)[0];
  if ([rsi, bbU, bbL, ema20].some((v) => v == null))
    return {
      label: "Not enough data yet — keep watching 👀",
      tone: "neutral",
      hints: ["Need a bit more history for tips."],
    };

  const near = (a, b, p = 0.015) => Math.abs(a - b) / b <= p;
  const buy = price < bbL || near(price, bbL) || rsi < 40;
  const sell = price > bbU || near(price, bbU) || rsi > 60;

  if (buy && !sell) {
    const target = Math.round(Math.max(ema20, bbU));
    const stop = Math.round(price * 0.97);
    return {
      label: "BUY — looks cheap 💸",
      tone: "good",
      buyPrice: price,
      targetSell: target,
      stopLoss: stop,
      hints: [
        "Price is in the cheap zone.",
        `Aim to sell ~${target.toLocaleString()}.`,
        "If it dips, consider cutting around -3%.",
      ],
    };
  }
  if (sell && !buy) {
    const target = Math.round(ema20);
    return {
      label: "SELL — looks pricey 🧨",
      tone: "bad",
      sellPrice: price,
      targetBuyBack: target,
      hints: ["Near the expensive zone.", `Could fall back to ~${target.toLocaleString()}.`],
    };
  }
  return {
    label: "HOLD — nothing special right now 💤",
    tone: "neutral",
    hints: ["Wait for cheaper deals (cheap zone) or take profit near expensive zone."],
  };
}

const qp = new URLSearchParams(location.hash.includes("?") ? location.hash.split("?")[1] : "");

export default function SmartBuyerAISimple() {
  const [platform, setPlatform] = useState(qp.get("platform") || "ps");
  const [nameInput, setNameInput] = useState(qp.get("name") || "");
  const [player, setPlayer] = useState(null); // { card_id, name, ... }
  const [suggestions, setSuggestions] = useState([]);
  const [timeframe, setTimeframe] = useState("15m");
  const [status, setStatus] = useState("idle");
  const [summary, setSummary] = useState({ label: "Loading…", tone: "neutral", hints: [] });
  const [lastRsi, setLastRsi] = useState(null);
  const [lastAtr, setLastAtr] = useState(null);
  const [lastPrice, setLastPrice] = useState(null);
  const [placing, setPlacing] = useState(false);

  const wrapRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const ema20Ref = useRef(null);
  const bbURef = useRef(null);
  const bbLRef = useRef(null);

  // Resolve ?name=… on first load
  useEffect(() => {
    const nm = qp.get("name");
    if (!nm) return;
    (async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/players/resolve?name=${encodeURIComponent(nm)}`
        );
        if (res.ok) {
          const js = await res.json();
          setPlayer(js);
          setNameInput(js.name || nm);
        }
      } catch (e) {
        console.warn("resolve-by-name failed", e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Build chart once
  useEffect(() => {
    if (!wrapRef.current) return;
    const chart = createChart(wrapRef.current, {
      layout: { background: { type: "solid", color: "#0b0f14" }, textColor: "#cfe3f3" },
      grid: { vertLines: { color: "#14202b" }, horzLines: { color: "#14202b" } },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false, timeVisible: true, secondsVisible: false },
      crosshair: { mode: CrosshairMode.Normal },
      autoSize: true,
    });
    const candles = chart.addCandlestickSeries({
      upColor: "#2ecc71",
      downColor: "#e74c3c",
      wickUpColor: "#2ecc71",
      wickDownColor: "#e74c3c",
      borderVisible: false,
    });
    const ema20 = chart.addLineSeries({ lineWidth: 2 });
    const bbU = chart.addLineSeries({ lineWidth: 1 });
    const bbL = chart.addLineSeries({ lineWidth: 1 });

    chartRef.current = chart;
    candleSeriesRef.current = candles;
    ema20Ref.current = ema20;
    bbURef.current = bbU;
    bbLRef.current = bbL;

    const onResize = () => chart.applyOptions({ autoSize: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      chart.remove();
    };
  }, []);

  // Debounced name search → suggestions
  useEffect(() => {
    const id = setTimeout(async () => {
      const q = nameInput.trim();
      if (q.length < 2) {
        setSuggestions([]);
        return;
      }
      try {
        const res = await fetch(
          `${API_BASE}/api/players/search?q=${encodeURIComponent(q)}&limit=8`
        );
        const js = await res.json();
        const arr = Array.isArray(js) ? js : Array.isArray(js?.data) ? js.data : [];
        setSuggestions(arr);
      } catch {
        setSuggestions([]);
      }
    }, 250);
    return () => clearTimeout(id);
  }, [nameInput]);

  const urls = useMemo(() => {
    if (!player?.card_id) return null;
    const q = (o) =>
      Object.entries(o)
        .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
        .join("&");
    return {
      candles: `${API_BASE}/api/market/candles?${q({
        player_card_id: player.card_id,
        platform,
        timeframe,
        limit: 500,
      })}`,
      ind: `${API_BASE}/api/market/indicators?${q({
        player_card_id: player.card_id,
        platform,
        timeframe,
      })}`,
      now: `${API_BASE}/api/market/now?${q({
        player_card_id: player.card_id,
        platform,
      })}`,
      buy: `${API_BASE}/api/ai/signal/buy`,
    };
  }, [player, platform, timeframe]);

  async function load() {
    if (!urls) return;
    setStatus("loading…");
    try {
      const [candles, indRaw] = await Promise.all([
        fetch(urls.candles).then((r) => r.json()),
        fetch(urls.ind).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      ]);

      candleSeriesRef.current.setData(seriesFromCandles(candles));

      if (indRaw) {
        ema20Ref.current.setData(lineFrom(candles, indRaw.ema20));
        bbURef.current.setData(lineFrom(candles, indRaw.bb_upper));
        bbLRef.current.setData(lineFrom(candles, indRaw.bb_lower));
        const last = (a) =>
          Array.isArray(a) && a.filter((v) => v != null).length
            ? a.filter((v) => v != null).slice(-1)[0]
            : null;
        setLastRsi(last(indRaw.rsi14));
        setLastAtr(last(indRaw.atr14));
        setSummary(computeSignal(candles, indRaw));
      } else {
        setLastRsi(null);
        setLastAtr(null);
        setSummary({ label: "Not enough data yet — keep watching 👀", tone: "neutral" });
      }

      const lastC = candles[candles.length - 1];
      setLastPrice(lastC?.close ?? null);
      setStatus(`loaded ${candles.length} bars`);
    } catch (e) {
      console.error(e);
      setStatus("error");
      setSummary({ label: "Couldn’t load data", tone: "neutral" });
    }
  }

  // (Re)load when a player is selected or timeframe/platform changes
  useEffect(() => {
    if (urls) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urls?.candles, urls?.ind]);

  async function placeBuy() {
    if (!urls || !player) return;
    try {
      setPlacing(true);
      const now = await fetch(urls.now).then((r) => r.json());
      const body = {
        player_card_id: player.card_id,
        platform,
        qty: 1,
        max_price: now.price, // use current price; you can expose an input if you want a custom cap
        agent: "SimpleAI",
      };
      const res = await fetch(urls.buy, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then((r) => r.json());
      alert(
        res.filled
          ? `Order filled at ${Number(res.fill?.price).toLocaleString()} coins`
          : `Order placed (limit ${Number(res.limit_price).toLocaleString()})`
      );
    } catch (e) {
      alert("Could not place buy: " + e.message);
    } finally {
      setPlacing(false);
    }
  }

  const toneCls =
    summary.tone === "good"
      ? "bg-[#10351f] border-[#1f5a37] text-[#7cf3a1]"
      : summary.tone === "bad"
      ? "bg-[#3a1a1a] border-[#6a2b2b] text-[#ff9b9b]"
      : "bg-[#101923] border-[#213247] text-[#e7edf3]";
  const pill =
    "inline-flex items-center px-2.5 py-1 rounded-full border text-sm border-[#213247] bg-[#101923]";
  const rsiCls =
    lastRsi == null
      ? ""
      : lastRsi < 40
      ? "text-[#7cf3a1]"
      : lastRsi > 60
      ? "text-[#ffba53]"
      : "text-[#e7edf3]";

  return (
    <div className="min-h-screen text-[#e7edf3] bg-[#0b0f14]">
      <div className="max-w-6xl mx-auto p-4 space-y-4">
        <h2 className="text-2xl font-semibold">Smart Buyer — SIMPLE Mode</h2>

        {/* Player search */}
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="opacity-80">Player name</label>
            <br />
            <input
              className="px-2 py-1 rounded border border-[#223146] bg-[#0f141b]"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Type a player (e.g., Kylian Mbappé)"
              style={{ width: 260 }}
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
          <div>
            <label className="opacity-80">Timeframe</label>
            <br />
            <select
              className="px-2 py-1 rounded border border-[#223146] bg-[#0f141b]"
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
            >
              <option value="5m">5m</option>
              <option value="15m">15m</option>
              <option value="1h">1h</option>
            </select>
          </div>
          <button
            onClick={load}
            className="px-3 py-1 rounded-full border border-[#213247] bg-[#101923]"
          >
            Reload
          </button>
          <span className={pill}>{status}</span>
          {player && <span className={pill}>{player.name} (#{player.card_id})</span>}
        </div>

        {/* Suggestions list */}
        {suggestions.length > 0 && (
          <div
            className="p-2 rounded-lg border border-[#1c2633] bg-[#111821]"
            style={{ maxWidth: 480 }}
          >
            {suggestions.map((s) => (
              <div
                key={s.card_id}
                className="flex items-center gap-2 p-1 hover:bg-[#16202b] rounded cursor-pointer"
                onClick={() => {
                  setPlayer(s);
                  setNameInput(s.name);
                  setSuggestions([]);
                }}
              >
                {s.image_url ? (
                  <img
                    src={s.image_url}
                    alt=""
                    className="w-8 h-8 rounded-md border border-[#1c2633]"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-md bg-[#0f141b]" />
                )}
                <div className="text-sm">
                  {s.name}{" "}
                  <span className="opacity-60">
                    • {s.position || ""} • {s.version || ""} • {s.rating || ""}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Banner */}
        <div className={`rounded-xl border p-4 ${toneCls}`}>
          <div className="text-xl font-semibold">{summary.label}</div>
          <div className="mt-1 opacity-80 text-sm">
            {lastPrice ? `Latest sale: ${Number(lastPrice).toLocaleString()} coins` : "—"}
          </div>
          {summary.tone !== "bad" && player && (
            <button
              onClick={placeBuy}
              disabled={placing}
              className="mt-3 px-3 py-1 rounded-full border border-[#2b6d43] bg-[#10351f] text-[#7cf3a1]"
            >
              {placing ? "Placing…" : "Place Buy"}
            </button>
          )}
          {summary.hints?.length ? (
            <ul className="mt-2 pl-5 list-disc opacity-85 text-sm">
              {summary.hints.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          ) : null}
        </div>

        {/* Chart */}
        <div
          ref={wrapRef}
          style={{ height: 520 }}
          className="rounded-xl border border-[#1c2633]"
        />

        {/* Readouts */}
        <div className="flex flex-wrap gap-3">
          <div className="px-3 py-2 rounded-lg border border-[#1c2633] bg-[#111821]">
            <b>Average price</b> (blue line)
          </div>
          <div className="px-3 py-2 rounded-lg border border-[#1c2633] bg-[#111821]">
            <b>Cheap zone</b> (bottom blue)
          </div>
          <div className="px-3 py-2 rounded-lg border border-[#1c2633] bg-[#111821]">
            <b>Expensive zone</b> (top blue)
          </div>
          <div className="px-3 py-2 rounded-lg border border-[#1c2633] bg-[#111821]">
            RSI (hype):{" "}
            <span className={`${pill} ${rsiCls}`}>
              {lastRsi == null ? "—" : Number(lastRsi).toFixed(1)}
            </span>
          </div>
          <div className="px-3 py-2 rounded-lg border border-[#1c2633] bg-[#111821]">
            ATR (how jumpy):{" "}
            <span className={pill}>
              {lastAtr == null ? "—" : Math.round(Number(lastAtr)).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}