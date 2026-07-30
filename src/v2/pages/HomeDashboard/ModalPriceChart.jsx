import { useState } from "react";
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useSalesCandles } from "../../hooks/useSalesCandles";
import CoinValue from "../../components/CoinValue";

const RANGES = {
  "24h": { days: 1, bucketHours: 1 },
  "7d": { days: 7, bucketHours: 4 },
  "30d": { days: 30, bucketHours: 12 },
};

export default function ModalPriceChart({ cardId, entryPrice, targetPrice, fairValue }) {
  const [range, setRange] = useState("7d");
  const config = RANGES[range];
  const { data, isLoading, isError } = useSalesCandles(cardId, config);
  const points = (data?.candles || []).map((c) => ({
    time: Number(c.time) * 1000,
    price: Number(c.close),
  })).filter((point) => Number.isFinite(point.price));

  return <div className="dash-price-chart">
    <div className="dash-price-chart-head">
      <div><strong>Completed sales</strong></div>
      <div className="dash-chart-ranges" aria-label="Chart range">
        {Object.keys(RANGES).map(key => <button key={key} className={range === key ? "active" : ""} onClick={() => setRange(key)}>{key}</button>)}
      </div>
    </div>
    <div className="dash-chart-frame">
      {isLoading ? <div className="dash-chart-loading"><i/><i/><i/><i/></div>
      : isError || points.length === 0 ? <div className="dash-chart-empty">Not enough completed sales yet.</div>
      : <ResponsiveContainer width="100%" height={190}>
          <AreaChart data={points} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
            <defs><linearGradient id={`modalPriceFill-${cardId}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#9cff3b" stopOpacity={0.34}/><stop offset="100%" stopColor="#9cff3b" stopOpacity={0}/></linearGradient></defs>
            <CartesianGrid stroke="#1b3040" strokeDasharray="3 4" vertical={false}/>
            <XAxis dataKey="time" type="number" domain={["dataMin", "dataMax"]} scale="time" tickFormatter={formatDay} tick={{ fill: "#7892a8", fontSize: 10 }} axisLine={false} tickLine={false}/>
            <YAxis domain={["auto", "auto"]} width={55} tickFormatter={compactCoins} tick={{ fill: "#7892a8", fontSize: 10 }} axisLine={false} tickLine={false}/>
            <Tooltip content={<PriceTooltip/>}/>
            {entryPrice > 0 && <ReferenceLine y={entryPrice} stroke="#ffd34d" strokeDasharray="5 4" label={{ value: "BUY", fill: "#ffd34d", fontSize: 10, position: "insideTopRight" }}/>} 
            {fairValue > 0 && <ReferenceLine y={fairValue} stroke="#65c7ff" strokeDasharray="3 4" label={{ value: "FAIR", fill: "#65c7ff", fontSize: 10, position: "insideTopLeft" }}/>} 
            {targetPrice > 0 && <ReferenceLine y={targetPrice} stroke="#9cff3b" strokeDasharray="5 4" label={{ value: "SELL", fill: "#9cff3b", fontSize: 10, position: "insideTopRight" }}/>} 
            <Area type="monotone" dataKey="price" stroke="#9cff3b" strokeWidth={3} fill={`url(#modalPriceFill-${cardId})`} activeDot={{ r: 5 }} dot={false}/>
          </AreaChart>
        </ResponsiveContainer>}
    </div>
  </div>;
}

function PriceTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return <div className="dash-chart-tooltip"><strong><CoinValue value={point.price}/></strong><span>{new Date(point.time).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span></div>;
}
function formatDay(value) { return new Date(value).toLocaleDateString("en-GB", { weekday: "short", day: "numeric" }); }
function compactCoins(value) { const n=Number(value); return Number.isFinite(n) ? (n>=1000?`${Math.round(n/1000)}k`:String(Math.round(n))) : ""; }
