// src/v2/pages/HomeDashboard/sections/HighConfidenceSection.jsx
import { Link } from "react-router-dom";
import SectionCard from "../../../components/SectionCard";
import PremiumGate from "../../../components/PremiumGate";
import CardArtThumb from "../../../components/CardArtThumb";
import RecommendationBadge from "../../../components/RecommendationBadge";
import ConfidenceGauge from "../../../components/ConfidenceGauge";
import { useHighConfidence } from "../../../hooks/useRecommendationFeeds";

export default function HighConfidenceSection() {
  const { data, isLoading, error } = useHighConfidence({ limit: 8, minConfidence: 70 });
  const items = data?.items || [];
  const status = error?.response?.status;

  return (
    <SectionCard title="High Confidence Investments" subtitle="Confidence ≥ 70%">
      {isLoading ? (
        <p className="text-xs text-[var(--v2-muted)]">Loading...</p>
      ) : status === 401 || status === 402 ? (
        <PremiumGate locked featureName="Opportunity Feed" />
      ) : error ? (
        <p className="text-xs text-[var(--v2-negative)]">Couldn't load right now.</p>
      ) : items.length === 0 ? (
        <p className="text-xs text-[var(--v2-muted)]">No high-confidence picks right now.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-[var(--v2-border)]">
          {items.map((it) => (
            <li key={it.card_id} className="flex items-center gap-3 py-2 text-xs">
              <CardArtThumb card={it} widthClass="w-9" />
              <Link to={`/v2/players/${it.card_id}`} className="flex-1 min-w-0 hover:text-[var(--v2-accent)]">
                <span className="block truncate">
                  {it.name || it.card_id} <span className="text-[var(--v2-muted)]">({it.rating})</span>
                </span>
              </Link>
              <RecommendationBadge recommendation={it.recommendation} />
              <ConfidenceGauge value={it.confidence} size={28} />
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
