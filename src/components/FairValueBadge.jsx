// src/components/FairValueBadge.jsx
// The "is this price actually good?" chip - shown anywhere a price is.
// Grounded in real completed sales (fair_value_mv), not vibes.
//
// verdicts: steal | under | fair | overpriced | unknown
// Locked (free tier) rows show the verdict but blur the exact numbers -
// prove the edge exists, gate the precision.
import React from "react";
import { useFairValue } from "../hooks/useFairValue";

const STYLES = {
  steal: { bg: "rgba(145,219,50,0.15)", fg: "#91db32", label: "STEAL" },
  under: { bg: "rgba(145,219,50,0.10)", fg: "#b9e97c", label: "UNDER VALUE" },
  fair: { bg: "rgba(255,255,255,0.08)", fg: "rgba(255,255,255,0.75)", label: "FAIR" },
  overpriced: { bg: "rgba(248,113,113,0.12)", fg: "#f87171", label: "OVERPAY" },
  unknown: { bg: "rgba(255,255,255,0.05)", fg: "rgba(255,255,255,0.4)", label: "NO DATA" },
};

function verdictFrom(data) {
  if (!data) return "unknown";
  if (data.verdict) return data.verdict; // teaser shape (free tier)
  const d = data.discount_pct;
  if (d == null) return "unknown";
  if (d >= 8) return "steal";
  if (d >= 3) return "under";
  if (d <= -5) return "overpriced";
  return "fair";
}

export default function FairValueBadge({ cardId, className = "" }) {
  const { data, isLoading } = useFairValue(cardId);
  if (isLoading || !data) return null;

  const verdict = verdictFrom(data);
  const s = STYLES[verdict] || STYLES.unknown;
  const locked = !!data.locked;
  const pct = data.discount_pct;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${className}`}
      style={{ background: s.bg, color: s.fg }}
      title={
        locked
          ? "Real-sales fair value — go Pro to see the exact numbers"
          : `vs real 24h sold median (${data.sales_24h ?? 0} sales tracked)`
      }
    >
      {s.label}
      {!locked && pct != null && (
        <span className="tabular-nums">{pct > 0 ? `-${Math.abs(pct)}%` : `+${Math.abs(pct)}%`}</span>
      )}
      {locked && <span aria-hidden>🔒</span>}
    </span>
  );
}
