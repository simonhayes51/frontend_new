import { useEffect, useMemo, useRef, useState } from "react";
import { createChart, CrosshairMode } from "lightweight-charts";

const API_BASE = import.meta?.env?.VITE_API_URL?.replace(/\/$/, "") || "https://api.futhub.co.uk";

function toUnix(ts) {
  return Math.floor(new Date(ts).getTime() / 1000);
}

function seriesFromCandles(candles) {
  return candles.map(c => ({
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

export default function SmartBuyerAI() {
  // defaults — swap the card if you like
  const [cardId, setCardId] = useState("209331"); // Mo Salah
  const [platform, setPlatform] = useState("ps");
  const [timeframe, setTimeframe] = useState("15m");
  const [status, setStatus] = useState("idle");
  const [aiNote, setAiNote] = useState("—");
  const [rsi, setRsi] = useState(null);
  const [atr, setAtr] = useState(null);

  const wrapRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const ema20Ref = useRef(null);
  const ema50Ref = useRef(null);
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
      ai: `${API_BASE}/api/ai/recommendations?${q({
        player_card_id: cardId,
        platform,
      })}`,
      docs: `${API_BASE}/docs`,
    };
  }, [cardId, platform, timeframe]);

  // build chart once
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
    const ema50 = chart.addLineSeries({ lineWidth: 2 });
    const bbU = chart.addLineSeries({ lineWidth: 1 });
    const bbL = chart.addLineSeries({ lineWidth: 1 });

    chartRef.current = chart;
    candleSeriesRef.current = candles;
    ema20Ref.current = ema20;
    ema50Ref.current = ema50;
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
      const [candles, ind, ai] = await Promise.all([
        fetchJSON(urls.candles),
        fetchJSON(urls.ind).catch(() => null),
        fetchJSON(urls.ai).catch(() => null),
      ]);

      // plot candles
      candleSeriesRef.current.setData(seriesFromCandles(candles));

      // overlays
      if (ind) {
        ema20Ref.current.setData(lineFrom(candles, ind.ema20));
        ema50Ref.current.setData(lineFrom(candles, ind.ema50));
        bbURef.current.setData(lineFrom(candles, ind.bb_upper));
        bbLRef.current.setData(lineFrom(candles, ind.bb_lower));

        const lastRSI = ind.rsi14.filter((v) => v != null).slice(-1)[0];
        const lastATR = ind.atr14.filter((v) => v != null).slice(-1)[0];
        setRsi(lastRSI ?? null);
        setAtr(lastATR ?? null);
      } else {
        setRsi(null);
        setAtr(null);
      }

      // AI text
      if (ai) {
        setAiNote(ai.ok ? `${ai.action} — ${ai.comment || ""}` : ai.reason || "No signal");
      } else {
        setAiNote("—");
      }

      setStatus(`loaded ${candles.length} bars`);
    } catch (e) {
      console.error(e);
      setStatus("error — check console");
      setAiNote("—");
    }
  }

  // auto-load
  useEffect(() => {
    if (!chartRef.current) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urls.candles, urls.ind, urls.ai]);

  // simple pill styling
  const pill = (cls) =>
    "inline-flex items-center px-2.5 py-1 rounded-full border text-sm " +
    (cls || "border-[#213247] bg-[#101923]");

  const rsiCls =
    rsi == null ? "" : rsi < 30 ? "text-[#ff6d6d]" : rsi > 70 ? "text-[#ffba53]" : "text-[#6de38f]";

  return (
    <div className="min-h-screen text-[#e7edf3] bg-[#0b0f14]">
      <div className="max-w-6xl mx-auto p-4 space-y-4">
        <h2 className="text-2xl font-semibold">Smart Buyer — AI Chart</h2>

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
              <option value="4h">4h</option>
            </select>
          </div>
          <button
            onClick={load}
            className="px-3 py-1 rounded-full border border-[#213247] bg-[#101923]"
            title="Reload"
          >
            Reload
          </button>
          <span className={pill()}>{status}</span>
          <a href={`${API_BASE}/docs`} target="_blank" rel="noreferrer" className={pill("underline")}>
            Swagger
          </a>
        </div>

        <div ref={wrapRef} style={{ height: 520 }} className="rounded-xl border border-[#1c2633]" />

        <div className="flex flex-wrap gap-3">
          <div className="px-3 py-2 rounded-lg border border-[#1c2633] bg-[#111821]">
            <b>AI:</b> <span>{aiNote}</span>
          </div>
          <div className="px-3 py-2 rounded-lg border border-[#1c2633] bg-[#111821]">
            RSI14:{" "}
            <span className={`${pill()} ${rsiCls}`}>
              {rsi == null ? "—" : rsi.toFixed(1)}
            </span>
          </div>
          <div className="px-3 py-2 rounded-lg border border-[#1c2633] bg-[#111821]">
            ATR14: <span className={pill()}>{atr == null ? "—" : Math.round(atr).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
