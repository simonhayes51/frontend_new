import { useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Shield } from "lucide-react";
import { addWatch } from "../../../api/watchlist";
import { usePlayerSummary } from "../../hooks/usePlayerSummary";
import { AnalysisModal } from "../HomeDashboard/HomeDashboard";
import FutggMarketSection from "./sections/FutggMarketSection";

export default function PlayerPage() {
  const { cardId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = usePlayerSummary(cardId);
  const [watchState, setWatchState] = useState("");
  const item = useMemo(() => toAnalysisItem(data, location.state?.player, cardId), [data, location.state, cardId]);
  const origin = location.state?.from;
  const returnPath = origin === "trade-finder" ? "/v2/trade-finder" : "/v2/players";
  const backLabel = origin === "trade-finder" ? "Back to Trade Finder" : "Back to player search";

  function goBack() {
    navigate(returnPath);
  }

  async function watch(current) {
    if (watchState === "saving" || watchState === "saved") return;
    setWatchState("saving");
    try {
      await addWatch({
        player_name: current.player.cardName || current.player.name,
        card_id: String(current.cardId),
        version: current.player.version || null,
        platform: "ps",
        source: "futgg",
      });
      setWatchState("saved");
    } catch (requestError) {
      if (requestError?.response?.status === 409) setWatchState("saved");
      else if (requestError?.response?.status === 401) navigate("/login");
      else setWatchState("error");
    }
  }

  if (error && !item) {
    return <div className="quick-analysis-page"><div className="quick-error"><Shield size={26}/><h1>Could not load this card</h1><p>{error?.response?.status === 404 ? "This player could not be found." : "The analysis request failed."}</p><div><button onClick={goBack}>{backLabel}</button><button onClick={() => refetch()}>Try again</button></div></div></div>;
  }
  if (!item && isLoading) return <div className="quick-analysis-page"><div className="quick-error"><p>Loading the latest analysis…</p><button onClick={goBack}>{backLabel}</button></div></div>;
  if (!item) return null;

  return <div className="quick-analysis-page">
    {/* FUT.GG migration: `extra` renders FutggMarketSection (new FUT.GG-
        backed GET /api/v2/players/{cardId} + /prices + /sales contract)
        inside the existing modal - additive, doesn't touch the modal's
        own FUTBIN-derived /summary data above it. */}
    <AnalysisModal item={item} onClose={goBack} navigate={navigate} onWatch={watch} watchState={watchState} backLabel={backLabel} extra={<FutggMarketSection cardId={cardId} />}/>
  </div>;
}

function toAnalysisItem(data, snapshot, cardId) {
  const meta = data?.meta || snapshot;
  if (!meta) return null;
  const rec = data?.recommendation && !data.recommendation.error ? data.recommendation : {};
  const entry = firstNumber(rec.entry_price, rec.entryPrice, rec.current_bin, rec.currentBin, data?.market_metrics?.current_bin, data?.fair_value?.current_bin, meta.price_num, meta.price);
  const fair = firstNumber(rec.fair_value, rec.fairValue, data?.fair_value?.fair_value_24h, data?.fair_value?.fair_value);
  const roi = toPct(firstNumber(rec.expected_roi_pct, rec.likely_net_roi, rec.expectedRoi, rec.netRoi?.likely));
  const confidenceRaw = firstNumber(rec.confidence, rec.score_confidence);
  const confidence = confidenceRaw == null ? null : Math.round(confidenceRaw);
  return {
    cardId,
    recommendation: String(rec.recommendation || rec.status || "WATCH").toUpperCase(),
    entryPrice: entry,
    currentBin: entry,
    fairValue: fair,
    expectedRoi: roi,
    netRoi: { likely: roi },
    confidence,
    popularity: data?.card_scores?.scores?.popularity != null ? Math.round(data.card_scores.scores.popularity) : null,
    psPcBinGapPct: data?.market_metrics?.psPcBinGapPct ?? null,
    risk: rec.risk || riskLabel(rec.score_risk),
    holdingPeriod: holdingPeriod(rec),
    reasoning: rec.reasoning || rec.summary || "The current price is being compared with recent completed sales.",
    player: {
      name: meta.name,
      displayName: meta.nickname || meta.card_name || meta.cardName || meta.name,
      cardName: meta.card_name || meta.cardName,
      rating: meta.rating,
      position: meta.position,
      version: meta.version,
      imageUrl: meta.image_url || meta.imageUrl,
      generatedCardUrl: meta.generated_card_url || meta.generatedCardUrl,
      cardBgImage: meta.card_bg_image || meta.cardBgImage,
      cardCutoutImage: meta.card_cutout_image || meta.cardCutoutImage,
      cardCutoutType: meta.card_cutout_type || meta.cardCutoutType,
      nationImage: meta.nation_image || meta.nationImage,
      leagueImage: meta.league_image || meta.leagueImage,
      clubImage: meta.club_image || meta.clubImage,
      stats: meta.stats || {
        pace: meta.pace, shooting: meta.shooting, passing: meta.passing,
        dribbling: meta.dribbling, defending: meta.defending, physicality: meta.physicality,
      },
    },
  };
}
// null (not 0) when nothing in the list is a real number - a fabricated
// 0 here reads as a confident real value (e.g. "0% confidence") rather
// than "no recommendation data for this card." Deliberately still skips
// a literal 0 candidate in favor of a later source (unchanged from
// before) - only the final "found nothing at all" fallback changes.
function firstNumber(...values) { for (const value of values) { const number = Number(value); if (Number.isFinite(number) && number !== 0) return number; } return null; }
// null (not 0) when there's no real ROI value - feeds profit() in the
// shared AnalysisModal, so a fabricated 0 here silently became a
// fabricated "Expected profit: 0" there.
function toPct(value) { if (value == null) return null; const number = Number(value); return !Number.isFinite(number) ? null : Math.abs(number) <= 1 ? number * 100 : number; }
function riskLabel(value) { const number = Number(value); return !Number.isFinite(number) ? "Unknown" : number >= 70 ? "High" : number >= 40 ? "Medium" : "Low"; }
function holdingPeriod(rec) { if (rec?.holding_period_days) return `${rec.holding_period_days} days`; const list = rec?.qualified_strategies || []; if (list.includes("quick_flip")) return "Up to 24h"; if (list.includes("swing_trade")) return "2–3 days"; if (list.includes("long_hold")) return "Up to a week"; return rec?.holdingPeriod || "Flexible"; }
