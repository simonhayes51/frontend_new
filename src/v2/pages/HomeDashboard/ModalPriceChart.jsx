import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useSalesCandles } from "../../hooks/useSalesCandles";

export default function ModalPriceChart({ cardId, entryPrice, targetPrice }) {
  const { data, isLoading, isError } = useSalesCandles(cardId, { days: 7, bucketHours: 4 });
  const points = (data?.candles || []).map((c) => ({
    time: Number(c.time) * 1000,
    price: Number(c.close),
  })).filter((point) => Number.isFinite(point.price));

  return (
    <div className="dash-price-chart">
      <div className="dash-price-chart-head">
        <div><span>7-day price</span><strong>Completed sales</strong></div>
        <small>Hover for exact prices</small>
      </div>
      {isLoading ? (
        <div className="dash-chart-loading"><i/><i/><i/><i/></div>
      ) : isError || points.length === 0 ? (
        <div className="dash-chart-empty">No recent completed-sale chart is available for this card.</div>
      ) : (
        <ResponsiveContainer width="100%" height={190}>
          <AreaChart data={points} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`modalPriceFill-${cardId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#9cff3b" stopOpacity={0.34}/>
                <stop offset="100%" stopColor="#9cff3b" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#1b3040" strokeDasharray="3 4" vertical={false}/>
            <XAxis dataKey="time" type="number" domain={["dataMin", "dataMax"]} scale="time" tickFormatter={formatDay} tick={{ fill: "#7892a8", fontSize: 10 }} axisLine={false} tickLine={false}/>
            <YAxis domain={["auto", "auto"]} width={55} tickFormatter={compactCoins} tick={{ fill: "#7892a8", fontSize: 10 }} axisLine={false} tickLine={false}/>
            <Tooltip content={<PriceTooltip/>}/>
            {entryPrice > 0 && <ReferenceLine y={entryPrice} stroke="#ffd34d" strokeDasharray="5 4" label={{ value: "BUY", fill: "#ffd34d", fontSize: 10, position: "insideTopRight" }}/>} 
            {targetPrice > 0 && <ReferenceLine y={targetPrice} stroke="#9cff3b" strokeDasharray="5 4" label={{ value: "SELL", fill: "#9cff3b", fontSize: 10, position: "insideTopRight" }}/>} 
            <Area type="monotone" dataKey="price" stroke="#9cff3b" strokeWidth={3} fill={`url(#modalPriceFill-${cardId})`} activeDot={{ r: 5 }} dot={false}/>
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

function PriceTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return <div className="dash-chart-tooltip"><strong>{Math.round(point.price).toLocaleString("en-GB")} coins</strong><span>{new Date(point.time).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span></div>;
}

function formatDay(value) {
  return new Date(value).toLocaleDateString("en-GB", { weekday: "short" });
}

function compactCoins(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "";
  return number >= 1000 ? `${Math.round(number / 1000)}k` : String(Math.round(number));
}
