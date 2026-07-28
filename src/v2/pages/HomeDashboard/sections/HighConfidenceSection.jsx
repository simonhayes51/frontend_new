// src/v2/pages/HomeDashboard/sections/HighConfidenceSection.jsx
import { Link } from "react-router-dom";
import SectionCard from "../../../components/SectionCard";
import PremiumGate from "../../../components/PremiumGate";
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
            <li key={it.card_id} className="flex items-center justify-between py-1.5 text-xs">
              <Link to={`/v2/players/${it.card_id}`} className="hover:text-[var(--v2-accent)]">
                {it.name || it.card_id} <span className="text-[var(--v2-muted)]">({it.rating})</span>
              </Link>
              <span className="text-[var(--v2-positive)]">{Math.round(it.confidence)}%</span>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
