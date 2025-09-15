// src/pages/SmartBuyerAI.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { createChart, CrosshairMode } from "lightweight-charts";

// Use your env value if present, else your API domain
const API_BASE =
  (import.meta?.env?.VITE_API_URL?.replace(/\/$/, "")) || "https://api.futhub.co.uk";

function toUnix(ts) {
  return Math.floor(new Date(ts).getTime() / 1000);
}
function seriesFromCandles(candles) {
  return candles.map((c) => ({
    time: toUnix(c.open_time),
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
  }));
}
function lineFrom(candles, arr) {
  const out = [];
  for (let i = 0; i < candles.length; i++) {
    const v = arr[i];
    if (v != null) out.push({ time: toUnix(candles[i].open_time), value: v });
  }
  return out;
}

// ---------- Simple, FUT-friendly logic ----------
function computeSignal(candles, ind) {
  if (!candles?.length || !ind) {
    return { label: "Loading…", tone: "neutral" };
  }

  const last = candles[candles.length - 1];
  const price = last.close;

  // Last non-null RSI
  const rsi = (ind.rsi14 || []).filter((v) => v != null).slice(-1)[0];
  // Last non-null bands + averages
  const bbU = (ind.bb_upper || []).filter((v) => v != null).slice(-1)[0];
  const bbL = (ind.bb_lower || []).filter((v) => v != null).slice(-1)[0];
  const ema20 = (ind.ema20 || []).filter((v) => v != null).slice(-1)[0];

  // If we don’t have enough history yet, keep it simple
  if ([rsi, bbU, bbL, ema20].some((v) => v == null))
    return {
      label: "Not enough data yet — keep watching 👀",
      tone: "neutral",
      hints: ["Need a few hours of price history for better tips."],
    };

  // Rules (easy to understand):
  // • BUY ZONE  = price near/under the “cheap end” band OR RSI < 40
  // • SELL ZONE = price near/above the “expensive end” band OR RSI > 60
  // • otherwise = HOLD
  const near = (a, b, pct = 0.01) => Math.abs(a - b) / b <= pct;

  const inBuyZone = price < bbL || near(price, bbL, 0.015) || rsi < 40;
  const inSellZone = price > bbU || near(price, bbU, 0.015) || rsi > 60;

  if (inBuyZone && !inSellZone) {
    const target = Math.round(Math.max(ema20, bbU)); // where to aim
    const stop = Math.round(price * 0.97); // simple “don’t go lower than” rule
    return {
      label: "BUY — looks cheap 💸",
      tone: "good",
      buyPrice: price,
      targetSell: target,
      stopLoss: stop,
      hints: [
        "Price is at / below the cheap zone.",
        `Aim to sell around ${target.toLocaleString()}.`,
        "If it dips, consider cutting around -3%.",
      ],
    };
  }

  if (inSellZone && !inBuyZone) {
    const target = Math.round(ema20); // fair value = average
    return {
      label: "SELL — looks pricey 🧨",
      tone: "bad",
      sellPrice: price,
      targetBuyBack: target,
      hints: [
        "Price is near the expensive zone.",
        `Might fall back towards ~${target.toLocaleString()}.`,
      ],
    };
  }

  return {
    label: "HOLD — nothing special right now 💤",
    tone: "neutral",
    hints: [
      "Wait for cheaper deals (below the bottom line) or",
      "take profit when we reach the top line.",
    ],
  };
}

