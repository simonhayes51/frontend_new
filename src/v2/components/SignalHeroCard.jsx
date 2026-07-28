// src/v2/components/SignalHeroCard.jsx
//
// Large, bordered "signal" card - the defining visual unit of the
// reference design's opportunity feed: big card art, a colored border
// matching the recommendation, a rank badge, a confidence gauge toned to
// match, and the key stat (expected ROI for a buy, risk for an avoid).
// Replaces the old tiny text-row treatment those feeds used before.
import { Link } from "react-router-dom";
import CardArtThumb from "./CardArtThumb";
import RecommendationBadge, { TONE_FOR_RECOMMENDATION, BORDER_FOR_RECOMMENDATION } from "./RecommendationBadge";
import ConfidenceGauge from "./ConfidenceGauge";
import { formatPct } from "../lib/format";

export default function SignalHeroCard({ item, rank }) {
  const tone = TONE_FOR_RECOMMENDATION[item.recommendation] || "accent";
  const border = BORDER_FOR_RECOMMENDATION[item.recommendation] || "border-[var(--v2-border)]";

  return (
    <Link
      to={`/v2/players/${item.card_id}`}
      className={`flex flex-col gap-3 rounded-[var(--v2-radius)] border bg-[var(--v2-card)] p-4 hover:brightness-110 transition ${border}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {rank && <span className="text-[10px] font-bold text-[var(--v2-muted)]">#{rank}</span>}
          <RecommendationBadge recommendation={item.recommendation} />
        </div>
        <ConfidenceGauge value={item.confidence} size={40} tone={tone} />
      </div>

      <div className="flex items-center gap-3">
        <CardArtThumb card={item} widthClass="w-14" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--v2-text)] truncate">{item.name || item.card_id}</p>
          <p className="text-xs text-[var(--v2-muted)]">{item.rating} {item.version}</p>
        </div>
      </div>

      <div className="text-xs text-[var(--v2-muted)]">
        {item.recommendation === "avoid" ? (
          <span>Risk: <span className="text-[var(--v2-negative)] font-medium">{item.risk_rating || "high"}</span></span>
        ) : (
          <span>
            Expected ROI:{" "}
            <span className="font-medium" style={{ color: `var(--v2-${tone})` }}>
              {item.expected_roi_pct !== null && item.expected_roi_pct !== undefined
                ? formatPct(item.expected_roi_pct, { withSign: true })
                : "—"}
            </span>
          </span>
        )}
      </div>
    </Link>
  );
}
