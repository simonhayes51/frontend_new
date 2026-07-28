// src/v2/pages/PlayerPage/sections/RecommendationSection.jsx
//
// Prop-driven from the aggregated /summary response (data.recommendation),
// same pattern as its sibling sections.
import SectionCard from "../../../components/SectionCard";
import StatTile from "../../../components/StatTile";
import PremiumGate from "../../../components/PremiumGate";
import RecommendationBadge from "../../../components/RecommendationBadge";
import WhyNowChecklist from "../../../components/WhyNowChecklist";
import { formatPct } from "../../../lib/format";

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

  return (
    <SectionCard title="AI Recommendation" subtitle={data.engine_version}>
      <div className="flex items-center gap-3 mb-3">
        <RecommendationBadge recommendation={data.recommendation} size="lg" />
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

      {data.reasoning && <p className="text-xs text-[var(--v2-muted)] mb-3">{data.reasoning}</p>}

      <WhyNowChecklist marketDrivers={data.market_drivers} recommendation={data.recommendation} />
    </SectionCard>
  );
}
