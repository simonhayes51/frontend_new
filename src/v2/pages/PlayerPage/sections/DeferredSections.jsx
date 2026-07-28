// src/v2/pages/PlayerPage/sections/DeferredSections.jsx
//
// Investment Score/Risk Rating (now ScoresSection) and Expected ROI/
// Holding Period (now RecommendationSection) moved to real sections in
// Phase 3. Suggested Alternatives correctly stays deferred - no
// similar-card engine exists in this design; recommendations.similar_events
// is about related market events, not alternative cards to buy instead.
//
// Historical Matches (win rate / avg profit / avg hold time for similar
// past setups) is deferred for the same reason: recommendation_engine.py
// has no backtest-outcome aggregation anywhere - similar_events is just a
// list of related market_events, not a performance history. Shown here
// honestly as "coming soon" rather than fabricated.
import DeferredPlaceholder from "../../../components/DeferredPlaceholder";

export default function DeferredSections() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <DeferredPlaceholder title="Suggested Alternatives" />
      <DeferredPlaceholder
        title="Historical Matches"
        note="Backtest aggregation (win rate / avg profit / avg hold time for similar setups) isn't computed yet."
      />
    </div>
  );
}
