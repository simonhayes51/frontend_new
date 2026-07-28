// src/v2/pages/HomeDashboard/sections/MoversSection.jsx
//
// dashboard.py's movers query returns exactly 3 distinct slots (largest
// 24h mover, most-traded today, highest liquidity) - each its own card,
// not a ranked N-card list - so this renders each as its own small tile
// rather than fabricating more rows than the data actually has.
import { Link } from "react-router-dom";
import SectionCard from "../../../components/SectionCard";
import CardArtThumb from "../../../components/CardArtThumb";

function MoverTile({ card, metricLabel, metricValue }) {
  if (!card) {
    return (
      <div className="rounded-lg border border-[var(--v2-border)] p-3 text-xs text-[var(--v2-muted)]">
        No data yet.
      </div>
    );
  }
  return (
    <Link
      to={`/v2/players/${card.card_id}`}
      className="flex flex-col items-center gap-2 rounded-lg border border-[var(--v2-border)] p-3 text-center hover:border-[var(--v2-accent)] transition-colors"
    >
      <CardArtThumb card={card} widthClass="w-12" />
      <span className="text-xs font-medium truncate w-full">{card.name}</span>
      <span className="text-[10px] text-[var(--v2-muted)]">{metricLabel}: {metricValue}</span>
    </Link>
  );
}

export default function MoversSection({ stats }) {
  const db = stats?.database_statistics || {};
  return (
    <SectionCard title="Biggest Movers">
      <div className="grid grid-cols-3 gap-3">
        <MoverTile
          card={db.largest_24h_mover}
          metricLabel="volatility"
          metricValue={db.largest_24h_mover?.volatility_24h}
        />
        <MoverTile
          card={db.most_traded_player_today}
          metricLabel="sales (24h)"
          metricValue={db.most_traded_player_today?.sales_24h}
        />
        <MoverTile
          card={db.highest_liquidity_card}
          metricLabel="sales/hr"
          metricValue={db.highest_liquidity_card?.sales_per_hour_24h}
        />
      </div>
    </SectionCard>
  );
}
