// src/v2/pages/PlayerPage/sections/DeferredSections.jsx
//
// No real data source exists yet for these (Analytics Engine / AI
// Recommendation Engine / Market Events pipeline are Phase 2-3) -
// visibly labeled, not faked, not silently omitted.
import DeferredPlaceholder from "../../../components/DeferredPlaceholder";

export default function DeferredSections() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <DeferredPlaceholder title="Investment Score" />
      <DeferredPlaceholder title="Risk Rating" />
      <DeferredPlaceholder title="Expected ROI / Holding Period" />
      <DeferredPlaceholder title="Suggested Alternatives" />
    </div>
  );
}
