// src/v2/pages/PlayerPage/sections/HeaderSection.jsx
//
// The Player Page hero: full-size card art (v1's shared PlayerCardArt,
// non-compact) + the AI verdict (badge/gauge/ROI/holding period) at a
// glance, before scrolling to the fuller breakdown in
// RecommendationSection below. recommendation is whatever
// player_summary() returned for this card - may be a locked/error shape
// ({error, status}) rather than a real recommendation object, so the
// badge/gauge/ROI row only renders when it looks like real data.
import PlayerCardArt from "../../../../components/PlayerCardArt";
import RecommendationBadge, { TONE_FOR_RECOMMENDATION } from "../../../components/RecommendationBadge";
import ConfidenceGauge from "../../../components/ConfidenceGauge";
import StatTile from "../../../components/StatTile";
import { formatPct, holdingPeriodFromStrategies } from "../../../lib/format";

export default function HeaderSection({ meta, recommendation }) {
  if (!meta) return null;

  const rec = recommendation && !recommendation.error ? recommendation : null;
  const tone = rec ? TONE_FOR_RECOMMENDATION[rec.recommendation] : null;
  // holding_period_days is a rule_v1-only column V1.2 never populates
  // (see recommendation_engine_v2.py) - derive the real per-strategy
  // window instead of always showing "—" for every V1.2-scored card.
  const holdingPeriod = rec?.holding_period_days
    ? `${rec.holding_period_days}d`
    : holdingPeriodFromStrategies(rec?.qualified_strategies) ?? "—";

  return (
    <div className="rounded-[var(--v2-radius)] border border-[var(--v2-border)] bg-[var(--v2-card)] p-6">
      <div className="flex flex-col sm:flex-row items-start gap-6">
        <PlayerCardArt
          bgImage={meta.card_bg_image}
          cutoutImage={meta.card_cutout_image}
          cutoutType={meta.card_cutout_type || "special"}
          fallbackImage={meta.image_url}
          rating={meta.rating}
          position={meta.position}
          name={meta.card_name || meta.name}
          altText={meta.name}
          stats={{
            pace: meta.pace, shooting: meta.shooting, passing: meta.passing,
            dribbling: meta.dribbling, defending: meta.defending, physicality: meta.physicality,
          }}
          nationImage={meta.nation_image}
          leagueImage={meta.league_image}
          clubImage={meta.club_image}
          widthClass="w-52"
        />

        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-semibold text-[var(--v2-text)]">{meta.name}</h1>
          <p className="text-sm text-[var(--v2-muted)] mb-5">
            {meta.rating} OVR · {meta.version} · {meta.position}
            {meta.club ? ` · ${meta.club}` : ""}
          </p>

          {rec && (
            <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-[var(--v2-muted)]">Recommendation</span>
                <RecommendationBadge recommendation={rec.recommendation} size="lg" />
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs text-[var(--v2-muted)]">Confidence</span>
                <ConfidenceGauge value={rec.confidence} size={64} tone={tone} />
              </div>
              <StatTile
                label="Expected ROI"
                value={rec.expected_roi_pct !== null && rec.expected_roi_pct !== undefined ? formatPct(rec.expected_roi_pct, { withSign: true }) : "—"}
                valueTone={tone === "positive" ? "positive" : tone === "negative" ? "negative" : "neutral"}
              />
              <StatTile label="Time window" value={holdingPeriod} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
