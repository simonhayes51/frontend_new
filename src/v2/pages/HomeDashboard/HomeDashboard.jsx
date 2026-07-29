// src/v2/pages/HomeDashboard/HomeDashboard.jsx
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Activity, ArrowRight, BarChart3, Bell, Briefcase, CheckCircle2,
  ChevronRight, Clock3, Command, Crown, ExternalLink, Home, LineChart,
  RefreshCw, Search, Share2, ShieldAlert, Sparkles, Star, TrendingDown,
  TrendingUp, User, Users, Zap,
} from "lucide-react";
import { useDashboard } from "../../hooks/useDashboard";
import { useLiveCardLayers } from "../../hooks/useLiveCardLayers";
import { useGeneratedCardImages, useStrategyRecommendations } from "../../hooks/useRecommendationFeeds";
import { useEntitlements } from "../../../context/EntitlementsContext";
import PlayerCardArt from "../../../components/PlayerCardArt";
import { addWatch } from "../../../api/watchlist";
import "../../styles/terminal.css";
import "../../styles/dashboard-v2.css";

const STRATEGY_TABS = [
  { key: "best_picks", label: "Best Picks", help: "All cards the engine currently likes" },
  { key: "quick_flip", label: "Quick Flips", help: "Usually bought and sold within a day" },
  { key: "swing_trade", label: "2–3 Day Holds", help: "Short holds with room to rise" },
  { key: "low_risk", label: "Safer Buys", help: "Lower-risk cards with stronger data" },
  { key: "long_hold", label: "Longer Holds", help: "Cards worth holding for several days" },
  { key: "lazy_buyer", label: "Lazy Buyer", help: "Easy-to-buy cards with enough sales volume" },
  { key: "sbc", label: "SBC Plays", help: "Cards that may benefit from SBC demand" },
];

const EMPTY_DASHBOARD = {
  marketRegime: { label: "Unknown", confidence: 0, summary: "", metrics: { liquidCards: 0, avgVolatility: 0, avgValueGap: 0 } },
  todaysOpportunities: [], highConfidenceInvestments: [], cardsToAvoid: [], biggestMovers: [],
  recentAiPredictions: [], watchlistAlerts: [], latestMarketEvents: [], latestSbcImpact: [],
  locked: { opportunityFeed: false },
};

const DATA_QUALITY_LABEL = { GOOD: "Strong data", SUSPECT: "Price looks unusual", LIMITED: "Not much data" };

