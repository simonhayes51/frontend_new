import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Activity, ArrowRight, BarChart3, Bell, Briefcase, ChevronRight, CircleDollarSign,
  Clock3, Command, Flame, Gauge, Home, LineChart, Menu, Search, ShieldAlert,
  Sparkles, Star, Target, TrendingDown, TrendingUp, User, Users, WalletCards, X, Zap,
} from "lucide-react";
import { useDashboard } from "../../hooks/useDashboard";
import { useLiveCardLayers } from "../../hooks/useLiveCardLayers";
import { useGeneratedCardImages, useStrategyRecommendations } from "../../hooks/useRecommendationFeeds";
import { useEntitlements } from "../../../context/EntitlementsContext";
import PlayerCardArt from "../../../components/PlayerCardArt";
import { addWatch } from "../../../api/watchlist";
import "../../styles/terminal.css";
import "../../styles/dashboard-v2.css";

const STRATEGIES = [
  ["best_picks", "Best now"], ["quick_flip", "Quick flip"], ["swing_trade", "2–3 days"],
  ["low_risk", "Low risk"], ["long_hold", "Long hold"], ["lazy_buyer", "Lazy buyer"], ["sbc", "SBC"],
];

const EMPTY = {
  marketRegime: { label: "Unknown", confidence: 0, summary: "", metrics: {} },
  todaysOpportunities: [], highConfidenceInvestments: [], cardsToAvoid: [], biggestMovers: [],
  recentAiPredictions: [], watchlistAlerts: [], latestMarketEvents: [], latestSbcImpact: [],
  locked: { opportunityFeed: false },
};

