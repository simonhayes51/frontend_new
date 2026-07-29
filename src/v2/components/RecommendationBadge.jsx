// src/v2/components/RecommendationBadge.jsx
//
// rule_v1 (recommendation_engine.py) only ever assigned recommendation
// in {"buy", "hold", "avoid"} - never "sell". Recommendation Engine
// V1.2 (recommendation_engine_v2.py) added real held-position logic
// that can produce a genuine "sell" (see _legacy_recommendation()) for
// a card you already own that the engine now says to close out - a
// different, stronger claim than "avoid" (don't buy this) ever made.
// Without a "sell" entry here, CONFIG[recommendation] was undefined and
// the component silently rendered nothing for a real sell signal -
// the single worst outcome for a recommendation UI, worse than a wrong
// label.
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
  sell: {
    label: "SELL",
    bg: "bg-[var(--v2-negative)]/15",
    text: "text-[var(--v2-negative)]",
    ring: "ring-[var(--v2-negative)]/40",
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
export const TONE_FOR_RECOMMENDATION = { buy: "positive", hold: "warning", sell: "negative", avoid: "negative" };
export const BORDER_FOR_RECOMMENDATION = {
  buy: "border-[var(--v2-positive)]/40",
  hold: "border-[var(--v2-warning)]/40",
  sell: "border-[var(--v2-negative)]/40",
  avoid: "border-[var(--v2-negative)]/40",
};
