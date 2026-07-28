// src/v2/components/LiveAlertsSection.jsx
//
// The reference design's "Live Alerts" right-rail feed: colored,
// left-accented cards mixing buy/avoid signals with recent market
// activity, instead of a plain text list. Built from data already real
// and already fetched elsewhere on the Home Dashboard (recommendation
// feeds + dashboard activity) - no new backend endpoint, just a merged
// presentation of what's already there.
import { Link } from "react-router-dom";
import SectionCard from "./SectionCard";
import PremiumGate from "./PremiumGate";
import { useOpportunities, useCardsToAvoid } from "../hooks/useRecommendationFeeds";
import { formatPct, formatRelativeTime } from "../lib/format";

const STYLE = {
  buy: { border: "border-l-[var(--v2-positive)]", label: "BUY SIGNAL", labelColor: "text-[var(--v2-positive)]" },
  avoid: { border: "border-l-[var(--v2-negative)]", label: "AVOID SIGNAL", labelColor: "text-[var(--v2-negative)]" },
  update: { border: "border-l-[var(--v2-accent)]", label: "UPDATE", labelColor: "text-[var(--v2-accent)]" },
};

function AlertRow({ kind, title, detail, at, to }) {
  const s = STYLE[kind];
  const content = (
    <div className={`border-l-2 ${s.border} bg-[var(--v2-elevated)] rounded-r-lg px-3 py-2.5 flex flex-col gap-0.5`}>
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-bold tracking-wide ${s.labelColor}`}>{s.label}</span>
        {at && <span className="text-[10px] text-[var(--v2-muted)]">{formatRelativeTime(at)}</span>}
      </div>
      <span className="text-xs font-medium text-[var(--v2-text)]">{title}</span>
      {detail && <span className="text-[10px] text-[var(--v2-muted)]">{detail}</span>}
    </div>
  );
  return to ? <Link to={to}>{content}</Link> : content;
}

export default function LiveAlertsSection({ activity }) {
  const { data: opps, error: oppsError } = useOpportunities({ limit: 3 });
  const { data: avoid, error: avoidError } = useCardsToAvoid({ limit: 2 });
  const status = oppsError?.response?.status || avoidError?.response?.status;

  if (status === 401 || status === 402) {
    return (
      <SectionCard title="Live Alerts">
        <PremiumGate locked featureName="Opportunity Feed" />
      </SectionCard>
    );
  }

  const rows = [
    ...(opps?.items || []).map((it) => ({
      kind: "buy",
      title: `${it.name || it.card_id} (${it.rating})`,
      detail: `Confidence: ${Math.round(it.confidence)}%${
        it.expected_roi_pct !== null && it.expected_roi_pct !== undefined ? ` · Profit: ${formatPct(it.expected_roi_pct, { withSign: true })}` : ""
      }`,
      at: it.computed_at,
      to: `/v2/players/${it.card_id}`,
    })),
    ...(avoid?.items || []).map((it) => ({
      kind: "avoid",
      title: `${it.name || it.card_id} (${it.rating})`,
      detail: `Risk: ${it.risk_rating || "high"} · Confidence: ${Math.round(it.confidence)}%`,
      at: it.computed_at,
      to: `/v2/players/${it.card_id}`,
    })),
    ...(activity?.events || []).slice(0, 3).map((e) => ({
      kind: "update",
      title: e.message,
      at: e.at,
      to: e.card_id != null ? `/v2/players/${e.card_id}` : undefined,
    })),
  ]
    .filter((r) => r.at)
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 8);

  return (
    <SectionCard title="Live Alerts">
      {rows.length === 0 ? (
        <p className="text-xs text-[var(--v2-muted)]">No alerts right now.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map((r, i) => (
            <AlertRow key={i} {...r} />
          ))}
        </div>
      )}
    </SectionCard>
  );
}
