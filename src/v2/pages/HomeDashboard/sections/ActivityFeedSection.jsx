// src/v2/pages/HomeDashboard/sections/ActivityFeedSection.jsx
import SectionCard from "../../../components/SectionCard";
import CardArtThumb from "../../../components/CardArtThumb";
import { formatRelativeTime } from "../../../lib/format";

export default function ActivityFeedSection({ activity }) {
  const events = activity?.events || [];
  return (
    <SectionCard title="Recent Activity">
      {events.length === 0 ? (
        <p className="text-xs text-[var(--v2-muted)]">No recent activity.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-[var(--v2-border)]">
          {events.map((e, i) => (
            <li key={i} className="flex items-center gap-3 py-2 text-xs">
              {/* sync events reference no single card - card_id is
                  correctly null for those, so no thumb is rendered. */}
              {e.card_id != null && <CardArtThumb card={e} widthClass="w-8" />}
              <span className="flex-1 min-w-0 text-[var(--v2-text)]">{e.message}</span>
              <span className="text-[var(--v2-muted)] whitespace-nowrap">
                {formatRelativeTime(e.at)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
