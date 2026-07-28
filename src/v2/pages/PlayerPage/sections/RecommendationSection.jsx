// src/v2/pages/PlayerPage/sections/RecommendationSection.jsx
//
// Prop-driven from the aggregated /summary response (data.recommendation),
// same pattern as its sibling sections.
import SectionCard from "../../../components/SectionCard";
import StatTile from "../../../components/StatTile";
import PremiumGate from "../../../components/PremiumGate";
import { formatPct } from "../../../lib/format";

const VERDICT_TONE = { buy: "positive", avoid: "negative", sell: "negative", hold: "neutral" };
const VERDICT_LABEL = { buy: "BUY", sell: "SELL", hold: "HOLD", avoid: "AVOID" };

export default function RecommendationSection({ recommendation }) {
  // _safe() on the backend turns a require_feature() 401/402 into
  // {error, status} instead of letting it 500 the whole summary - that
  // shape means "locked," distinct from a genuine "not scored yet."
  if (recommendation?.status === 401 || recommendation?.status === 402) {
    return (
      <SectionCard title="AI Recommendation">
        <PremiumGate locked featureName="AI Recommendations" />
      </SectionCard>
    );
  }

  if (!recommendation || recommendation.error) {
    return (
      <SectionCard title="AI Recommendation">
        <p className="text-xs text-[var(--v2-muted)]">No recommendation for this card yet.</p>
      </SectionCard>
    );
  }

  const data = recommendation;
  const tone = VERDICT_TONE[data.recommendation];

  return (
    <SectionCard title="AI Recommendation" subtitle={data.engine_version}>
      <div className="flex items-center gap-3 mb-3">
        <span
          className={`text-lg font-bold ${
            tone === "positive"
              ? "text-[var(--v2-positive)]"
              : tone === "negative"
              ? "text-[var(--v2-negative)]"
              : "text-[var(--v2-muted)]"
          }`}
        >
          {VERDICT_LABEL[data.recommendation] || data.recommendation}
        </span>
        <span className="text-xs text-[var(--v2-muted)]">{Math.round(data.confidence)}% confidence</span>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-3">
        <StatTile
          label="Expected ROI"
          value={data.expected_roi_pct !== null && data.expected_roi_pct !== undefined ? formatPct(data.expected_roi_pct, { withSign: true }) : "—"}
        />
        <StatTile label="Holding period" value={data.holding_period_days ? `${data.holding_period_days}d` : "—"} />
        <StatTile label="Risk" value={data.risk_rating || "—"} />
      </div>

      {data.reasoning && <p className="text-xs text-[var(--v2-muted)] mb-2">{data.reasoning}</p>}

      {(data.similar_events || []).length > 0 && (
        <div className="text-xs text-[var(--v2-muted)]">
          Related events: {data.similar_events.map((e) => e.title).join(", ")}
        </div>
      )}
    </SectionCard>
  );
}
