import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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

/* ---------------- FUT tick helpers + trade plan calculator ---------------- */

function futTick(n) {
  if (n < 1000) return 50;
  if (n < 10000) return 100;
  if (n < 50000) return 250;
  if (n < 100000) return 500;
  if (n < 500000) return 1000;
  if (n < 1000000) return 2000;
  return 5000;
}
const roundDown = (n) => Math.floor(n / futTick(n)) * futTick(n);
const roundUp = (n) => Math.ceil(n / futTick(n)) * futTick(n);

function computeTradePlan({ latestPrice, avgPrice, cheapZone, expensiveZone }) {
  const avg = avgPrice ?? latestPrice ?? null;

  // Max-buy: prefer top of cheap zone; else 1% under latest; else 98% of avg
  const cheapTop = cheapZone ? Math.max(...cheapZone) : null;
  let buyRaw = null;
  if (cheapTop != null) buyRaw = cheapTop;
  else if (latestPrice != null) buyRaw = latestPrice * 0.99;
  else if (avg != null) buyRaw = avg * 0.98;
  const maxBuy = buyRaw != null ? roundDown(buyRaw) : null;

  // Sell: prefer bottom of expensive zone; else 1% above avg
  const expLow = expensiveZone ? Math.min(...expensiveZone) : null;
  let sellRaw = null;
  if (expLow != null) sellRaw = expLow;
  else if (avg != null) sellRaw = avg * 1.01;
  const sell = sellRaw != null ? roundUp(sellRaw) : null;

  // Economics
  const tax = sell != null ? Math.floor(sell * 0.05) : null;
  const profit = sell != null && maxBuy != null ? sell - tax - maxBuy : null;
  const roi = profit != null && maxBuy > 0 ? (profit / maxBuy) * 100 : null;

  return { maxBuy, sell, tax, profit, roi };
}

