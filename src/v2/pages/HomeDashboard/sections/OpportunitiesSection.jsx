// src/v2/pages/HomeDashboard/sections/OpportunitiesSection.jsx
import { Link } from "react-router-dom";
import SectionCard from "../../../components/SectionCard";
import { useOpportunities } from "../../../hooks/useRecommendationFeeds";
import { formatPct } from "../../../lib/format";

export default function OpportunitiesSection() {
  const { data, isLoading, error } = useOpportunities({ limit: 8 });
  const items = data?.items || [];

  return (
    <SectionCard title="Today's Opportunities" subtitle="AI-flagged buy signals">
      {isLoading ? (
        <p className="text-xs text-[var(--v2-muted)]">Loading...</p>
      ) : error ? (
        <p className="text-xs text-[var(--v2-negative)]">Couldn't load opportunities right now.</p>
      ) : items.length === 0 ? (
        <p className="text-xs text-[var(--v2-muted)]">No strong buy signals right now.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-[var(--v2-border)]">
          {items.map((it) => (
            <li key={it.card_id} className="flex items-center justify-between py-1.5 text-xs">
              <Link to={`/v2/players/${it.card_id}`} className="hover:text-[var(--v2-accent)]">
                {it.name || it.card_id} <span className="text-[var(--v2-muted)]">({it.rating})</span>
              </Link>
              <span className="text-[var(--v2-positive)]">
                {Math.round(it.confidence)}% · {it.expected_roi_pct !== null ? formatPct(it.expected_roi_pct, { withSign: true }) : "—"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