export default function HomeDashboard() {
  const dashboardQuery = useDashboard();
  const dashboard = dashboardQuery.data ?? EMPTY;
  const navigate = useNavigate();
  const { isPremium, isAdmin, features } = useEntitlements();
  const [activeStrategy, setActiveStrategy] = useState("best_picks");
  const [selectedId, setSelectedId] = useState(null);
  const [watchState, setWatchState] = useState("idle");
  const [mobileNav, setMobileNav] = useState(false);
  const locked = Boolean(dashboard.locked?.opportunityFeed);
  const tier = isAdmin || features.includes("opportunity_feed") ? "ELITE" : isPremium ? "PRO" : "FREE";

  const strategyQuery = useStrategyRecommendations(activeStrategy, { limit: 12 });
  const dashboardItems = useMemo(() => {
    const map = new Map();
    [dashboard.todaysOpportunities, dashboard.highConfidenceInvestments, dashboard.cardsToAvoid,
      dashboard.recentAiPredictions, dashboard.biggestMovers].flat().forEach((raw) => {
      const item = normalise(raw); if (item?.cardId) map.set(String(item.cardId), item);
    });
    return [...map.values()];
  }, [dashboard]);

  const strategyRaw = (strategyQuery.data?.items ?? []).map(normalise).filter(Boolean);
  const ids = [...dashboardItems, ...strategyRaw].map((x) => x.cardId);
  const generated = useGeneratedCardImages(ids).data?.images ?? {};
  const hydrate = (item) => item ? ({ ...item, player: { ...item.player, generatedCardUrl: generated[String(item.cardId)] || item.player?.generatedCardUrl } }) : null;
  const recommendations = dashboardItems.map(hydrate);
  const strategies = strategyRaw.map(hydrate);
  const buy = recommendations.filter((x) => x.recommendation === "BUY");
  const watch = recommendations.filter((x) => x.recommendation === "WAIT");
  const avoid = recommendations.filter((x) => ["AVOID", "SELL"].includes(x.recommendation));
  const calls = [...buy, ...watch, ...avoid];
  const selectedRaw = calls.find((x) => String(x.cardId) === String(selectedId)) || buy[0] || watch[0] || avoid[0] || recommendations[0];
  const { data: liveLayers } = useLiveCardLayers(selectedRaw?.player?.generatedCardUrl ? null : selectedRaw?.cardId);
  const selected = enrichWithLiveArt(selectedRaw, liveLayers);
  const score = Math.round(Number(dashboard.marketRegime?.confidence || 0));
  const potential = buy.reduce((sum, item) => sum + Math.max(0, profit(item)), 0);
  const ticker = buildTicker(recommendations, dashboard);

  async function addSelectedToWatchlist() {
    if (!selected || watchState === "saving") return;
    setWatchState("saving");
    try {
      await addWatch({ player_name: nameOf(selected.player), card_id: String(selected.cardId), version: selected.player?.version ?? null, platform: "ps" });
      setWatchState("saved");
    } catch (error) {
      if (error?.response?.status === 401) navigate("/login"); else setWatchState("error");
    }
  }

  return (
    <div className="ft-shell">
      <aside className={`ft-sidebar ${mobileNav ? "open" : ""}`}>
        <div className="ft-brand"><Command size={18}/><strong>FUT Hub</strong><button onClick={() => setMobileNav(false)}><X size={18}/></button></div>
        <nav>
          <Nav to="/v2" icon={<Home/>} label="Home" active />
          <Nav to="/v2#opportunities" icon={<Zap/>} label="Opportunities" badge={buy.length || undefined}/>
          <Nav to="/player-search" icon={<Users/>} label="Players"/>
          <Nav to="/trending" icon={<BarChart3/>} label="Market"/>
          <Nav to="/watchlist" icon={<Star/>} label="Watchlist" badge={dashboard.watchlistAlerts.length || undefined}/>
          <Nav to="/trades" icon={<Briefcase/>} label="Portfolio"/>
        </nav>
        <div className="ft-account"><div><User size={15}/><span>{tier}</span></div><button onClick={() => navigate("/profile")}>Account</button></div>
      </aside>

      <main className="ft-main">
        <header className="ft-topbar">
          <button className="ft-menu" onClick={() => setMobileNav(true)}><Menu size={19}/></button>
          <button className="ft-search" onClick={() => navigate("/player-search")}><Search size={17}/><span>Search player, card or price</span><kbd>/</kbd></button>
          <div className="ft-live"><i/><span>LIVE</span><small>{dashboardQuery.isLoading ? "syncing" : "market feed"}</small></div>
          <button className="ft-icon" onClick={() => navigate("/watchlist")}><Bell size={18}/>{dashboard.watchlistAlerts.length ? <b>{dashboard.watchlistAlerts.length}</b> : null}</button>
        </header>

        <Ticker items={ticker}/>

        {dashboardQuery.isError ? <div className="ft-error"><ShieldAlert size={17}/> Market data failed to load. <button onClick={() => dashboardQuery.refetch()}>Retry</button></div> : null}

        <section className="ft-command-deck">
          <div className="ft-primary-call">
            <header>
              <div><span className="ft-eyebrow"><Zap size={14}/> BEST MOVE NOW</span><h1>{selected ? nameOf(selected.player) : "Scanning the market"}</h1></div>
              {selected ? <SignalPill value={selected.recommendation}/> : null}
            </header>
            {selected ? <div className="ft-primary-body">
              <div className="ft-card-stage"><CardImage player={selected.player} featured/><div className="ft-card-shadow"/></div>
              <div className="ft-trade-ticket">
                <p>{reason(selected)}</p>
                <div className="ft-key-numbers">
                  <Metric label="Buy at" value={coins(selected.entryPrice ?? selected.currentBin)} suffix="coins"/>
                  <Metric label="Target profit" value={signedCoins(profit(selected))} suffix="after tax" tone={profit(selected) >= 0 ? "up" : "down"}/>
                  <Metric label="Confidence" value={`${Math.round(selected.confidence || 0)}%`} suffix={selected.risk ? `${selected.risk} risk` : "risk pending"}/>
                </div>
                <div className="ft-actions"><button className="primary" onClick={() => navigate(`/v2/players/${selected.cardId}`)}>Open analysis <ArrowRight size={15}/></button><button onClick={addSelectedToWatchlist}><Star size={15}/>{watchState === "saved" ? "Watching" : "Watch"}</button></div>
              </div>
            </div> : <Empty text="No clean opportunity yet."/>}
          </div>

          <aside className="ft-market-panel">
            <div className="ft-market-head"><div><span className="ft-eyebrow"><Activity size={14}/> MARKET PULSE</span><h2>{mood(score)}</h2></div><div className="ft-score"><strong>{score}</strong><span>/100</span></div></div>
            <div className="ft-pulse-track"><i style={{ width: `${score}%` }}/></div>
            <p>{dashboard.marketRegime.summary || "Prices and completed sales are being checked across tracked cards."}</p>
            <div className="ft-market-stats"><Metric label="Buy signals" value={buy.length}/><Metric label="Coin potential" value={signedCoins(potential)}/><Metric label="Tracked" value={dashboard.marketRegime.metrics?.liquidCards || recommendations.length}/></div>
            <div className="ft-mini-feed">
              {(dashboard.latestMarketEvents || []).slice(0, 3).map((event) => <div key={event.id || event.title}><Clock3 size={13}/><span>{event.title}</span></div>)}
              {!dashboard.latestMarketEvents?.length ? <div><Gauge size={13}/><span>No major content shock detected</span></div> : null}
            </div>
          </aside>
        </section>

        <section className="ft-opportunities" id="opportunities">
          <div className="ft-section-head"><div><span className="ft-eyebrow"><Sparkles size={14}/> LIVE OPPORTUNITIES</span><h2>What the market is giving you</h2></div><button onClick={() => navigate("/player-search")}>Browse all <ArrowRight size={15}/></button></div>
          <div className="ft-call-tabs"><Tab label="Buy" count={buy.length} active/><Tab label="Watch" count={watch.length}/><Tab label="Avoid" count={avoid.length}/></div>
          {locked ? <Locked/> : <div className="ft-opportunity-grid">{buy.slice(0, 6).map((item, index) => <Opportunity key={item.cardId} item={item} rank={index + 1} selected={String(selected?.cardId) === String(item.cardId)} onSelect={setSelectedId}/>)}</div>}
        </section>

        <section className="ft-lower-grid">
          <div className="ft-position-panel">
            <div className="ft-section-head compact"><div><span className="ft-eyebrow"><Target size={14}/> ACTIVE BREAKDOWN</span><h2>{selected ? nameOf(selected.player) : "Select a player"}</h2></div></div>
            {selected ? <>
              <div className="ft-position-row"><Fact label="Current BIN" value={coins(selected.currentBin)}/><Fact label="Fair value" value={coins(selected.fairValue)}/><Fact label="Break-even" value={coins(selected.breakEvenPrice)}/><Fact label="Sales 24h" value={count(selected.sales24h)}/></div>
              <div className="ft-risk-line"><div><span>Entry quality</span><strong>{quality(selected)}</strong></div><div><span>Risk level</span><strong>{selected.risk || "Unknown"}</strong></div><div><span>Hold</span><strong>{hold(selected.holdingPeriod)}</strong></div></div>
              <div className="ft-reasons">{evidence(selected).slice(0, 4).map((text) => <p key={text}><i/> {text}</p>)}</div>
            </> : <Empty text="Choose a card above to see the full position."/>}
          </div>

          <aside className="ft-alert-panel">
            <div className="ft-section-head compact"><div><span className="ft-eyebrow"><Bell size={14}/> YOUR FEED</span><h2>Alerts & movement</h2></div><button onClick={() => navigate("/watchlist")}>Open</button></div>
            {[...(dashboard.watchlistAlerts || []).slice(0, 3).map((a) => ({ title: a.title, text: a.message, tone: "alert" })), ...(dashboard.latestSbcImpact || []).slice(0, 2).map((x) => ({ title: x.title, text: `${percent(x.estimatedMarketImpact)} estimated move`, tone: Number(x.estimatedMarketImpact) >= 0 ? "up" : "down" }))].slice(0, 5).map((item, i) => <div className={`ft-feed-row ${item.tone}`} key={`${item.title}-${i}`}><i/><div><strong>{item.title}</strong><span>{item.text}</span></div><ChevronRight size={15}/></div>)}
            {!dashboard.watchlistAlerts?.length && !dashboard.latestSbcImpact?.length ? <Empty text="No alerts yet. Add players to your watchlist."/> : null}
          </aside>
        </section>

        <section className="ft-strategies">
          <div className="ft-section-head"><div><span className="ft-eyebrow"><LineChart size={14}/> STRATEGY FINDER</span><h2>Trade your way</h2></div></div>
          <div className="ft-strategy-tabs">{STRATEGIES.map(([key, label]) => <button key={key} className={activeStrategy === key ? "active" : ""} onClick={() => setActiveStrategy(key)}>{label}</button>)}</div>
          {strategyQuery.isLoading ? <div className="ft-loading"><i/><i/><i/></div> : strategies.length ? <div className="ft-strategy-grid">{strategies.slice(0, 8).map((item) => <Strategy key={item.cardId} item={item}/>)}</div> : <Empty text="No clean picks fit this strategy right now."/>}
        </section>

        <footer className="ft-disclaimer">Prices move quickly. FUT Hub uses recent sales and current market data; profit is never guaranteed and EA charges 5% on sales.</footer>
      </main>
    </div>
  );
}

