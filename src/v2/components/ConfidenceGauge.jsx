// src/v2/components/ConfidenceGauge.jsx
//
// Circular percentage gauge via recharts' RadialBarChart - recharts is
// already a dependency used elsewhere (SalesChartSection.jsx), so this
// needs no new package. Cyan accent fill, matching v2's existing color
// identity (kept deliberately, not the reference mockups' green/lime).
import { RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";

export default function ConfidenceGauge({ value, size = 44 }) {
  if (value === null || value === undefined) return null;
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const data = [{ value: pct, fill: "var(--v2-accent)" }];
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <RadialBarChart
        width={size}
        height={size}
        innerRadius="70%"
        outerRadius="100%"
        data={data}
        startAngle={90}
        endAngle={-270}
      >
        <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
        <RadialBar dataKey="value" cornerRadius={size} background={{ fill: "var(--v2-border)" }} />
      </RadialBarChart>
      <span
        className="absolute inset-0 flex items-center justify-center font-semibold text-[var(--v2-text)]"
        style={{ fontSize: Math.max(8, size * 0.24) }}
      >
        {pct}%
      </span>
    </div>
  );
}
