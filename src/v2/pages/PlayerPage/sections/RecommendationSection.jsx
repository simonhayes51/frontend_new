// src/v2/pages/PlayerPage/sections/RecommendationSection.jsx
//
// Prop-driven from the aggregated /summary response (data.recommendation).
// The badge/gauge/ROI verdict itself is already shown once, prominently,
// in HeaderSection's hero - this section is deliberately just the "WHY
// NOW?" reasoning breakdown so it doesn't repeat the same three numbers
// a second time, matching the reference design's separate WHY NOW panel.
import SectionCard from "../../../components/SectionCard";
import PremiumGate from "../../../components/PremiumGate";
import WhyNowChecklist from "../../../components/WhyNowChecklist";

export default function RecommendationSection({ recommendation }) {
  // _safe() on the backend turns a require_feature() 401/402 into
  // {error, status} instead of letting it 500 the whole summary - that
  // shape means "locked," distinct from a genuine "not scored yet."
  if (recommendation?.status === 401 || recommendation?.status === 402) {
    return (
      <SectionCard title="Why now?">
        <PremiumGate locked featureName="AI Recommendations" />
      </SectionCard>
    );
  }

  if (!recommendation || recommendation.error) {
    return (
      <SectionCard title="Why now?">
        <p className="text-xs text-[var(--v2-muted)]">No recommendation for this card yet.</p>
      </SectionCard>
    );
  }

  const data = recommendation;

  return (
    <SectionCard title="Why now?" subtitle={data.engine_version}>
      {data.reasoning && <p className="text-xs text-[var(--v2-muted)] mb-3">{data.reasoning}</p>}
      <WhyNowChecklist marketDrivers={data.market_drivers} recommendation={data.recommendation} />
    </SectionCard>
  );
}