function Nav({ to, icon, label, active, badge }) { return <Link className={active ? "active" : ""} to={to}>{icon}<span>{label}</span>{badge ? <b>{badge}</b> : null}</Link>; }
function Ticker({ items }) { const list = items.length ? items : [{ text: "Market feed connected", tone: "up" }]; return <div className="ft-ticker"><div>{[...list, ...list].map((x, i) => <span className={x.tone} key={`${x.text}-${i}`}><i/>{x.text}</span>)}</div></div>; }
function SignalPill({ value }) { const label = value === "WAIT" ? "WATCH" : value; return <span className={`ft-signal ${String(value).toLowerCase()}`}>{label}</span>; }
function Metric({ label, value, suffix, tone }) { return <div className={`ft-metric ${tone || ""}`}><span>{label}</span><strong>{value}</strong>{suffix ? <small>{suffix}</small> : null}</div>; }
function Tab({ label, count, active }) { return <button className={active ? "active" : ""}>{label}<b>{count}</b></button>; }
function Fact({ label, value }) { return <div><span>{label}</span><strong>{value}</strong></div>; }
function Empty({ text }) { return <div className="ft-empty"><Activity size={18}/><span>{text}</span></div>; }
function Locked() { return <div className="ft-locked"><ShieldAlert size={18}/><div><strong>Live picks are locked</strong><span>Upgrade to see entries, targets and risk.</span></div><Link to="/billing">Unlock</Link></div>; }

