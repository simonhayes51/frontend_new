import { useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BarChart3, Check, ChevronDown, CircleDollarSign, Shield, Target, TrendingUp } from "lucide-react";
import { usePlayerSummary } from "../../hooks/usePlayerSummary";
import PlayerCardImage from "../../../components/PlayerCardImage";
import SalesChartSection from "./sections/SalesChartSection";
import ScoresSection from "./sections/ScoresSection";
import DeferredSections from "./sections/DeferredSections";
import "../../styles/player-analysis.css";

export default function PlayerPage() {
  const { cardId } = useParams();
  const location = useLocation();
  const queryClient = useQueryClient();
  const cachedDashboard = queryClient.getQueryData(["v2", "dashboard"]);
  const cachedSnapshot = useMemo(() => findCachedCard(cachedDashboard, cardId), [cachedDashboard, cardId]);
  const snapshot = location.state?.playerAnalysis || cachedSnapshot || null;
  const { data, isLoading, error, refetch } = usePlayerSummary(cardId);
  const [showChart, setShowChart] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const view = useMemo(() => buildView(data, snapshot), [data, snapshot]);

  if (error && !snapshot) {
    return <div className="quick-analysis-page"><div className="quick-error"><Shield size={26}/><h1>Could not load this card</h1><p>{error?.response?.status === 404 ? "This player could not be found." : "The analysis request failed."}</p><button onClick={() => refetch()}>Try again</button></div></div>;
  }

  if (!view && isLoading) return <QuickSkeleton/>;
  if (!view) return null;

  const tone = recommendationTone(view.recommendation);
  const targetSale = view.entry && view.profit ? Math.ceil((view.entry + view.profit) / 0.95 / 250) * 250 : null;
  const discount = view.fair && view.entry ? ((view.fair - view.entry) / view.entry) * 100 : null;
  const confidenceWidth = Math.min(100, Math.max(0, view.confidence));

  return <div className={`quick-analysis-page tone-${tone}`}>
    <div className="quick-topline">
      <Link to="/v2"><ArrowLeft size={16}/> Dashboard</Link>
      <span>{data ? "Live analysis" : "Loading live data…"}</span>
    </div>

    <main className="quick-decision">
      <section className="quick-card-zone">
        <PlayerArtwork meta={view.meta}/>
        <div className="quick-card-meta">{view.meta.rating} {view.meta.position} · {view.meta.version || "Card"}</div>
      </section>

      <section className="quick-answer">
        <div className="quick-answer-head">
          <div><span className="quick-eyebrow">THE ANSWER</span><h1>{view.title}</h1></div>
          <strong className={`quick-call ${tone}`}>{friendlyCall(view.recommendation)}</strong>
        </div>

        <div className="quick-verdict">
          <span>{headline(view.recommendation)}</span>
          <strong>{view.entry ? `${coins(view.entry)} coins` : "Wait for a price"}</strong>
          <p>{plainReason(view, discount)}</p>
        </div>

        <div className="quick-numbers">
          <NumberCard icon={<CircleDollarSign/>} label="Buy at or below" value={coins(view.entry)} detail="Your entry"/>
          <NumberCard icon={<TrendingUp/>} label="Potential profit" value={signedCoins(view.profit)} detail="After EA tax" positive={view.profit > 0}/>
          <NumberCard icon={<Target/>} label="Aim to sell" value={coins(targetSale)} detail="Estimated target"/>
        </div>

        <div className="quick-confidence">
          <div><span>Confidence</span><strong>{view.confidence}%</strong></div>
          <i><b style={{width:`${confidenceWidth}%`}}/></i>
          <small>{riskCopy(view.risk)} · {holdingPeriod(view.rec)}</small>
        </div>

        <div className="quick-why">
          <h2>Why this move?</h2>
          {buildReasons(view, discount).map((reason) => <div key={reason}><i><Check size={14}/></i><span>{reason}</span></div>)}
        </div>

        <div className="quick-actions">
          <Link className="primary" to={`/trades?card_id=${cardId}`}><Target size={17}/> Log this trade</Link>
          <button onClick={() => setShowChart((v) => !v)}><BarChart3 size={17}/>{showChart ? "Hide price chart" : "Check price chart"}</button>
        </div>
      </section>
    </main>

    <section className="quick-strip">
      <MiniFact label="Fair value" value={coins(view.fair)} sub={discount !== null ? `${Math.abs(discount).toFixed(1)}% ${discount >= 0 ? "below" : "above"}` : "Recent value"}/>
      <MiniFact label="Sales today" value={compact(view.sales24h)} sub="Completed sales"/>
      <MiniFact label="Best method" value={strategyLabel(view.rec?.qualified_strategies)} sub="Suggested play"/>
      <MiniFact label="Time needed" value={holdingPeriod(view.rec)} sub="Expected hold"/>
    </section>

    {showChart && <section className="quick-chart"><SalesChartSection cardId={cardId}/></section>}

    <button className="quick-more-toggle" onClick={() => setShowMore((v) => !v)}>
      {showMore ? "Hide advanced numbers" : "Show advanced numbers"}<ChevronDown size={16}/>
    </button>
    {showMore && <section className="quick-advanced"><ScoresSection cardScores={data?.card_scores}/><DeferredSections/></section>}
  </div>;
}