export default function HomeDashboard() {
  const dashboardQuery = useDashboard();
  const { isPremium, isAdmin, features } = useEntitlements();
  const navigate = useNavigate();
  const dashboard = dashboardQuery.data ?? EMPTY_DASHBOARD;
  const locked = Boolean(dashboard.locked?.opportunityFeed);
  const tierLabel = isAdmin || features.includes("opportunity_feed") ? "ELITE" : isPremium ? "PRO" : "FREE";

  const [activeStrategy, setActiveStrategy] = useState("best_picks");
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [watchState, setWatchState] = useState("idle");
  const [notice, setNotice] = useState("");

  const strategyQuery = useStrategyRecommendations(activeStrategy, { limit: 12 });

  const dashboardItems = useMemo(() => {
    const unique = new Map();
    [
      ...dashboard.todaysOpportunities,
      ...dashboard.highConfidenceInvestments,
      ...dashboard.cardsToAvoid,
      ...dashboard.recentAiPredictions,
      ...dashboard.biggestMovers,
    ].forEach((item) => {
      const normal = normaliseRecommendation(item);
      if (normal?.cardId) unique.set(String(normal.cardId), normal);
    });
    return [...unique.values()];
  }, [dashboard]);

  const strategyItemsRaw = (strategyQuery.data?.items ?? []).map(normaliseRecommendation).filter(Boolean);
  const allIds = [...dashboardItems, ...strategyItemsRaw].map((item) => item.cardId);
  const imageQuery = useGeneratedCardImages(allIds);
  const generatedImages = imageQuery.data?.images ?? {};
  const addSavedCard = (item) => item ? {
    ...item,
    player: { ...item.player, generatedCardUrl: generatedImages[String(item.cardId)] || item.player?.generatedCardUrl },
  } : null;

  const recommendations = dashboardItems.map(addSavedCard);
  const strategyItems = strategyItemsRaw.map(addSavedCard);
  const buyItems = recommendations.filter((item) => item.recommendation === "BUY").slice(0, 6);
  const waitItems = recommendations.filter((item) => item.recommendation === "WAIT").slice(0, 6);
  const avoidItems = recommendations.filter((item) => ["AVOID", "SELL"].includes(item.recommendation)).slice(0, 6);
  const allCalls = [...buyItems, ...waitItems, ...avoidItems];
  const defaultSelected = buyItems[0] ?? waitItems[0] ?? avoidItems[0] ?? recommendations[0] ?? null;
  const selectedRaw = allCalls.find((item) => String(item.cardId) === String(selectedCardId)) ?? defaultSelected;

  const { data: liveLayers } = useLiveCardLayers(selectedRaw?.player?.generatedCardUrl ? null : selectedRaw?.cardId);
  const selected = enrichWithLiveArt(selectedRaw, liveLayers);
  const activeTab = STRATEGY_TABS.find((tab) => tab.key === activeStrategy);
  const status = dashboardQuery.isLoading ? "loading" : dashboardQuery.isError ? "error" : "live";
  const updatedAt = newestTimestamp(recommendations);

  async function handleAddWatchlist() {
    if (!selected || watchState === "saving") return;
    setWatchState("saving"); setNotice("");
    try {
      await addWatch({ player_name: displayName(selected.player), card_id: String(selected.cardId), version: selected.player?.version ?? null, platform: "ps" });
      setWatchState("saved"); setNotice("Added to your watchlist.");
    } catch (error) {
      if (error?.response?.status === 401) return navigate("/login");
      setWatchState("error"); setNotice(error?.response?.data?.detail || "Could not add this card.");
    }
  }

  async function handleShare() {
    if (!selected) return;
    const url = `${window.location.origin}${window.location.pathname}#/v2/players/${selected.cardId}`;
    try {
      if (navigator.share) await navigator.share({ title: `${displayName(selected.player)} on FUT Hub`, url });
      else { await navigator.clipboard.writeText(url); setNotice("Player link copied."); }
    } catch { /* cancelled */ }
  }

  return (
    <div className="terminal-shell dashboard-v2">
      <aside className="sidebar" aria-label="Navigation">
        <Link className="brand-lockup" to="/v2"><span className="brand-mark"><Command size={19} /></span><strong>FUT Hub</strong></Link>
        <nav className="nav-list">
          <NavItem icon={<Home size={18} />} label="Dashboard" to="/v2" active />
          <NavItem icon={<Activity size={18} />} label="Trading Tips" to="/v2#strategy-signals" />
          <NavItem icon={<Users size={18} />} label="Players" to="/player-search" />
          <NavItem icon={<BarChart3 size={18} />} label="Market" to="/trending" />
          <NavItem icon={<Star size={18} />} label="Watchlist" to="/watchlist" />
          <NavItem icon={<Bell size={18} />} label="Alerts" to="/watchlist" badge={dashboard.watchlistAlerts.length || undefined} />
          <NavItem icon={<Briefcase size={18} />} label="My Trades" to="/trades" />
        </nav>
        {tierLabel !== "ELITE" ? <div className="upgrade-panel"><span><Crown size={15} /> {tierLabel} plan</span><p>Unlock every tip, strategy and full player breakdown.</p><button type="button" onClick={() => navigate("/billing")}>See plans</button></div> : null}
      </aside>

      <main className="workspace">
        <header className="topbar dashboard-topbar">
          <button className="command-center dashboard-search" type="button" onClick={() => navigate("/player-search")}><Search size={18} /><span><strong>Find a player</strong> Search cards, prices and trading info</span><kbd>/</kbd></button>
          <div className="operator-cluster">
            <div className={`live-status ${status}`}><span /><div><strong>{status === "live" ? "Prices live" : status === "loading" ? "Loading prices" : "Data unavailable"}</strong><small>{updatedAt ? `Latest tip ${formatRelativeTime(updatedAt)}` : "Waiting for the next update"}</small></div></div>
            <button className="icon-button" type="button" onClick={() => navigate("/watchlist")}><Bell size={18} />{dashboard.watchlistAlerts.length ? <span>{dashboard.watchlistAlerts.length}</span> : null}</button>
            <button className="profile-chip dashboard-profile" type="button" onClick={() => navigate("/profile")}><User size={15} /> You <em>{tierLabel}</em></button>
          </div>
        </header>

        {dashboardQuery.isError ? <div className="dashboard-error"><ShieldAlert size={18} /><div><strong>Dashboard could not load.</strong><p>Try the market request again.</p></div><button type="button" onClick={() => dashboardQuery.refetch()}><RefreshCw size={15} /> Retry</button></div> : null}

        <div className="terminal-grid dashboard-grid">
          <section className="main-column">
            <section className="opportunity-strip tips-board">
              <SectionHeading eyebrow="Today’s tips" title="The best buys, cards to watch and cards to avoid." actionLabel="See all players" onAction={() => navigate("/player-search")} />
              {locked ? <LockedOpportunityStrip /> : (
                <div className="tip-lanes">
                  <TipLane title="Best buys" subtitle="Cards that currently pass our buying checks" tone="buy" items={buyItems} selectedId={selected?.cardId} onSelect={setSelectedCardId} />
                  <TipLane title="Watch for now" subtitle="Interesting cards, but the price is not right yet" tone="wait" items={waitItems} selectedId={selected?.cardId} onSelect={setSelectedCardId} />
                  <TipLane title="Avoid / sell" subtitle="Too risky, overpriced or better to move on" tone="sell" items={avoidItems} selectedId={selected?.cardId} onSelect={setSelectedCardId} />
                </div>
              )}
            </section>

            <section className="analysis-board dashboard-analysis">
              <div className="analysis-header"><span><LineChart size={17} /> Player breakdown</span>{selected ? <div className="analysis-actions"><button type="button" onClick={handleAddWatchlist} disabled={watchState === "saving"}><Star size={15} /> {watchState === "saved" ? "Watching" : "Add to watchlist"}</button><button type="button" onClick={handleShare}><Share2 size={15} /></button></div> : null}</div>
              {notice ? <p className={`dashboard-notice ${watchState === "error" ? "error" : ""}`}>{notice}</p> : null}
              {locked ? <UpgradeState navigate={navigate} /> : selected ? <PlayerBreakdown item={selected} navigate={navigate} /> : <EmptyDecision />}
            </section>

            <section className="opportunity-strip strategy-signals" id="strategy-signals">
              <SectionHeading eyebrow="Ways to trade" title="Pick the style that suits how you play Ultimate Team." />
              <div className="strategy-picker" role="tablist">
                {STRATEGY_TABS.map((tab) => <button key={tab.key} type="button" className={activeStrategy === tab.key ? "active" : ""} onClick={() => setActiveStrategy(tab.key)}><strong>{tab.label}</strong><small>{tab.help}</small></button>)}
              </div>
              <p className="strategy-explainer">{activeTab?.help}</p>
              {locked ? <LockedOpportunityStrip /> : strategyQuery.isLoading ? <LoadingRows /> : strategyQuery.isError ? <div className="inline-error"><span>Could not load these picks.</span><button type="button" onClick={() => strategyQuery.refetch()}>Retry</button></div> : strategyItems.length ? <div className="strategy-card-grid">{strategyItems.map((item, index) => <StrategyCard key={item.cardId} item={item} rank={index + 1} />)}</div> : <div className="strategy-empty"><strong>No picks in this category right now.</strong><p>That does not mean the feature is broken. It means no card currently passes every check for this style.</p><button type="button" onClick={() => setActiveStrategy("best_picks")}>Show all best picks</button></div>}
            </section>

            <section className="movers-row dashboard-movers"><div className="row-title">Popular market cards <small>live</small></div>{recommendations.slice(0, 5).map((item, i) => <MoverRow key={`${item.cardId}-${i}`} item={item} />)}</section>
          </section>

          <aside className="intelligence-rail">
            <RailPanel title="Market right now"><div className="market-score"><strong>{Math.round(dashboard.marketRegime.confidence || 0)}</strong><div><b>{dashboard.marketRegime.label}</b><p>{dashboard.marketRegime.summary || "Not enough market data yet."}</p></div></div></RailPanel>
            <RailPanel title="Your alerts" action="View all" onAction={() => navigate("/watchlist")}>{dashboard.watchlistAlerts.slice(0, 4).map((alert) => <AlertRow key={`${alert.title}-${alert.message}`} alert={alert} />)}{!dashboard.watchlistAlerts.length ? <EmptyRail text="No alerts have triggered yet." /> : null}</RailPanel>
            <RailPanel title="Upcoming content">{dashboard.latestMarketEvents.length ? dashboard.latestMarketEvents.slice(0, 4).map((event) => <EventRow key={event.id} event={event} />) : <EmptyRail text="No upcoming content detected yet." />}</RailPanel>
            <RailPanel title="Latest SBC effect">{dashboard.latestSbcImpact.length ? dashboard.latestSbcImpact.slice(0, 3).map((impact) => <ImpactRow key={impact.eventId} impact={impact} />) : <EmptyRail text="No measured SBC price effect yet." />}</RailPanel>
          </aside>
        </div>
        <p className="disclaimer">Tips are based on recent prices and sales, not guaranteed profit. Always check the live market and remember EA takes 5% when you sell.</p>
      </main>
    </div>
  );
}

