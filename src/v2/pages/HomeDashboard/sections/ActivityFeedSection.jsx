// src/v2/pages/HomeDashboard/sections/ActivityFeedSection.jsx
import SectionCard from "../../../components/SectionCard";
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
            <li key={i} className="flex items-center justify-between py-1.5 text-xs">
              <span className="text-[var(--v2-text)]">{e.message}</span>
              <span className="text-[var(--v2-muted)] whitespace-nowrap ml-3">
                {formatRelativeTime(e.at)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
