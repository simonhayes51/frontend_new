// src/v2/pages/HomeDashboard/sections/PulseSection.jsx
import SectionCard from "../../../components/SectionCard";
import StatTile from "../../../components/StatTile";

export default function PulseSection({ stats }) {
  if (!stats) return null;
  const { totals, last_24h, cards_tracked_today } = stats;

  return (
    <SectionCard title="Market Pulse">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatTile label="Tracked players" value={totals?.total_players?.toLocaleString?.() ?? "—"} />
        <StatTile label="Sales (24h)" value={last_24h?.sales?.toLocaleString?.() ?? "—"} />
        <StatTile label="BIN updates (24h)" value={last_24h?.bin_updates?.toLocaleString?.() ?? "—"} />
        <StatTile label="Cards tracked today" value={cards_tracked_today?.toLocaleString?.() ?? "—"} />
      </div>
    </SectionCard>
  );
}