function TradePlanModal({ open, onClose, player, values }) {
  if (!open) return null;
  const { maxBuy, sell, tax, profit, roi } = values || {};
  const fmt = (n) => (n == null ? "—" : `${Math.round(n).toLocaleString()} c`);

  async function copy() {
    const text = `Trade Plan — ${player?.name}
Max buy: ${fmt(maxBuy)}
List/sell: ${fmt(sell)}
EA tax: ${fmt(tax)}
Profit: ${fmt(profit)} (${roi?.toFixed?.(1) ?? "—"}%)
(Helper only — no orders are placed)`;
    try {
      await navigator.clipboard.writeText(text);
    } catch {}
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-[#1b1030] border border-white/10 p-5">
        <h3 className="text-lg font-bold mb-2">🧮 Trade Plan (Targets) — {player?.name}</h3>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span>Max buy</span><b>{fmt(maxBuy)}</b></div>
          <div className="flex justify-between"><span>List / sell</span><b>{fmt(sell)}</b></div>
          <div className="flex justify-between text-white/70"><span>EA tax (5%)</span><span>{fmt(tax)}</span></div>
          <div className="flex justify-between">
            <span>Profit (after tax)</span>
            <b className={profit > 0 ? "text-emerald-300" : "text-rose-300"}>
              {fmt(profit)} {roi != null ? `(${roi.toFixed(1)}%)` : ""}
            </b>
          </div>
        </div>

        <div className="mt-4 flex gap-2 justify-end">
          <button onClick={copy} className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-sm">
            Copy targets
          </button>
          <button onClick={onClose} className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm">
            Done
          </button>
        </div>

        <p className="mt-3 text-xs text-white/60">
          Helper only — this does <b>not</b> place any orders. Use these targets in-game.
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------ */

function normalizePlatform(p) {
  const v = (p || "").toLowerCase();
  if (["ps", "playstation", "console"].includes(v)) return "ps";
  if (["xbox", "xb"].includes(v)) return "xbox";
  if (["pc", "origin"].includes(v)) return "pc";
  return "ps";
}

export default function SmartBuyerPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSug, setShowSug] = useState(false);

  const [platform, setPlatform] = useState("ps");
  const [timeframe, setTimeframe] = useState("15m");

  const [player, setPlayer] = useState(null);
  const [latestPrice, setLatestPrice] = useState(null);
  const [priceSource, setPriceSource] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  // Trade Plan modal state
  const [tpOpen, setTpOpen] = useState(false);
  const [tpValues, setTpValues] = useState(null);

  // Avoid double-parsing on first mount
  const bootRef = useRef(false);

  // --- autocomplete ---
  const fetchSuggestions = useMemo(
    () =>
      debounce(async (term) => {
        if (!term?.trim()) {
          setSuggestions([]);
          return;
        }
        try {
          const js = await api(`/api/players/autocomplete?q=${encodeURIComponent(term)}`);
          setSuggestions(js?.items || []);
          setShowSug(true);
        } catch {
          /* ignore */
        }
      }, 200),
    []
  );

  useEffect(() => {
    fetchSuggestions(q);
    return () => {};
  }, [q, fetchSuggestions]);

  // --- read URL params (name/card_id/platform) on mount or when hash query changes ---
  useEffect(() => {
    const sp = new URLSearchParams(location.search || "");
    const qsPlatform = sp.get("platform");
    const qsName = sp.get("name");
    const qsId = sp.get("card_id");

    if (qsPlatform) setPlatform(normalizePlatform(qsPlatform));

    // Only resolve once on first load if we don't already have a player
    if (!bootRef.current && !player) {
      bootRef.current = true;

      if (qsId) {
        // Fast path: load by id
        (async () => {
          try {
            const meta = await api(`/api/players/${encodeURIComponent(qsId)}`);
            setPlayer({
              cardId: meta.card_id,
              name: meta.name,
              rating: meta.rating,
              imageUrl: meta.image_url,
              position: meta.position,
            });
            setQ(meta.name || "");
          } catch {
            if (qsName) {
              setQ(qsName);
              resolveByName(qsName);
            }
          }
        })();
      } else if (qsName) {
        setQ(qsName);
        resolveByName(qsName);
      }
    }
  }, [location.search]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep URL in sync when platform or player changes
  useEffect(() => {
    if (!player) return;
    const sp = new URLSearchParams(location.search || "");
    const curName = sp.get("name") || "";
    const curPlat = sp.get("platform") || "";
    const desiredName = player.name || "";
    const desiredPlat = platform || "";

    if (curName !== desiredName || curPlat !== desiredPlat) {
      navigate(`?name=${encodeURIComponent(desiredName)}&platform=${encodeURIComponent(desiredPlat)}`, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player?.name, platform]);

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
    navigate(`?name=${encodeURIComponent(item.name)}&platform=${encodeURIComponent(platform)}`, { replace: true });
  }

  // --- resolve (with fallback to /search) ---
  async function resolveByName(name) {
    if (!name?.trim()) return;
    try {
      const js = await api(`/api/players/resolve?name=${encodeURIComponent(name)}`);
      setPlayer({
        cardId: js.card_id,
        name: js.name,
        rating: js.rating,
        imageUrl: js.image_url,
        position: js.position,
      });
      navigate(`?name=${encodeURIComponent(js.name)}&platform=${encodeURIComponent(platform)}`, { replace: true });
    } catch {
      const r = await api(`/api/players/search?q=${encodeURIComponent(name)}&limit=1`);
      const first = r?.players?.[0];
      if (first) {
        setPlayer({
          cardId: first.card_id,
          name: first.name,
          rating: first.rating,
          imageUrl: first.image_url,
          position: first.position,
        });
        navigate(`?name=${encodeURIComponent(first.name)}&platform=${encodeURIComponent(platform)}`, { replace: true });
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

      const hist = Array.isArray(h?.history) ? h.history : [];
      setHistory(hist);

      // 1) prefer last candle close
      let latest = hist.length ? Number(hist[hist.length - 1].close) : null;
      let source = hist.length ? "candles" : null;

      // 2) else use /price
      if (latest == null && p?.price != null) {
        latest = p.price;
        source = p.source || "price";
      }

      // 3) fallback: player meta snapshot if still null
      if (latest == null) {
        try {
          const meta = await api(`/api/players/${player.cardId}`);
          latest = meta?.price_num ?? meta?.price ?? null;
          source = "players";
        } catch { /* ignore */ }
      }

      setLatestPrice(latest);
      setPriceSource(source);
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
    if (history?.length) {
      const closes = history.map((c) => Number(c.close) || 0).filter(Boolean);
      if (closes.length) {
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
      }
    }

    if (latestPrice != null) {
      const avg = latestPrice;
      return {
        avgPrice: avg,
        cheapZone: [Math.round(avg * 0.97), Math.round(avg * 0.99)],
        expensiveZone: [Math.round(avg * 1.01), Math.round(avg * 1.04)],
        rsi: null,
        atr: null,
      };
    }

    return { avgPrice: null, cheapZone: null, expensiveZone: null, rsi: null, atr: null };
  }, [history, latestPrice]);

  // open Trade Plan modal
  function openTradePlan() {
    const values = computeTradePlan({ latestPrice, avgPrice, cheapZone, expensiveZone });
    setTpValues(values);
    setTpOpen(true);
  }

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
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  suggestions[0] ? selectSuggestion(suggestions[0]) : resolveByName(q);
                }
              }}
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
        onTradePlan={openTradePlan}
        hideHeaderReload={true}
      >
        <Chart history={history} priceSource={priceSource} />
      </SmartBuyerSimpleRedesign>

      {/* Source pill */}
      {priceSource && (
        <div className="mt-4 text-xs text-zinc-400">
          Price source: <span className="px-2 py-1 rounded bg-white/10 text-white">{priceSource}</span>
        </div>
      )}

      {/* Trade Plan modal */}
      <TradePlanModal open={tpOpen} onClose={() => setTpOpen(false)} player={player} values={tpValues} />
    </div>
  );
}

/* Lightweight chart */
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
    const onResize = () =>
      chartRef.current?.applyOptions({
        width: ref.current.clientWidth,
        height: 360,
      });
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

  if (!history?.length) {
    return (
      <div className="flex h-[360px] w-full items-center justify-center text-zinc-400 bg-black/20 rounded-2xl">
        <span>No chart data yet</span>
      </div>
    );
  }

  return <div ref={ref} className="h-[360px] w-full" />;
}