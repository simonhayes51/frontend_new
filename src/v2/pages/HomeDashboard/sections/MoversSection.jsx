// src/v2/pages/HomeDashboard/sections/MoversSection.jsx
import { Link } from "react-router-dom";
import SectionCard from "../../../components/SectionCard";

function MoverRow({ card, metricLabel, metricValue }) {
  if (!card) return <p className="text-xs text-[var(--v2-muted)]">No data yet.</p>;
  return (
    <Link
      to={`/v2/players/${card.card_id}`}
      className="flex items-center justify-between text-xs py-1.5 hover:text-[var(--v2-accent)]"
    >
      <span>
        {card.name} <span className="text-[var(--v2-muted)]">({card.rating} {card.version})</span>
      </span>
      <span className="text-[var(--v2-muted)]">
        {metricLabel}: {metricValue}
      </span>
    </Link>
  );
}

export default function MoversSection({ stats }) {
  const db = stats?.database_statistics || {};
  return (
    <SectionCard title="Biggest Movers">
      <div className="flex flex-col divide-y divide-[var(--v2-border)]">
        <MoverRow
          card={db.largest_24h_mover}
          metricLabel="volatility"
          metricValue={db.largest_24h_mover?.volatility_24h}
        />
        <MoverRow
          card={db.most_traded_player_today}
          metricLabel="sales (24h)"
          metricValue={db.most_traded_player_today?.sales_24h}
        />
        <MoverRow
          card={db.highest_liquidity_card}
          metricLabel="sales/hr"
          metricValue={db.highest_liquidity_card?.sales_per_hour_24h}
        />
      </div>
    </SectionCard>
  );
}
