import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, BarChart3, Clock3, ShieldAlert, Sparkles, Target, TrendingUp } from "lucide-react";
import { usePlayerSummary } from "../../hooks/usePlayerSummary";
import PlayerCardArt from "../../../components/PlayerCardArt";
import MarketMetricsSection from "./sections/MarketMetricsSection";
import FairValueSection from "./sections/FairValueSection";
import LazyBuyerSection from "./sections/LazyBuyerSection";
import DealConfidenceSection from "./sections/DealConfidenceSection";
import ScoresSection from "./sections/ScoresSection";
import RecommendationSection from "./sections/RecommendationSection";
import SalesChartSection from "./sections/SalesChartSection";
import DeferredSections from "./sections/DeferredSections";
import "../../styles/player-analysis.css";

export default function PlayerPage() {
  const { cardId } = useParams();
  const { data, isLoading, error, refetch } = usePlayerSummary(cardId);
  const [tab, setTab] = useState("overview");

  const meta = data?.meta;
  const rec = data?.recommendation && !data.recommendation.error ? data.recommendation : null;
  const price = firstNumber(rec?.entry_price, rec?.current_bin, data?.market_metrics?.current_bin, data?.fair_value?.current_bin);
  const fair = firstNumber(rec?.fair_value, data?.fair_value?.fair_value_24h, data?.fair_value?.fair_value);
  const expectedRoi = firstNumber(rec?.expected_roi_pct, rec?.likely_net_roi);
  const profit = price && Number.isFinite(expectedRoi) ? Math.round(price * expectedRoi / 100) : null;
  const recommendation = String(rec?.recommendation || "WATCH").toUpperCase();
  const confidence = Math.round(firstNumber(rec?.confidence, rec?.score_confidence, 0));
  const risk = rec?.risk || riskLabel(rec?.score_risk);
  const title = meta?.card_name || meta?.name || "Player analysis";
  const reason = rec?.reasoning || rec?.summary || "Live sales, price and value data are being checked for this card.";

  const tabs = useMemo(() => [
    ["overview", "Overview"],
    ["price", "Price history"],
    ["data", "Full data"],
  ], []);

  if (error) {
    return <div className="analysis-page"><div className="analysis-error"><ShieldAlert size={24}/><h1>Could not load this card</h1><p>{error?.response?.status === 404 ? "This player could not be found." : "The analysis request failed."}</p><button onClick={() => refetch()}>Try again</button></div></div>;
  }

  return <div className="analysis-page">
    <div className="analysis-topline">
      <Link to="/v2"><ArrowLeft size={16}/> Back to dashboard</Link>
      <span>Player analysis</span>
    </div>

    {isLoading ? <PlayerSkeleton/> : <>
      <section className="analysis-hero">
        <div className="analysis-card-stage">
          <PlayerArtwork meta={meta}/>
        </div>
        <div className="analysis-main">
          <div className="analysis-title-row">
            <div>
              <span>{meta?.rating} {meta?.position} · {meta?.version || "Card"}</span>
              <h1>{title}</h1>
            </div>
            <b className={`analysis-call ${recommendation.toLowerCase()}`}>{recommendation}</b>
          </div>
          <p className="analysis-verdict">{reason}</p>
          <div className="analysis-kpis">
            <Kpi label="Entry" value={coins(price)} suffix="coins"/>
            <Kpi label="Expected profit" value={profit === null ? "—" : signedCoins(profit)} suffix="after tax" tone={profit >= 0 ? "positive" : "negative"}/>
            <Kpi label="Confidence" value={`${confidence}%`} suffix={`${risk} risk`}/>
            <Kpi label="Fair value" value={coins(fair)} suffix="recent value"/>
          </div>
          <div className="analysis-actions">
            <button onClick={() => setTab("price")}><BarChart3 size={17}/> View price chart</button>
            <Link to={`/trades?card_id=${cardId}`}><Target size={17}/> Log trade</Link>
          </div>
        </div>
      </section>

      <nav className="analysis-tabs" aria-label="Player analysis sections">
        {tabs.map(([key,label]) => <button key={key} onClick={() => setTab(key)} className={tab === key ? "active" : ""}>{label}</button>)}
      </nav>

      {tab === "overview" && <section className="analysis-overview">
        <div className="analysis-summary-grid">
          <Insight icon={<TrendingUp size={17}/>} label="Price position" value={fair && price ? `${percent((fair-price)/price*100)} below fair value` : "Waiting for enough price data"}/>
          <Insight icon={<Clock3 size={17}/>} label="Trade window" value={holdingPeriod(rec)}/>
          <Insight icon={<Sparkles size={17}/>} label="Best fit" value={strategyLabel(rec?.qualified_strategies)}/>
        </div>
        <div className="analysis-detail-grid">
          <MarketMetricsSection marketMetrics={data?.market_metrics}/>
          <FairValueSection fairValue={data?.fair_value}/>
          <DealConfidenceSection dealConfidence={data?.deal_confidence}/>
          <LazyBuyerSection lazyBuyerScore={data?.lazy_buyer_score}/>
        </div>
        <RecommendationSection recommendation={data?.recommendation}/>
      </section>}

      {tab === "price" && <section className="analysis-chart-wrap"><SalesChartSection cardId={cardId}/></section>}

      {tab === "data" && <section className="analysis-data-wrap"><ScoresSection cardScores={data?.card_scores}/><DeferredSections/></section>}
    </>}
  </div>;
}

