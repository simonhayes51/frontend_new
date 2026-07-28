// src/v2/pages/HomeDashboard/sections/AvoidSection.jsx
import { Link } from "react-router-dom";
import SectionCard from "../../../components/SectionCard";
import { useCardsToAvoid } from "../../../hooks/useRecommendationFeeds";

export default function AvoidSection() {
  const { data, isLoading, error } = useCardsToAvoid({ limit: 8 });
  const items = data?.items || [];

  return (
    <SectionCard title="Cards to Avoid" subtitle="AI-flagged risk signals">
      {isLoading ? (
        <p className="text-xs text-[var(--v2-muted)]">Loading...</p>
      ) : error ? (
        <p className="text-xs text-[var(--v2-negative)]">Couldn't load right now.</p>
      ) : items.length === 0 ? (
        <p className="text-xs text-[var(--v2-muted)]">Nothing flagged right now.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-[var(--v2-border)]">
          {items.map((it) => (
            <li key={it.card_id} className="flex items-center justify-between py-1.5 text-xs">
              <Link to={`/v2/players/${it.card_id}`} className="hover:text-[var(--v2-accent)]">
                {it.name || it.card_id} <span className="text-[var(--v2-muted)]">({it.rating})</span>
              </Link>
              <span className="text-[var(--v2-negative)]">{it.risk_rating || "risk"}</span>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
