// src/components/SalesCandleChart.jsx
//
// Real OHLC candlesticks built from actual completed sales
// (bin_sales_history_sync.py's sales_history table), not the BIN-snapshot
// line the old Price History chart showed - this is what things actually
// sold for, with individual sale markers overlaid when there are few
// enough to read.
import React, { useEffect, useRef, useState } from "react";
import { createChart } from "lightweight-charts";

const API_BASE = import.meta.env.VITE_API_URL || "";

// Validated status pair (dataviz skill reference palette) - "good"/"critical"
// steps, both clear 3:1 contrast against the app's dark chart surface.
const UP_COLOR = "#0ca30c";
const DOWN_COLOR = "#d03b3b";
const MARKER_COLOR = "#878c9c";

// Above this, individual markers would just paint a solid line on top of
// the candles instead of conveying anything - the candle bodies/wicks are
// already the real data at that volume, just aggregated.
const MAX_MARKERS = 200;

export default function SalesCandleChart({
  cardId,
  bucketHours = 1,
  days = 7,
  height = 320,
  className = "",
}) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sampleSize, setSampleSize] = useState(0);

  useEffect(() => {
    if (!containerRef.current || chartRef.current) return;
    chartRef.current = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height,
      layout: { background: { color: "transparent" }, textColor: "#e5e7eb" },
      grid: { horzLines: { color: "#1b1e29" }, vertLines: { visible: false } },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false, timeVisible: true, secondsVisible: false },
      crosshair: { mode: 0 },
    });
    seriesRef.current = chartRef.current.addCandlestickSeries({
      upColor: UP_COLOR,
      downColor: DOWN_COLOR,
      borderUpColor: UP_COLOR,
      borderDownColor: DOWN_COLOR,
      wickUpColor: UP_COLOR,
      wickDownColor: DOWN_COLOR,
    });

    const onResize = () =>
      chartRef.current?.applyOptions({ width: containerRef.current.clientWidth });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      chartRef.current?.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [height]);

  useEffect(() => {
    if (!cardId || !seriesRef.current) return;
    let aborted = false;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const url = `${API_BASE}/api/players/${cardId}/sales-candles?bucket_hours=${bucketHours}&days=${days}`;
        const r = await fetch(url, { credentials: "include" });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = await r.json();
        if (aborted || !seriesRef.current) return;

        const candles = Array.isArray(data?.candles) ? data.candles : [];
        const sales = Array.isArray(data?.sales) ? data.sales : [];
        setSampleSize(sales.length);

        seriesRef.current.setData(candles);
        seriesRef.current.setMarkers(
          sales.length > 0 && sales.length <= MAX_MARKERS
            ? sales.map((s) => ({
                time: s.time,
                position: "inBar",
                color: MARKER_COLOR,
                shape: "circle",
              }))
            : []
        );
      } catch (e) {
        if (!aborted) {
          setError(e?.message || "Failed to load sales candles");
          setSampleSize(0);
          seriesRef.current?.setData([]);
        }
      } finally {
        if (!aborted) setLoading(false);
      }
    })();

    return () => {
      aborted = true;
    };
  }, [cardId, bucketHours, days]);

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-lg">Real Sales Chart</h3>
        <span className="text-xs text-white/50">
          {sampleSize > 0
            ? sampleSize <= MAX_MARKERS
              ? `${sampleSize} sales marked`
              : `${sampleSize}+ sales (too many to mark individually)`
            : null}
        </span>
      </div>
      <div ref={containerRef} style={{ width: "100%", height }} />
      {loading && <div className="text-center text-sm text-slate-400 py-2">Loading real sales data…</div>}
      {!loading && error && <div className="text-center text-sm text-red-400 py-2">{error}</div>}
      {!loading && !error && sampleSize === 0 && (
        <div className="text-center text-sm text-slate-400 py-2">
          Not enough completed sales tracked yet to build a chart for this card.
        </div>
      )}
    </div>
  );
}