function findCachedCard(dashboard, cardId) {
  if (!dashboard || !cardId) return null;
  const groups = [dashboard.todaysOpportunities, dashboard.highConfidenceInvestments, dashboard.cardsToAvoid, dashboard.biggestMovers];
  for (const item of groups.flatMap((group) => group || [])) {
    if (String(item?.cardId ?? item?.card_id) === String(cardId)) return normaliseSnapshot(item);
  }
  return null;
}
function normaliseSnapshot(item) {
  if (item?.player) return item;
  return {...item, cardId:item.cardId??item.card_id, entryPrice:item.entryPrice??item.entry_price, currentBin:item.currentBin??item.current_bin, fairValue:item.fairValue??item.fair_value_24h, expectedRoi:item.expectedRoi??toPct(item.likely_net_roi), netRoi:item.netRoi??{likely:toPct(item.likely_net_roi)}, sales24h:item.sales24h??item.sales_24h, confidence:item.confidence??item.score_confidence, risk:item.risk??riskLabel(item.score_risk), player:{name:item.name,cardName:item.card_name,rating:item.rating,position:item.position,version:item.version,imageUrl:item.image_url,generatedCardUrl:item.generated_card_url,cardBgImage:item.card_bg_image,cardCutoutImage:item.card_cutout_image,cardCutoutType:item.card_cutout_type,nationImage:item.nation_image,leagueImage:item.league_image,clubImage:item.club_image,stats:{pace:item.pace,shooting:item.shooting,passing:item.passing,dribbling:item.dribbling,defending:item.defending,physicality:item.physicality}}};
}
function buildView(data, snapshot) {
  const meta = data?.meta || snapshot?.player || snapshot?.meta;
  if (!meta) return null;
  const rec = data?.recommendation && !data.recommendation.error ? data.recommendation : snapshot || {};
  const entry = firstNumber(rec.entry_price, rec.entryPrice, rec.current_bin, rec.currentBin, data?.market_metrics?.current_bin, data?.fair_value?.current_bin);
  const fair = firstNumber(rec.fair_value, rec.fairValue, data?.fair_value?.fair_value_24h, data?.fair_value?.fair_value);
  const roi = firstNumber(rec.expected_roi_pct, rec.likely_net_roi, rec.expectedRoi, rec.netRoi?.likely);
  const profit = entry && Number.isFinite(roi) ? Math.round(entry * roi / 100) : 0;
  return {meta,rec,title:meta.card_name||meta.cardName||meta.name||"Player",recommendation:String(rec.recommendation||rec.status||"WATCH").toUpperCase(),entry,fair,profit,confidence:Math.round(firstNumber(rec.confidence,rec.score_confidence,0)),risk:rec.risk||riskLabel(rec.score_risk),sales24h:firstNumber(rec.sales24h,rec.sales_24h,data?.market_metrics?.sales_24h,data?.market_metrics?.sample_size_24h),reason:rec.reasoning||rec.summary||"The current price is being compared with recent completed sales."};
}
function PlayerArtwork({ meta = {} }) { return <PlayerCardImage player={meta} enablePolling imgClassName="quick-generated-card" showStats widthClass="w-64"/>; }
function NumberCard({icon,label,value,detail,positive}) { return <div className={`quick-number ${positive ? "positive" : ""}`}><i>{icon}</i><span>{label}</span><strong>{value||"—"}</strong><small>{detail}</small></div>; }
function MiniFact({label,value,sub}) { return <div><span>{label}</span><strong>{value||"—"}</strong><small>{sub}</small></div>; }
function QuickSkeleton(){return <div className="quick-analysis-page"><div className="quick-topline"><span>Loading card…</span></div><div className="quick-skeleton"><div/><section><span/><span/><span/></section></div></div>}
function buildReasons(view,discount){const reasons=[];if(discount!==null&&discount>0)reasons.push(`Current entry is ${discount.toFixed(1)}% below recent fair value.`);if(view.sales24h)reasons.push(`${compact(view.sales24h)} completed sales give the price signal real market support.`);if(view.confidence)reasons.push(`${view.confidence}% confidence after the current price, sales and risk checks.`);if(!reasons.length)reasons.push(view.reason);return reasons.slice(0,3)}
function plainReason(view,discount){if(view.recommendation==="BUY")return discount>0?"The card is priced below its recent value. Buy only at the shown entry or cheaper.":"The numbers support a buy, but stick to the entry price shown.";if(view.recommendation==="SELL"||view.recommendation==="AVOID")return"The possible return is not strong enough for the current risk. Leave it alone.";return"The card may be useful, but the current price is not good enough yet."}
function headline(call){return call==="BUY"?"BUY UNDER":call==="SELL"?"SELL AROUND":call==="AVOID"?"SKIP THIS CARD":"WAIT FOR"}
function friendlyCall(call){return call==="WAIT"?"WATCH":call}
function recommendationTone(call){return call==="BUY"?"buy":call==="SELL"||call==="AVOID"?"avoid":"watch"}
function riskCopy(risk){return `${risk||"Unknown"} risk`}
function firstNumber(...values){for(const value of values){const n=Number(value);if(Number.isFinite(n)&&n!==0)return n;}return 0}
function coins(v){const n=Number(v);return n>0?new Intl.NumberFormat("en-GB").format(Math.round(n)):"—"}
function signedCoins(v){const n=Number(v);return Number.isFinite(n)&&n!==0?`${n>0?"+":""}${new Intl.NumberFormat("en-GB").format(Math.round(n))}`:"—"}
function compact(v){const n=Number(v);return Number.isFinite(n)&&n>0?new Intl.NumberFormat("en-GB",{notation:n>999?"compact":"standard",maximumFractionDigits:1}).format(n):"—"}
function toPct(v){const n=Number(v);return !Number.isFinite(n)?0:Math.abs(n)<=1?n*100:n}
function riskLabel(v){const n=Number(v);return !Number.isFinite(n)?"Unknown":n>=70?"High":n>=40?"Medium":"Low"}
function holdingPeriod(rec){if(rec?.holding_period_days)return `${rec.holding_period_days} days`;const list=rec?.qualified_strategies||[];if(list.includes("quick_flip"))return"Up to 24h";if(list.includes("swing_trade"))return"2–3 days";if(list.includes("long_hold"))return"Up to a week";return rec?.holdingPeriod||"Flexible"}
function strategyLabel(list=[]){if(!list.length)return"General trade";return String(list[0]).replaceAll("_"," ").replace(/\b\w/g,c=>c.toUpperCase())}