export default function SmartBuyerAISimple() {
  const [cardId, setCardId] = useState("209331"); // Mo Salah as a friendly default
  const [platform, setPlatform] = useState("ps");
  const [timeframe, setTimeframe] = useState("15m");
  const [status, setStatus] = useState("idle");
  const [summary, setSummary] = useState({
    label: "Loading…",
    tone: "neutral",
    hints: [],
  });
  const [lastRsi, setLastRsi] = useState(null);
  const [lastAtr, setLastAtr] = useState(null);
  const [lastPrice, setLastPrice] = useState(null);

  const wrapRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const ema20Ref = useRef(null);
  const bbURef = useRef(null);
  const bbLRef = useRef(null);

  const urls = useMemo(() => {
    const q = (o) =>
      Object.entries(o)
        .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
        .join("&");
    return {
      candles: `${API_BASE}/api/market/candles?${q({
        player_card_id: cardId,
        platform,
        timeframe,
        limit: 500,
      })}`,
      ind: `${API_BASE}/api/market/indicators?${q({
        player_card_id: cardId,
        platform,
        timeframe,
      })}`,
      docs: `${API_BASE}/docs`,
    };
  }, [cardId, platform, timeframe]);

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
    const ema20 = chart.addLineSeries({ lineWidth: 2 }); // rename in UI as “Average price”
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

  async function fetchJSON(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  }

  async function load() {
    setStatus("loading…");
    try {
      const [candles, ind] = await Promise.all([
        fetchJSON(urls.candles),
        fetchJSON(urls.ind).catch(() => null),
      ]);

      // Plot candles
      candleSeriesRef.current.setData(seriesFromCandles(candles));

      if (ind) {
        ema20Ref.current.setData(lineFrom(candles, ind.ema20)); // “Average price”
        bbURef.current.setData(lineFrom(candles, ind.bb_upper)); // “Expensive zone”
        bbLRef.current.setData(lineFrom(candles, ind.bb_lower)); // “Cheap zone”

        const rsi = ind.rsi14?.filter((v) => v != null).slice(-1)[0];
        const atr = ind.atr14?.filter((v) => v != null).slice(-1)[0];
        setLastRsi(rsi ?? null);
        setLastAtr(atr ?? null);
      } else {
        setLastRsi(null);
        setLastAtr(null);
      }

      const last = candles[candles.length - 1];
      setLastPrice(last?.close ?? null);

      // FUT-friendly banner text
      setSummary(computeSignal(candles, ind));

      setStatus(`loaded ${candles.length} bars`);
    } catch (e) {
      console.error(e);
      setStatus("error — check console");
      setSummary({ label: "Couldn’t load data", tone: "neutral", hints: [] });
    }
  }

  // auto-load on inputs change
  useEffect(() => {
    if (!chartRef.current) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urls.candles, urls.ind]);

  // Styles
  const toneCls =
    summary.tone === "good"
      ? "bg-[#10351f] border-[#1f5a37] text-[#7cf3a1]"
      : summary.tone === "bad"
      ? "bg-[#3a1a1a] border-[#6a2b2b] text-[#ff9b9b]"
      : "bg-[#101923] border-[#213247] text-[#e7edf3]";

  const pill =
    "inline-flex items-center px-2.5 py-1 rounded-full border text-sm border-[#213247] bg-[#101923]";

  const rsiCls =
    lastRsi == null ? "" : lastRsi < 40 ? "text-[#7cf3a1]" : lastRsi > 60 ? "text-[#ffba53]" : "text-[#e7edf3]";

  return (
    <div className="min-h-screen text-[#e7edf3] bg-[#0b0f14]">
      <div className="max-w-6xl mx-auto p-4 space-y-4">
        <h2 className="text-2xl font-semibold">Smart Buyer — SIMPLE Mode</h2>

        {/* Inputs */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="space-x-2">
            <label className="opacity-80">Card ID</label>
            <input
              className="px-2 py-1 rounded border border-[#223146] bg-[#0f141b]"
              value={cardId}
              onChange={(e) => setCardId(e.target.value)}
              style={{ width: 140 }}
            />
          </div>
          <div className="space-x-2">
            <label className="opacity-80">Platform</label>
            <select
              className="px-2 py-1 rounded border border-[#223146] bg-[#0f141b]"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
            >
              <option value="ps">ps</option>
              <option value="xbox">xbox</option>
            </select>
          </div>
          <div className="space-x-2">
            <label className="opacity-80">Timeframe</label>
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
            title="Reload"
          >
            Reload
          </button>
          <span className={pill}>{status}</span>
          <a href={`${API_BASE}/docs`} target="_blank" rel="noreferrer" className={`${pill} underline`}>
            Swagger
          </a>
        </div>

        {/* BIG simple banner */}
        <div className={`rounded-xl border p-4 ${toneCls}`}>
          <div className="text-xl font-semibold">{summary.label}</div>
          <div className="mt-1 opacity-80 text-sm">
            {lastPrice ? `Latest sale: ${Number(lastPrice).toLocaleString()} coins` : "—"}
          </div>
          {summary.buyPrice && (
            <div className="mt-2 text-sm">Buy around: <b>{summary.buyPrice.toLocaleString()}</b></div>
          )}
          {summary.targetSell && (
            <div className="text-sm">Aim to sell near: <b>{summary.targetSell.toLocaleString()}</b></div>
          )}
          {summary.stopLoss && (
            <div className="text-sm">Consider stop around: <b>{summary.stopLoss.toLocaleString()}</b></div>
          )}
          {summary.sellPrice && (
            <div className="mt-2 text-sm">Selling now around: <b>{summary.sellPrice.toLocaleString()}</b></div>
          )}
          {summary.targetBuyBack && (
            <div className="text-sm">Maybe buy back near: <b>{summary.targetBuyBack.toLocaleString()}</b></div>
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
        <div ref={wrapRef} style={{ height: 520 }} className="rounded-xl border border-[#1c2633]" />

        {/* Simple readouts */}
        <div className="flex flex-wrap gap-3">
          <div className="px-3 py-2 rounded-lg border border-[#1c2633] bg-[#111821]">
            <b>Average price</b> (blue line) — where it usually sells
          </div>
          <div className="px-3 py-2 rounded-lg border border-[#1c2633] bg-[#111821]">
            <b>Cheap zone</b> (bottom blue line) — good time to buy
          </div>
          <div className="px-3 py-2 rounded-lg border border-[#1c2633] bg-[#111821]">
            <b>Expensive zone</b> (top blue line) — good time to sell
          </div>
          <div className="px-3 py-2 rounded-lg border border-[#1c2633] bg-[#111821]">
            RSI (hype):{" "}
            <span className={`${pill} ${rsiCls}`}>
              {lastRsi == null ? "—" : lastRsi.toFixed(1)}
            </span>
          </div>
          <div className="px-3 py-2 rounded-lg border border-[#1c2633] bg-[#111821]">
            ATR (how jumpy): <span className={pill}>{lastAtr == null ? "—" : Math.round(lastAtr).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}