function TipLane({ title, subtitle, tone, items, selectedId, onSelect }) {
  return <section className={`tip-lane ${tone}`}><header><div><h2>{title}</h2><p>{subtitle}</p></div><span>{items.length}</span></header><div className="tip-card-scroll">{items.length ? items.map((item, index) => <TipCard key={item.cardId} item={item} rank={index + 1} selected={String(selectedId) === String(item.cardId)} onSelect={onSelect} />) : <div className="lane-empty">No cards here right now.</div>}</div></section>;
}

function TipCard({ item, rank, selected, onSelect }) {
  return <button type="button" className={`tip-card ${selected ? "selected" : ""}`} onClick={() => onSelect(String(item.cardId))}><span className="tip-rank">#{rank}</span><CardImage player={item.player} compact /><div><strong>{displayName(item.player)}</strong><small>{item.player?.rating} {item.player?.position} · {item.player?.version || "Card"}</small><p>{formatCoins(item.currentBin)} coins</p><em>{formatRoi(item.netRoi?.likely ?? item.expectedRoi)} after tax</em></div><ChevronRight size={16} /></button>;
}

function PlayerBreakdown({ item, navigate }) {
  return <div className="dashboard-analysis-body"><div className="dashboard-card-stage"><CardImage player={item.player} featured /></div><div className="asset-thesis"><p className="asset-kicker">{item.player?.version || "FC card"}</p><h2>{displayName(item.player)}</h2><p className="player-verdict">{friendlyReason(item)}</p><div className="decision-matrix dashboard-decision-grid"><DecisionMetric label="What to do" value={friendlyCall(item.recommendation)} tone={toneForRecommendation(item.recommendation)} /><DecisionMetric label="How sure?" value={`${Math.round(item.confidence || 0)}%`} /><DecisionMetric label="Profit chance" value={formatRoi(item.netRoi?.likely ?? item.expectedRoi)} /><DecisionMetric label="How long?" value={friendlyHold(item.holdingPeriod)} /></div><div className="market-facts dashboard-facts"><Fact label="Buy around" value={formatCoins(item.entryPrice ?? item.currentBin)} detail="suggested entry" /><Fact label="Price now" value={formatCoins(item.currentBin)} detail="current BIN" /><Fact label="Usual value" value={formatCoins(item.fairValue)} detail="recent fair price" /><Fact label="Need to sell for" value={formatCoins(item.breakEvenPrice)} detail="to cover EA tax" /><Fact label="Sales today" value={formatCount(item.sales24h)} detail="completed sales" /><Fact label="Data check" value={DATA_QUALITY_LABEL[item.dataQuality] || "Unknown"} detail="how much data we have" /></div><EvidencePanel title="Why we picked it" items={buildEvidence(item)} /><div className="analysis-footer-actions"><Link to={`/v2/players/${item.cardId}`}>Full player page <ExternalLink size={15} /></Link><button type="button" onClick={() => navigate("/trades")}>Log this trade</button><span>{item.updatedAt ? `Updated ${formatRelativeTime(item.updatedAt)}` : "Update time unavailable"}</span></div></div></div>;
}

