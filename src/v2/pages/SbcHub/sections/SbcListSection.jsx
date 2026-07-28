// src/v2/pages/SbcHub/sections/SbcListSection.jsx
import { Link } from "react-router-dom";
import SectionCard from "../../../components/SectionCard";
import { formatCoins, formatCountdown } from "../../../lib/format";

export default function SbcListSection({ events }) {
  if (!events || events.length === 0) {
    return (
      <SectionCard title="Live SBCs">
        <p className="text-xs text-[var(--v2-muted)]">No SBC sets tracked yet.</p>
      </SectionCard>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {events.map((ev) => (
        <Link
          key={ev.id}
          to={`/v2/sbc/${ev.id}`}
          className="rounded-[var(--v2-radius)] border border-[var(--v2-border)] bg-[var(--v2-card)] p-4 flex flex-col gap-2 hover:border-[var(--v2-accent)] transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-[var(--v2-text)]">{ev.title}</span>
            {ev.category && (
              <span className="text-[10px] uppercase tracking-wide text-[var(--v2-accent)]">
                {ev.category}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between text-xs text-[var(--v2-muted)]">
            <span>{ev.total_cost_coins ? formatCoins(ev.total_cost_coins) : "—"}</span>
            <span>{ev.ends_at ? `ends in ${formatCountdown(ev.ends_at)}` : "—"}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
