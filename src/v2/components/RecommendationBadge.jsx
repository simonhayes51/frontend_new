// src/v2/components/RecommendationBadge.jsx
//
// recommendation_engine.py's RuleV1Strategy only ever assigns
// recommendation in {"buy", "hold", "avoid"} - never "sell"/"wait". This
// deliberately keeps those real labels rather than relabeling "avoid" as
// "SELL" (avoid means "don't buy this now", not "sell what you already
// own" - those are different claims the data doesn't actually make).
const CONFIG = {
  buy: {
    label: "BUY",
    bg: "bg-[var(--v2-positive)]/15",
    text: "text-[var(--v2-positive)]",
    ring: "ring-[var(--v2-positive)]/40",
  },
  hold: {
    label: "HOLD",
    bg: "bg-[var(--v2-warning)]/15",
    text: "text-[var(--v2-warning)]",
    ring: "ring-[var(--v2-warning)]/40",
  },
  avoid: {
    label: "AVOID",
    bg: "bg-[var(--v2-negative)]/15",
    text: "text-[var(--v2-negative)]",
    ring: "ring-[var(--v2-negative)]/40",
  },
};

export default function RecommendationBadge({ recommendation, size = "sm" }) {
  const c = CONFIG[recommendation];
  if (!c) return null;
  const sizeClass = size === "lg" ? "text-sm px-3 py-1" : "text-[10px] px-2 py-0.5";
  return (
    <span
      className={`inline-flex items-center rounded-full font-bold ring-1 whitespace-nowrap ${c.bg} ${c.text} ${c.ring} ${sizeClass}`}
    >
      {c.label}
    </span>
  );
}

// Shared with ConfidenceGauge/border-coloring wherever a recommendation
// drives more than just the badge - keeps the "buy=green/hold=amber/
// avoid=red" mapping defined in exactly one place.
export const TONE_FOR_RECOMMENDATION = { buy: "positive", hold: "warning", avoid: "negative" };
export const BORDER_FOR_RECOMMENDATION = {
  buy: "border-[var(--v2-positive)]/40",
  hold: "border-[var(--v2-warning)]/40",
  avoid: "border-[var(--v2-negative)]/40",
};