function PlayerArtwork({ meta = {} }) {
  if (meta.generated_card_url) return <img className="analysis-generated-card" src={meta.generated_card_url} alt={meta.card_name || meta.name}/>;
  return <PlayerCardArt bgImage={meta.card_bg_image} cutoutImage={meta.card_cutout_image} cutoutType={meta.card_cutout_type || "special"} fallbackImage={meta.image_url} rating={meta.rating} position={meta.position} name={meta.card_name || meta.name} altText={meta.name} stats={{pace:meta.pace,shooting:meta.shooting,passing:meta.passing,dribbling:meta.dribbling,defending:meta.defending,physicality:meta.physicality}} nationImage={meta.nation_image} leagueImage={meta.league_image} clubImage={meta.club_image} showStats widthClass="w-64"/>;
}
function Kpi({label,value,suffix,tone=""}) { return <div className={`analysis-kpi ${tone}`}><span>{label}</span><strong>{value}</strong><small>{suffix}</small></div>; }
function Insight({icon,label,value}) { return <div className="analysis-insight"><i>{icon}</i><div><span>{label}</span><strong>{value}</strong></div></div>; }
function PlayerSkeleton(){return <div className="analysis-skeleton"><div/><section><span/><span/><span/><span/></section></div>}
function firstNumber(...values){for(const value of values){const n=Number(value);if(Number.isFinite(n))return n;}return 0;}
function coins(v){const n=Number(v);return n>0?new Intl.NumberFormat("en-GB").format(Math.round(n)):"—";}
function signedCoins(v){const n=Number(v);return Number.isFinite(n)?`${n>0?"+":""}${new Intl.NumberFormat("en-GB").format(Math.round(n))}`:"—";}
function percent(v){const n=Number(v);return Number.isFinite(n)?`${Math.abs(n).toFixed(1)}%`:"—";}
function riskLabel(v){const n=Number(v);return !Number.isFinite(n)?"Unknown":n>=70?"High":n>=40?"Medium":"Low";}
function holdingPeriod(rec){if(rec?.holding_period_days)return `${rec.holding_period_days} days`;const list=rec?.qualified_strategies||[];if(list.includes("quick_flip"))return "Up to 24 hours";if(list.includes("swing_trade"))return "2–3 days";if(list.includes("long_hold"))return "Up to a week";return "Flexible";}
function strategyLabel(list=[]){if(!list.length)return "General market play";return String(list[0]).replaceAll("_"," ").replace(/\b\w/g,c=>c.toUpperCase());}
