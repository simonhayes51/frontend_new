// src/v2/pages/SbcEventDetail/sections/ImpactSection.jsx
//
// Ungated for now (Phase 2) - the backend route has no require_feature
// yet. Phase 4 adds that gate and this section's data will start
// carrying a `locked` signal to wrap in PremiumGate, matching the
// pattern FairValueSection already uses.
import { Link } from "react-router-dom";
import SectionCard from "../../../components/SectionCard";
import { formatCoins, formatPct } from "../../../lib/format";

const RELATION_LABEL = {
  fodder_demand: "Fodder demand",
  reward_supply: "Reward supply",
  meta_shift: "Meta shift",
  requirement_target: "Requirement target",
};

export default function ImpactSection({ impact }) {
  const items = impact?.items || [];

  if (items.length === 0) {
    return (
      <SectionCard title="Market Impact">
        <p className="text-xs text-[var(--v2-muted)]">
          No measured impact yet - this is computed after the event has been live for a while.
        </p>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Market Impact">
      <ul className="flex flex-col divide-y divide-[var(--v2-border)]">
        {items.map((it, i) => (
          <li key={i} className="flex items-center justify-between py-2 text-xs">
            <div>
              <Link to={`/v2/players/${it.card_id}`} className="font-medium hover:text-[var(--v2-accent)]">
                {it.name || it.card_id}
              </Link>
              <p className="text-[var(--v2-muted)]">{RELATION_LABEL[it.relation] || it.relation}</p>
            </div>
            <div className="text-right">
              <p>
                {formatCoins(it.price_before)} → {formatCoins(it.price_after)}
              </p>
              {it.price_change_pct !== null && it.price_change_pct !== undefined && (
                <p className={it.price_change_pct >= 0 ? "text-[var(--v2-positive)]" : "text-[var(--v2-negative)]"}>
                  {formatPct(it.price_change_pct, { withSign: true })}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
