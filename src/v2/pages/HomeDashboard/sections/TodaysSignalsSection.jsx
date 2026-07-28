// src/v2/pages/HomeDashboard/sections/TodaysSignalsSection.jsx
//
// Replaces the old separate Opportunities/High-Confidence/Avoid
// SectionCards (each a small text list) with one unified, ranked hero
// row of large SignalHeroCards - the defining visual section of the
// reference design. Combines the two real "buy" feeds (deduping by
// card_id, opportunities first since it's already confidence-sorted)
// with the avoid feed, ranked by confidence. There is no "hold" feed
// today (recommendation_engine.py can produce a hold verdict, but no
// endpoint surfaces a hold-only feed) - shown honestly as whatever mix
// of buy/avoid signals is real, not padded with a fabricated example.
import SectionCard from "../../../components/SectionCard";
import PremiumGate from "../../../components/PremiumGate";
import SignalHeroCard from "../../../components/SignalHeroCard";
import { useOpportunities, useHighConfidence, useCardsToAvoid } from "../../../hooks/useRecommendationFeeds";

export default function TodaysSignalsSection() {
  const { data: opps, isLoading: oppsLoading, error: oppsError } = useOpportunities({ limit: 6 });
  const { data: highConf } = useHighConfidence({ limit: 6, minConfidence: 70 });
  const { data: avoid, isLoading: avoidLoading } = useCardsToAvoid({ limit: 4 });

  const status = oppsError?.response?.status;

  if (oppsLoading || avoidLoading) {
    return (
      <SectionCard title="Today's Best Opportunities" subtitle="AI ranked by expected value, confidence and timing">
        <p className="text-xs text-[var(--v2-muted)]">Loading...</p>
      </SectionCard>
    );
  }

  if (status === 401 || status === 402) {
    return (
      <SectionCard title="Today's Best Opportunities" subtitle="AI ranked by expected value, confidence and timing">
        <PremiumGate locked featureName="Opportunity Feed" />
      </SectionCard>
    );
  }

  const seen = new Set();
  const buys = [...(opps?.items || []), ...(highConf?.items || [])].filter((it) => {
    if (seen.has(it.card_id)) return false;
    seen.add(it.card_id);
    return true;
  });
  const avoids = avoid?.items || [];

  const ranked = [...buys, ...avoids].sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0)).slice(0, 6);

  return (
    <SectionCard title="Today's Best Opportunities" subtitle="AI ranked by expected value, confidence and timing">
      {ranked.length === 0 ? (
        <p className="text-xs text-[var(--v2-muted)]">No strong signals right now.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ranked.map((it, i) => (
            <SignalHeroCard key={`${it.recommendation}-${it.card_id}`} item={it} rank={i + 1} />
          ))}
        </div>
      )}
    </SectionCard>
  );
}