function StrategyCard({ item, rank }) { return <Link className="strategy-card" to={`/v2/players/${item.cardId}`}><span className="strategy-rank">#{rank}</span><CardImage player={item.player} compact /><div><strong>{displayName(item.player)}</strong><small>{friendlyHold(item.holdingPeriod)} · {item.risk || "Unknown"} risk</small><p>{friendlyReason(item)}</p><footer><b>{formatCoins(item.currentBin)}</b><em>{formatRoi(item.netRoi?.likely ?? item.expectedRoi)}</em></footer></div></Link>; }
function CardImage({ player = {}, featured, compact }) { if (player.generatedCardUrl) return <img className={`saved-card-image ${featured ? "featured" : compact ? "compact" : ""}`} src={player.generatedCardUrl} alt={displayName(player)} />; return <PlayerCardArt compact={compact} bgImage={player.cardBgImage} cutoutImage={player.cardCutoutImage} cutoutType={player.cardCutoutType || "special"} fallbackImage={player.imageUrl} rating={player.rating} position={player.position} name={displayName(player)} altText={displayName(player)} stats={player.stats} nationImage={player.nationImage} leagueImage={player.leagueImage} clubImage={player.clubImage} showStats={Boolean(featured)} widthClass={featured ? "w-52" : compact ? "w-14" : "w-20"} />; }
function MoverRow({ item }) { return <Link className="mover" to={`/v2/players/${item.cardId}`}><CardImage player={item.player} compact /><div><strong>{displayName(item.player)}</strong><span>{item.player?.version || "Card"}</span></div><em>{friendlyCall(item.recommendation)}</em><small>{formatCoins(item.currentBin)}</small></Link>; }
function SectionHeading({ eyebrow, title, actionLabel, onAction }) { return <div className="section-heading"><div><span><Sparkles size={16} /> {eyebrow}</span><h1>{title}</h1></div>{actionLabel ? <button type="button" onClick={onAction}>{actionLabel} <ArrowRight size={16} /></button> : null}</div>; }
function NavItem({ icon, label, active, badge, to }) { return <Link className={`nav-item ${active ? "active" : ""}`} to={to}>{icon}<span>{label}</span>{badge ? <em>{badge}</em> : null}</Link>; }
function LockedOpportunityStrip() { return <div className="locked-dashboard-card"><Crown size={22} /><div><strong>Trading tips are locked</strong><p>Upgrade to see all current picks and reasons.</p></div><Link to="/billing">Unlock tips</Link></div>; }
function UpgradeState({ navigate }) { return <div className="decision-empty"><Crown size={24} /><strong>Full breakdown is a Pro feature</strong><p>Unlock the price targets and reasons behind each tip.</p><button type="button" onClick={() => navigate("/billing")}>See plans</button></div>; }
function EmptyDecision() { return <div className="decision-empty"><Activity size={24} /><strong>No tip selected</strong><p>Choose a card above to see the full breakdown.</p></div>; }
function LoadingRows() { return <div className="loading-rows">{[1,2,3].map((n) => <span key={n} />)}</div>; }
function EmptyRail({ text }) { return <p className="empty-rail">{text}</p>; }
function DecisionMetric({ label, value, tone }) { return <div className={`decision-metric ${tone || ""}`}><span>{label}</span><strong>{value}</strong></div>; }
function Fact({ label, value, detail }) { return <div className="fact-cell"><span>{label}</span><strong>{value}</strong><em>{detail}</em></div>; }
function EvidencePanel({ title, items }) { return <div className="evidence-panel dashboard-evidence"><h3>{title}</h3>{items.map((item) => <p key={item}><CheckCircle2 size={14} /> {item}</p>)}</div>; }
function RailPanel({ title, action, onAction, children }) { return <section className="rail-panel"><header><h2>{title}</h2>{action ? <button type="button" onClick={onAction}>{action}</button> : null}</header>{children}</section>; }
function AlertRow({ alert }) { return <button className="alert-row market" type="button"><span className="alert-label"><Zap size={14} />{alert.title}</span><strong>{alert.severity?.toUpperCase() || "INFO"}</strong><p>{alert.message}</p><ChevronRight size={18} /></button>; }
function EventRow({ event }) { return <div className="event-row"><span><Clock3 size={14} /> {event.kind || "event"}</span><strong>{event.title}</strong><small>{event.startsAt ? formatRelativeTime(event.startsAt) : "Time unknown"}</small></div>; }
function ImpactRow({ impact }) { const positive = Number(impact.estimatedMarketImpact) >= 0; return <div className="impact-row"><span>{positive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}{impact.title}</span><strong className={positive ? "positive" : "negative"}>{formatPercent(impact.estimatedMarketImpact)}</strong><small>{impact.confidence}% confidence</small></div>; }

function normaliseRecommendation(item) {
  if (!item) return null;
  if (item.player) return item;
  return {
    ...item,
    cardId: item.cardId ?? item.card_id,
    recommendation: item.recommendation ?? item.status,
    expectedRoi: toPercent(item.likely_net_roi),
    netRoi: { likely: toPercent(item.likely_net_roi), conservative: toPercent(item.conservative_net_roi), bullish: toPercent(item.bullish_net_roi) },
    currentBin: item.currentBin ?? item.current_bin,
    fairValue: item.fairValue ?? item.fair_value_24h,
    entryPrice: item.entryPrice ?? item.entry_price,
    breakEvenPrice: item.breakEvenPrice ?? item.break_even_sale_price,
    sales24h: item.sales24h ?? item.sales_24h,
    holdingPeriod: item.holdingPeriod ?? friendlyStrategyHold(item.qualified_strategies),
    risk: item.risk ?? riskLabel(item.score_risk),
    updatedAt: item.updatedAt ?? item.computed_at,
    reasoning: item.reasoning || reasonFromStatus(item.status, item.qualified_strategies),
    dataQuality: item.dataQuality ?? (item.data_quality_suspect ? "SUSPECT" : item.sales_24h ? "GOOD" : "LIMITED"),
    player: {
      name: item.name, cardName: item.card_name, rating: item.rating, version: item.version, position: item.position,
      imageUrl: item.image_url, cardBgImage: item.card_bg_image, cardCutoutImage: item.card_cutout_image,
      cardCutoutType: item.card_cutout_type, generatedCardUrl: item.generated_card_url,
      nationImage: item.nation_image, leagueImage: item.league_image, clubImage: item.club_image,
      stats: { pace: item.pace, shooting: item.shooting, passing: item.passing, dribbling: item.dribbling, defending: item.defending, physicality: item.physicality },
    },
  };
}
function enrichWithLiveArt(item, layers) { if (!item || !layers?.bgImageUrl) return item; return { ...item, player: { ...item.player, cardBgImage: layers.bgImageUrl, cardCutoutImage: layers.cutoutImageUrl, cardCutoutType: layers.cutoutType || item.player?.cardCutoutType, cardName: layers.cardName || item.player?.cardName } }; }
function buildEvidence(item) { const list = []; if (item.reasoning) list.push(item.reasoning); (item.marketDrivers || []).slice(0,3).forEach((x) => list.push(x)); if (item.sales24h) list.push(`${formatCount(item.sales24h)} sales in the last 24 hours.`); return list.length ? [...new Set(list)] : ["The card passed the current price and sales checks."]; }
function friendlyReason(item) { if (item.reasoning) return item.reasoning.replace("Qualifies for:", "Works for:").replaceAll("_", " "); if (item.recommendation === "BUY") return "The price and sales data currently make this a decent buy."; if (item.recommendation === "WAIT") return "Worth watching, but do not rush into it at this price."; return "The risk is too high compared with the possible return."; }
function friendlyCall(value) { return value === "BUY" ? "BUY" : value === "WAIT" ? "WAIT" : value === "SELL" ? "SELL" : value === "AVOID" ? "AVOID" : "ACTIVE"; }
function friendlyHold(value) { return String(value || "Flexible").replace("~24h", "Up to 1 day").replace("~48h", "1–2 days").replace("~7d", "Up to a week"); }
function friendlyStrategyHold(values=[]) { if (values.includes("quick_flip")) return "Up to 1 day"; if (values.includes("swing_trade")) return "1–2 days"; if (values.includes("long_hold")) return "Up to a week"; return "Flexible"; }
function reasonFromStatus(status, strategies=[]) { if (status === "BUY") return strategies.length ? `Works for: ${strategies.map((x) => x.replaceAll("_", " ")).join(", ")}.` : "This card passes the current buying checks."; if (status === "WAIT") return "The card is interesting, but the entry price is not good enough yet."; if (status === "AVOID") return "The likely return does not cover the risk and EA tax."; return ""; }
function riskLabel(v) { if (v == null) return "Unknown"; return Number(v) < .33 ? "Low" : Number(v) < .66 ? "Medium" : "High"; }
function toneForRecommendation(value) { return value === "BUY" ? "buy" : ["SELL","AVOID"].includes(value) ? "sell" : ""; }
function displayName(player) { return player?.cardName || player?.name || "Unknown card"; }
function toPercent(value) { return value == null ? null : Number(value) * 100; }
function formatCoins(value) { if (value == null) return "Unavailable"; return new Intl.NumberFormat("en-GB").format(Math.round(value)); }
function formatCount(value) { if (value == null) return "0"; return new Intl.NumberFormat("en-GB").format(value); }
function formatPercent(value) { if (value == null || Number.isNaN(Number(value))) return "n/a"; const n=Number(value); return `${n>0?"+":""}${n.toFixed(1)}%`; }
function formatRoi(value) { return formatPercent(value); }
function newestTimestamp(items) { return items.map((x) => x?.updatedAt).filter(Boolean).sort().at(-1) || null; }
function formatRelativeTime(value) { const date=new Date(value); if(Number.isNaN(date.getTime())) return "recently"; const mins=Math.round((date-Date.now())/60000); const f=new Intl.RelativeTimeFormat("en-GB",{numeric:"auto"}); if(Math.abs(mins)<60)return f.format(mins,"minute"); const hours=Math.round(mins/60); if(Math.abs(hours)<48)return f.format(hours,"hour"); return f.format(Math.round(hours/24),"day"); }
