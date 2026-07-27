// src/v2/pages/PlayerPage/PlayerPage.jsx
import { useParams } from "react-router-dom";
import { usePlayerSummary } from "../../hooks/usePlayerSummary";
import HeaderSection from "./sections/HeaderSection";
import MarketMetricsSection from "./sections/MarketMetricsSection";
import FairValueSection from "./sections/FairValueSection";
import LazyBuyerSection from "./sections/LazyBuyerSection";
import DealConfidenceSection from "./sections/DealConfidenceSection";
import SalesChartSection from "./sections/SalesChartSection";
import DeferredSections from "./sections/DeferredSections";

export default function PlayerPage() {
  const { cardId } = useParams();
  const { data, isLoading, error } = usePlayerSummary(cardId);

  if (isLoading) {
    return <div className="p-6 text-sm text-[var(--v2-muted)]">Loading...</div>;
  }

  if (error) {
    const status = error?.response?.status;
    return (
      <div className="p-6 text-sm text-[var(--v2-negative)]">
        {status === 404 ? "Player not found." : "Something went wrong loading this card."}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto flex flex-col gap-6">
      <HeaderSection meta={data?.meta} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MarketMetricsSection marketMetrics={data?.market_metrics} />
        <FairValueSection fairValue={data?.fair_value} />
        <LazyBuyerSection lazyBuyerScore={data?.lazy_buyer_score} />
        <DealConfidenceSection dealConfidence={data?.deal_confidence} />
      </div>

      <SalesChartSection cardId={cardId} />

      <DeferredSections />
    </div>
  );
}