function Opportunity({ item, rank, selected, onSelect }) {
  return <button className={`ft-opportunity ${selected ? "selected" : ""}`} onClick={() => onSelect(String(item.cardId))}>
    <span className="ft-rank">{String(rank).padStart(2, "0")}</span><CardImage player={item.player} compact/>
    <div className="ft-op-copy"><div><strong>{nameOf(item.player)}</strong><small>{item.player?.rating} {item.player?.position} · {item.player?.version || "Card"}</small></div><p>{reason(item)}</p></div>
    <div className="ft-op-price"><span>{coins(item.entryPrice ?? item.currentBin)}</span><strong>{signedCoins(profit(item))}</strong><small>{roi(item)} after tax</small></div><ChevronRight size={17}/>
  </button>;
}
function Strategy({ item }) { return <Link className="ft-strategy-card" to={`/v2/players/${item.cardId}`}><CardImage player={item.player} compact/><div><strong>{nameOf(item.player)}</strong><span>{item.player?.rating} {item.player?.position}</span><b>{signedCoins(profit(item))}</b><small>{item.risk || "Unknown"} risk · {hold(item.holdingPeriod)}</small></div></Link>; }
function CardImage({ player = {}, featured, compact }) { if (player.generatedCardUrl) return <img className={`ft-card-img ${featured ? "featured" : compact ? "compact" : ""}`} src={player.generatedCardUrl} alt={nameOf(player)}/>; return <PlayerCardArt compact={compact} bgImage={player.cardBgImage} cutoutImage={player.cardCutoutImage} cutoutType={player.cardCutoutType || "special"} fallbackImage={player.imageUrl} rating={player.rating} position={player.position} name={nameOf(player)} altText={nameOf(player)} stats={player.stats} nationImage={player.nationImage} leagueImage={player.leagueImage} clubImage={player.clubImage} showStats={Boolean(featured)} widthClass={featured ? "w-52" : "w-16"}/>; }

