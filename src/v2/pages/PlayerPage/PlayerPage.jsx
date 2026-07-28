// src/v2/pages/PlayerPage/PlayerPage.jsx
import { useParams } from "react-router-dom";
import { usePlayerSummary } from "../../hooks/usePlayerSummary";
import HeaderSection from "./sections/HeaderSection";
import MarketMetricsSection from "./sections/MarketMetricsSection";
import FairValueSection from "./sections/FairValueSection";
import LazyBuyerSection from "./sections/LazyBuyerSection";
import DealConfidenceSection from "./sections/DealConfidenceSection";
import ScoresSection from "./sections/ScoresSection";
import RecommendationSection from "./sections/RecommendationSection";
import SalesChartSection from "./sections/SalesChartSection";
import DeferredSections from "./sections/DeferredSections";

export default function PlayerPage() {
  const { cardId } = useParams();
  const { data, isLoading, error } = usePlayerSummary(cardId);

  // SalesChartSection calls v1's own /sales-candles and /sales-history
  // endpoints directly (see that file's header comment) - it doesn't
  // depend on anything in the /summary payload, so it mounts and starts
  // fetching immediately below rather than waiting behind summary's
  // isLoading/error gate, which would otherwise force a needless
  // sequential waterfall for two calls that are already independent.
  let summaryContent;
  if (isLoading) {
    summaryContent = <p role="status" className="text-sm text-[var(--v2-muted)]">Loading...</p>;
  } else if (error) {
    const status = error?.response?.status;
    summaryContent = (
      <p role="alert" className="text-sm text-[var(--v2-negative)]">
        {status === 404 ? "Player not found." : "Something went wrong loading this card."}
      </p>
    );
  } else {
    summaryContent = (
      <>
        <HeaderSection meta={data?.meta} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <MarketMetricsSection marketMetrics={data?.market_metrics} />
          <FairValueSection fairValue={data?.fair_value} />
          <LazyBuyerSection lazyBuyerScore={data?.lazy_buyer_score} />
          <DealConfidenceSection dealConfidence={data?.deal_confidence} />
        </div>

        <RecommendationSection recommendation={data?.recommendation} />
        <ScoresSection cardScores={data?.card_scores} />
      </>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto flex flex-col gap-6">
      {summaryContent}

      <SalesChartSection cardId={cardId} />

      {!isLoading && !error && <DeferredSections />}
    </div>
  );
}
