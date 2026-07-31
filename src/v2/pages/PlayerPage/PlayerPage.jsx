import { useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Shield } from "lucide-react";
import { addWatch } from "../../../api/watchlist";
import { usePlayerSummary } from "../../hooks/usePlayerSummary";
import { AnalysisModal } from "../HomeDashboard/HomeDashboard";

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
    <AnalysisModal item={item} onClose={goBack} navigate={navigate} onWatch={watch} watchState={watchState} backLabel={backLabel}/>
  </div>;
}

function toAnalysisItem(data, snapshot, cardId) {
  const meta = data?.meta || snapshot;
  if (!meta) return null;
  const rec = data?.recommendation && !data.recommendation.error ? data.recommendation : {};
  const entry = firstNumber(rec.entry_price, rec.entryPrice, rec.current_bin, rec.currentBin, data?.market_metrics?.current_bin, data?.fair_value?.current_bin, meta.price_num, meta.price);
  const fair = firstNumber(rec.fair_value, rec.fairValue, data?.fair_value?.fair_value_24h, data?.fair_value?.fair_value);
  const roi = toPct(firstNumber(rec.expected_roi_pct, rec.likely_net_roi, rec.expectedRoi, rec.netRoi?.likely));
  return {
    cardId,
    recommendation: String(rec.recommendation || rec.status || "WATCH").toUpperCase(),
    entryPrice: entry,
    currentBin: entry,
    fairValue: fair,
    expectedRoi: roi,
    netRoi: { likely: roi },
    confidence: Math.round(firstNumber(rec.confidence, rec.score_confidence, 0)),
    popularity: data?.card_scores?.scores?.popularity != null ? Math.round(data.card_scores.scores.popularity) : null,
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
function firstNumber(...values) { for (const value of values) { const number = Number(value); if (Number.isFinite(number) && number !== 0) return number; } return 0; }
function toPct(value) { const number = Number(value); return !Number.isFinite(number) ? 0 : Math.abs(number) <= 1 ? number * 100 : number; }
function riskLabel(value) { const number = Number(value); return !Number.isFinite(number) ? "Unknown" : number >= 70 ? "High" : number >= 40 ? "Medium" : "Low"; }
function holdingPeriod(rec) { if (rec?.holding_period_days) return `${rec.holding_period_days} days`; const list = rec?.qualified_strategies || []; if (list.includes("quick_flip")) return "Up to 24h"; if (list.includes("swing_trade")) return "2–3 days"; if (list.includes("long_hold")) return "Up to a week"; return rec?.holdingPeriod || "Flexible"; }
