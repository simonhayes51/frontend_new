// src/v2/pages/HomeDashboard/sections/OpportunitiesSection.jsx
import { Link } from "react-router-dom";
import SectionCard from "../../../components/SectionCard";
import PremiumGate from "../../../components/PremiumGate";
import CardArtThumb from "../../../components/CardArtThumb";
import RecommendationBadge from "../../../components/RecommendationBadge";
import ConfidenceGauge from "../../../components/ConfidenceGauge";
import { useOpportunities } from "../../../hooks/useRecommendationFeeds";
import { formatPct } from "../../../lib/format";

export default function OpportunitiesSection() {
  const { data, isLoading, error } = useOpportunities({ limit: 8 });
  const items = data?.items || [];
  const status = error?.response?.status;

  return (
    <SectionCard title="Today's Opportunities" subtitle="AI-flagged buy signals">
      {isLoading ? (
        <p className="text-xs text-[var(--v2-muted)]">Loading...</p>
      ) : status === 401 || status === 402 ? (
        <PremiumGate locked featureName="Opportunity Feed" />
      ) : error ? (
        <p className="text-xs text-[var(--v2-negative)]">Couldn't load opportunities right now.</p>
      ) : items.length === 0 ? (
        <p className="text-xs text-[var(--v2-muted)]">No strong buy signals right now.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-[var(--v2-border)]">
          {items.map((it) => (
            <li key={it.card_id} className="flex items-center gap-3 py-2 text-xs">
              <CardArtThumb card={it} widthClass="w-9" />
              <Link to={`/v2/players/${it.card_id}`} className="flex-1 min-w-0 hover:text-[var(--v2-accent)]">
                <span className="block truncate">
                  {it.name || it.card_id} <span className="text-[var(--v2-muted)]">({it.rating})</span>
                </span>
                <span className="block text-[var(--v2-muted)]">
                  {it.expected_roi_pct !== null ? formatPct(it.expected_roi_pct, { withSign: true }) : "—"}
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