function normalise(item) { if (!item) return null; if (item.player) return item; return { ...item, cardId:item.cardId??item.card_id, recommendation:item.recommendation??item.status, expectedRoi:toPct(item.likely_net_roi), netRoi:{likely:toPct(item.likely_net_roi)}, currentBin:item.currentBin??item.current_bin, fairValue:item.fairValue??item.fair_value_24h, entryPrice:item.entryPrice??item.entry_price, breakEvenPrice:item.breakEvenPrice??item.break_even_sale_price, sales24h:item.sales24h??item.sales_24h, holdingPeriod:item.holdingPeriod??"Flexible", risk:item.risk??riskLabel(item.score_risk), confidence:item.confidence??item.score_confidence??0, updatedAt:item.updatedAt??item.computed_at, reasoning:item.reasoning||statusReason(item.status), dataQuality:item.dataQuality??(item.data_quality_suspect?"SUSPECT":item.sales_24h?"GOOD":"LIMITED"), player:{name:item.name,cardName:item.card_name,rating:item.rating,version:item.version,position:item.position,imageUrl:item.image_url,cardBgImage:item.card_bg_image,cardCutoutImage:item.card_cutout_image,cardCutoutType:item.card_cutout_type,generatedCardUrl:item.generated_card_url,nationImage:item.nation_image,leagueImage:item.league_image,clubImage:item.club_image,stats:{pace:item.pace,shooting:item.shooting,passing:item.passing,dribbling:item.dribbling,defending:item.defending,physicality:item.physicality}} }; }
function enrichWithLiveArt(item, layers) { if (!item || !layers?.bgImageUrl) return item; return { ...item, player: { ...item.player, cardBgImage: layers.bgImageUrl, cardCutoutImage: layers.cutoutImageUrl, cardCutoutType: layers.cutoutType || item.player?.cardCutoutType } }; }
function buildTicker(items, dashboard) { const cards = items.slice(0, 7).map((x) => ({ text: `${nameOf(x.player)} ${roi(x)}`, tone: Number(x.expectedRoi) >= 0 ? "up" : "down" })); const events = (dashboard.latestMarketEvents || []).slice(0, 3).map((x) => ({ text: x.title, tone: "event" })); return [...cards, ...events]; }
function nameOf(p={}) { return p.cardName || p.name || "Unknown player"; }
function profit(item) { const entry = Number(item?.entryPrice ?? item?.currentBin); const value = Number(item?.netRoi?.likely ?? item?.expectedRoi); return entry && Number.isFinite(value) ? Math.round(entry * value / 100) : 0; }
function coins(v) { const n=Number(v); return Number.isFinite(n) && n>0 ? new Intl.NumberFormat("en-GB").format(Math.round(n)) : "—"; }
function signedCoins(v) { const n=Number(v); return n ? `${n>0?"+":""}${coins(n)}` : "—"; }
function count(v) { const n=Number(v); return Number.isFinite(n) ? new Intl.NumberFormat("en-GB",{notation:n>999?"compact":"standard"}).format(n) : "—"; }
function percent(v) { const n=Number(v); return Number.isFinite(n) ? `${n>0?"+":""}${n.toFixed(1)}%` : "—"; }
function roi(item) { return percent(item?.netRoi?.likely ?? item?.expectedRoi); }
function toPct(v) { const n=Number(v); if (!Number.isFinite(n)) return 0; return Math.abs(n)<=1 ? n*100 : n; }
function riskLabel(v) { const n=Number(v); return !Number.isFinite(n)?"Unknown":n>=70?"High":n>=40?"Medium":"Low"; }
function statusReason(s) { return s==="BUY"?"Price and sales data support an entry.":s==="WAIT"?"The card is useful, but the current entry is weak.":"Risk currently outweighs the likely return."; }
function reason(item) { return item?.reasoning || statusReason(item?.recommendation); }
function hold(v) { return String(v||"Flexible").replace("~24h","Up to 1 day").replace("~48h","1–2 days").replace("~7d","Up to a week"); }
function quality(item) { const gap = Number(item?.fairValue)-Number(item?.entryPrice??item?.currentBin); return gap>0?"Below value":gap<0?"Above value":"At value"; }
function evidence(item) { const out=[]; if(item.reasoning) out.push(item.reasoning); (item.marketDrivers||[]).forEach((x)=>out.push(x)); if(item.sales24h) out.push(`${count(item.sales24h)} completed sales in the last 24 hours.`); if(item.dataQuality) out.push(`Data quality: ${String(item.dataQuality).toLowerCase()}.`); return [...new Set(out.length?out:["Current price and sales checks are within the strategy rules."])]; }
function mood(score) { return score>=80?"Strong market":score>=60?"Good conditions":score>=40?"Selective market":"Quiet market"; }
