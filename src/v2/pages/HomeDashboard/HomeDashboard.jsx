// src/v2/pages/HomeDashboard/HomeDashboard.jsx
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bell,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Command,
  Crown,
  ExternalLink,
  Flame,
  Home,
  LineChart,
  RefreshCw,
  Search,
  Share2,
  ShieldAlert,
  Sparkles,
  Star,
  TrendingDown,
  TrendingUp,
  User,
  Users,
  WalletCards,
  Zap,
} from "lucide-react";
import { useDashboard } from "../../hooks/useDashboard";
import { useLiveCardLayers } from "../../hooks/useLiveCardLayers";
import { useStrategyRecommendations } from "../../hooks/useRecommendationFeeds";
import { useEntitlements } from "../../../context/EntitlementsContext";
import PlayerCardArt from "../../../components/PlayerCardArt";
import { addWatch } from "../../../api/watchlist";
import "../../styles/terminal.css";
import "../../styles/dashboard-v2.css";

const STRATEGY_TABS = [
  { key: "quick_flip", label: "Quick Flip" },
  { key: "swing_trade", label: "Swing Trade" },
  { key: "low_risk", label: "Low Risk" },
  { key: "long_hold", label: "Long Hold" },
  { key: "lazy_buyer", label: "Lazy Buyer" },
  { key: "sbc", label: "SBC" },
];

const SIGNAL_TABS = [
  { key: "buy", label: "Best Buys", icon: TrendingUp },
  { key: "wait", label: "Watch & Wait", icon: Clock3 },
  { key: "avoid", label: "Avoid / Sell", icon: TrendingDown },
];

const EMPTY_DASHBOARD = {
  marketRegime: { label: "Unknown", confidence: 0, summary: "", metrics: { liquidCards: 0, avgVolatility: 0, avgValueGap: 0 } },
  todaysOpportunities: [], highConfidenceInvestments: [], cardsToAvoid: [], biggestMovers: [],
  recentAiPredictions: [], watchlistAlerts: [], latestMarketEvents: [], latestSbcImpact: [],
  locked: { opportunityFeed: false },
};

const DATA_QUALITY_LABEL = { GOOD: "Reliable", SUSPECT: "Unusual pricing", LIMITED: "Limited data" };

export default function HomeDashboard() {
  const dashboardQuery = useDashboard();
  const { isPremium, isAdmin, features } = useEntitlements();
  const navigate = useNavigate();
  const dashboard = dashboardQuery.data ?? EMPTY_DASHBOARD;
  const locked = Boolean(dashboard.locked?.opportunityFeed);
  const tierLabel = isAdmin || features.includes("opportunity_feed") ? "ELITE" : isPremium ? "PRO" : "FREE";

  const [activeSignalTab, setActiveSignalTab] = useState("buy");
  const [activeStrategy, setActiveStrategy] = useState("quick_flip");
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [watchState, setWatchState] = useState("idle");
  const [notice, setNotice] = useState("");

  const strategyQuery = useStrategyRecommendations(activeStrategy, { limit: 8 });
  const strategyItems = locked ? [] : strategyQuery.data?.items ?? [];

  const recommendations = useMemo(() => {
    const unique = new Map();
    [
      ...dashboard.todaysOpportunities,
      ...dashboard.highConfidenceInvestments,
      ...dashboard.cardsToAvoid,
      ...dashboard.recentAiPredictions,
    ].forEach((item) => item?.cardId && unique.set(String(item.cardId), item));
    return [...unique.values()];
  }, [dashboard]);

  const buyItems = useMemo(() => {
    const buys = recommendations.filter((item) => item.recommendation === "BUY");
    return (buys.length ? buys : dashboard.todaysOpportunities).slice(0, 6);
  }, [recommendations, dashboard.todaysOpportunities]);
  const waitItems = useMemo(() => recommendations.filter((item) => item.recommendation === "WAIT").slice(0, 6), [recommendations]);
  const avoidItems = useMemo(() => recommendations.filter((item) => item.recommendation === "AVOID" || item.recommendation === "SELL").slice(0, 6), [recommendations]);
  const signalGroups = { buy: buyItems, wait: waitItems, avoid: avoidItems };
  const visibleSignals = signalGroups[activeSignalTab] ?? [];

  const defaultSelected = buyItems[0] ?? waitItems[0] ?? avoidItems[0] ?? recommendations[0] ?? null;
  const selectedRaw = recommendations.find((item) => String(item.cardId) === String(selectedCardId)) ?? defaultSelected;
  const { data: liveLayers } = useLiveCardLayers(selectedRaw?.cardId);
  const selected = enrichWithLiveArt(selectedRaw, liveLayers);
  const liveMovers = dashboard.biggestMovers.length ? dashboard.biggestMovers : recommendations.slice(0, 5);
  const status = dashboardQuery.isLoading ? "loading" : dashboardQuery.isError ? "error" : "live";
  const updatedAt = newestTimestamp(recommendations);

  function selectSignal(item) {
    setSelectedCardId(String(item.cardId));
    setWatchState("idle");
    setNotice("");
  }

  async function handleAddWatchlist() {
    if (!selected || watchState === "saving") return;
    setWatchState("saving");
    setNotice("");
    try {
      await addWatch({
        player_name: displayName(selected.player), card_id: String(selected.cardId),
        version: selected.player?.version ?? null, platform: "ps",
      });
      setWatchState("saved");
      setNotice("Added to your watchlist.");
    } catch (error) {
      if (error?.response?.status === 401) return navigate("/login");
      setWatchState("error");
      setNotice(error?.response?.data?.detail || "Could not add this card to your watchlist.");
    }
  }

  async function handleShare() {
    if (!selected) return;
    const url = `${window.location.origin}${window.location.pathname}#/v2/players/${selected.cardId}`;
    const text = `${displayName(selected.player)} — ${selected.recommendation || "market signal"} on FUT Hub`;
    try {
      if (navigator.share) await navigator.share({ title: text, text, url });
      else { await navigator.clipboard.writeText(url); setNotice("Player link copied."); }
    } catch { /* native share cancelled */ }
  }

  return (
    <div className="terminal-shell dashboard-v2 dashboard-command-centre">
      <aside className="sidebar" aria-label="Navigation">
        <Link className="brand-lockup" to="/v2" aria-label="FUT Hub home"><span className="brand-mark"><Command size={19} /></span><strong>FUT Hub</strong></Link>
        <nav className="nav-list">
          <NavItem icon={<Home size={18} />} label="Dashboard" to="/v2" active />
          <NavItem icon={<Activity size={18} />} label="Signals" to="/v2#signals" />
          <NavItem icon={<Users size={18} />} label="Players" to="/player-search" />
          <NavItem icon={<BarChart3 size={18} />} label="Market" to="/trending" />
          <NavItem icon={<Star size={18} />} label="Watchlist" to="/watchlist" />
          <NavItem icon={<Bell size={18} />} label="Alerts" to="/watchlist" badge={dashboard.watchlistAlerts.length || undefined} />
          <NavItem icon={<Briefcase size={18} />} label="Portfolio" to="/trades" />
        </nav>
        {tierLabel !== "ELITE" ? <div className="upgrade-panel"><span><Crown size={15} /> {tierLabel} plan</span><p>Unlock every strategy feed, avoid list and full AI breakdown.</p><button type="button" onClick={() => navigate("/billing")}>Upgrade now</button></div> : null}
      </aside>

      <main className="workspace">
        <header className="topbar dashboard-topbar">
          <button className="command-center dashboard-search" type="button" onClick={() => navigate("/player-search")}><Search size={18} /><span><strong>Search the market</strong> Find any player, version or card</span><kbd>/</kbd></button>
          <div className="operator-cluster">
            <div className={`live-status ${status}`}><span /><div><strong>{status === "live" ? "Live data" : status === "loading" ? "Reading market" : "Data unavailable"}</strong><small>{updatedAt ? `Updated ${formatRelativeTime(updatedAt)}` : "Waiting for scoring run"}</small></div></div>
            <button className="icon-button" type="button" aria-label="Open alerts" onClick={() => navigate("/watchlist")}><Bell size={18} />{dashboard.watchlistAlerts.length ? <span>{dashboard.watchlistAlerts.length}</span> : null}</button>
            <button className="profile-chip dashboard-profile" type="button" onClick={() => navigate("/profile")}><User size={15} /> Simon <em>{tierLabel}</em></button>
          </div>
        </header>

        {dashboardQuery.isError ? <div className="dashboard-error" role="alert"><ShieldAlert size={18} /><div><strong>The dashboard could not load.</strong><p>Your account is fine. Retry the market request.</p></div><button type="button" onClick={() => dashboardQuery.refetch()}><RefreshCw size={15} /> Retry</button></div> : null}

        <div className="terminal-grid dashboard-grid">
          <section className="main-column">
            <section className="signal-command-panel" id="signals">
              <div className="signal-command-header">
                <div><span><Flame size={16} /> Live opportunity board</span><h1>More than one pick. A ranked shortlist for every decision.</h1><p>Switch between the strongest buys, cards worth watching and cards the engine says to avoid.</p></div>
                <button type="button" onClick={() => navigate("/trending")}>Explore market <ArrowRight size={16} /></button>
              </div>
              <div className="signal-tabs" role="tablist" aria-label="Signal type">
                {SIGNAL_TABS.map(({ key, label, icon: Icon }) => <button key={key} type="button" role="tab" aria-selected={activeSignalTab === key} className={activeSignalTab === key ? `active ${key}` : key} onClick={() => setActiveSignalTab(key)}><Icon size={15} />{label}<em>{signalGroups[key].length}</em></button>)}
              </div>
              {locked ? <LockedOpportunityStrip /> : dashboardQuery.isLoading ? <SignalSkeleton /> : visibleSignals.length ? (
                <div className="signal-card-grid">
                  {visibleSignals.map((item, index) => <SignalCard key={item.cardId} item={item} rank={index + 1} selected={String(selected?.cardId) === String(item.cardId)} onSelect={selectSignal} />)}
                </div>
              ) : <div className="signal-empty"><CheckCircle2 size={22} /><strong>No cards clear this lane right now.</strong><p>That is a valid result. The engine will not invent a weak call to fill the dashboard.</p></div>}
            </section>

            <section className="analysis-board dashboard-analysis" aria-labelledby="player-analysis">
              <div className="analysis-header"><span><LineChart size={17} /> Player analysis</span>{selected ? <div className="analysis-actions"><button type="button" onClick={handleAddWatchlist} disabled={watchState === "saving"}><Star size={15} /> {watchState === "saving" ? "Adding..." : watchState === "saved" ? "Watching" : "Add to watchlist"}</button><button type="button" aria-label="Share card" onClick={handleShare}><Share2 size={15} /></button></div> : null}</div>
              {notice ? <p className={`dashboard-notice ${watchState === "error" ? "error" : ""}`}>{notice}</p> : null}
              {locked ? <UpgradeState navigate={navigate} /> : selected ? <SelectedAnalysis item={selected} /> : <EmptyDecision />}
            </section>

            <section className="strategy-workbench" aria-labelledby="strategy-title">
              <SectionHeading eyebrow="Strategy scanner" title="Choose how you trade. We only show cards that fit." />
              <div className="time-tabs strategy-tabs" role="tablist" aria-label="Strategy">{STRATEGY_TABS.map((tab) => <button key={tab.key} type="button" role="tab" aria-selected={activeStrategy === tab.key} className={activeStrategy === tab.key ? "active" : ""} onClick={() => setActiveStrategy(tab.key)}>{tab.label}</button>)}</div>
              {locked ? <LockedOpportunityStrip /> : strategyQuery.isLoading ? <LoadingRows /> : strategyQuery.isError ? <div className="inline-error"><span>Strategy feed failed to load.</span><button type="button" onClick={() => strategyQuery.refetch()}>Retry</button></div> : strategyItems.length ? <div className="strategy-grid">{strategyItems.map((item) => <StrategyCard key={item.cardId} item={item} onSelect={selectSignal} />)}</div> : <p className="empty-rail">No cards currently clear this strategy&apos;s threshold.</p>}
            </section>

            <section className="movers-row dashboard-movers" aria-label="Market activity"><div className="row-title">Top movers <small>live</small></div>{liveMovers.slice(0, 5).map((item, index) => <MoverRow key={`${item.cardId}-${index}`} item={item} />)}{!liveMovers.length ? <div className="mover-empty">No market activity is available yet.</div> : null}</section>
          </section>

          <aside className="intelligence-rail" aria-label="Live intelligence">
            <MarketPulse regime={dashboard.marketRegime} />
            <RailPanel title="Live alerts" action="View all" onAction={() => navigate("/watchlist")}>{dashboard.watchlistAlerts.slice(0, 4).map((alert) => <AlertRow key={`${alert.title}-${alert.message}`} alert={alert} />)}{!dashboard.watchlistAlerts.length ? <EmptyRail text="No triggered alerts. Add cards and thresholds from Watchlist." /> : null}</RailPanel>
            <RailPanel title="Upcoming content">{dashboard.latestMarketEvents.length ? dashboard.latestMarketEvents.slice(0, 4).map((event) => <EventRow key={event.id} event={event} />) : <EmptyRail text="No upcoming content events have been detected." />}</RailPanel>
            <RailPanel title="Latest SBC impact">{dashboard.latestSbcImpact.length ? dashboard.latestSbcImpact.slice(0, 3).map((impact) => <ImpactRow key={impact.eventId} impact={impact} />) : <EmptyRail text="No measured SBC market impact yet." />}</RailPanel>
            <RailPanel title="Risk / invalidation" danger><ul className="risk-list">{buildRisks(selected, dashboard.marketRegime).map((risk) => <li key={risk}>{risk}</li>)}</ul></RailPanel>
          </aside>
        </div>
        <p className="disclaimer">Signals are evidence-based, not guaranteed. Check the live price before buying and remember EA&apos;s 5% sale tax.</p>
      </main>
    </div>
  );
}

function SelectedAnalysis({ item }) {
  return <div className="dashboard-analysis-body">
    <div className="dashboard-card-stage"><PlayerCard recommendation={item} featured /></div>
    <div className="asset-thesis">
      <p className="asset-kicker">{item.player?.version ?? "FC card"}</p><h2 id="player-analysis">{displayName(item.player)}</h2><p className="analysis-summary">{item.reasoning || plainReason(item, toneForRecommendation(item.recommendation))}</p>
      <div className="decision-matrix dashboard-decision-grid"><DecisionMetric label="Recommendation" value={item.recommendation || "NO CALL"} tone={toneForRecommendation(item.recommendation)} /><DecisionMetric label="Confidence" value={`${Math.round(item.confidence || 0)}%`} /><DecisionMetric label="Likely net ROI" value={formatRoi(item.netRoi?.likely ?? item.expectedRoi)} tone={(item.netRoi?.likely ?? item.expectedRoi) < 0 ? "sell" : "buy"} /><DecisionMetric label="Time window" value={item.holdingPeriod || "Unavailable"} /></div>
      <div className="market-facts dashboard-facts"><Fact label="Entry" value={formatCoins(item.entryPrice ?? item.currentBin)} detail="signal entry" /><Fact label="Current BIN" value={formatCoins(item.currentBin)} detail="live market" /><Fact label="Fair value" value={formatCoins(item.fairValue)} detail="24h median" /><Fact label="Break-even" value={formatCoins(item.breakEvenPrice)} detail="after EA tax" /><Fact label="Sales 24h" value={formatCount(item.sales24h)} detail="completed sales" /><Fact label="Liquidity" value={item.sales24h ? `${Math.max(0.1, item.sales24h / 24).toFixed(1)}/h` : "Unavailable"} detail="sales per hour" /></div>
      <div className="analysis-evidence-grid"><EvidencePanel title="Why now?" items={buildEvidence(item)} /><EvidencePanel title="What would invalidate it?" items={buildItemRisks(item)} danger /></div>
      <div className="analysis-footer-actions"><Link to={`/v2/players/${item.cardId}`}>Open full player page <ExternalLink size={15} /></Link><Link to="/trades"><WalletCards size={15} /> Log this trade</Link><span>{item.updatedAt ? `Scored ${formatRelativeTime(item.updatedAt)}` : "Scoring time unavailable"}</span></div>
    </div>
  </div>;
}

function SignalCard({ item, rank, selected, onSelect }) {
  const tone = toneForRecommendation(item.recommendation);
  return <article className={`signal-card ${tone} ${selected ? "selected" : ""}`}>
    <button type="button" className="signal-card-select" onClick={() => onSelect(item)} aria-label={`Analyse ${displayName(item.player)}`} />
    <div className="signal-rank">#{rank}</div><div className="signal-art"><PlayerCard recommendation={item} /></div>
    <div className="signal-copy"><span>{item.recommendation || "SIGNAL"}</span><strong>{displayName(item.player)}</strong><small>{item.player?.rating} {item.player?.position} · {item.player?.version || "Card"}</small><p>{item.reasoning || plainReason(item, tone)}</p><div className="signal-metrics"><MiniStat label="Net ROI" value={formatRoi(item.netRoi?.likely ?? item.expectedRoi)} /><MiniStat label="Confidence" value={`${Math.round(item.confidence || 0)}%`} /><MiniStat label="BIN" value={formatCoins(item.currentBin)} /></div></div>
    <div className="signal-confidence" style={{ "--confidence": `${Math.max(0, Math.min(100, item.confidence || 0)) * 3.6}deg` }}><strong>{Math.round(item.confidence || 0)}%</strong><span>confidence</span></div>
  </article>;
}

function StrategyCard({ item, onSelect }) { return <button className="strategy-card" type="button" onClick={() => onSelect(item)}><Avatar player={item.player} /><div><strong>{displayName(item.player)}</strong><span>{item.holdingPeriod || "Flexible"} · {item.risk || "Unknown"} risk</span></div><em>{formatRoi(item.netRoi?.likely ?? item.expectedRoi)}</em><small>{formatCoins(item.currentBin)}</small><ChevronRight size={16} /></button>; }
function MarketPulse({ regime }) { const confidence = Math.round(regime?.confidence || 0); return <section className="rail-panel market-pulse"><header><h2>Market state</h2><span className="live-dot">LIVE</span></header><div className="pulse-main"><div className="pulse-ring" style={{ "--confidence": `${confidence * 3.6}deg` }}><strong>{confidence}</strong><span>/100</span></div><div><strong>{regime?.label || "Unknown"}</strong><p>{regime?.summary || "Not enough market-state data yet."}</p></div></div><div className="pulse-stats"><Metric label="Cards tracked" value={formatCount(regime?.metrics?.liquidCards)} /><Metric label="Value gap" value={formatPercent(regime?.metrics?.avgValueGap)} /></div></section>; }
function SectionHeading({ eyebrow, title }) { return <div className="section-heading"><div><span><Sparkles size={16} /> {eyebrow}</span><h1>{title}</h1></div></div>; }
function NavItem({ icon, label, active, badge, to }) { return <Link className={`nav-item ${active ? "active" : ""}`} to={to}>{icon}<span>{label}</span>{badge ? <em>{badge}</em> : null}</Link>; }
function LockedOpportunityStrip() { return <div className="locked-dashboard-card"><Crown size={22} /><div><strong>Opportunity feed locked</strong><p>Upgrade to see live ranked shortlists and supporting evidence.</p></div><Link to="/billing">Unlock feed</Link></div>; }
function UpgradeState({ navigate }) { return <div className="decision-empty"><Crown size={24} /><strong>Player breakdown is a Pro feature</strong><p>Unlock strategy-qualified picks and their supporting market evidence.</p><button type="button" onClick={() => navigate("/billing")}>View plans</button></div>; }
function EmptyDecision() { return <div className="decision-empty"><Activity size={24} /><strong>No qualified card yet</strong><p>The engine will show a breakdown when a card genuinely clears the rules.</p><Link to="/player-search">Search a player instead</Link></div>; }
function SignalSkeleton() { return <div className="signal-card-grid">{[1,2,3,4].map((n) => <span className="signal-skeleton" key={n} />)}</div>; }
function LoadingRows() { return <div className="loading-rows">{[1, 2, 3].map((n) => <span key={n} />)}</div>; }
function EmptyRail({ text }) { return <p className="empty-rail">{text}</p>; }
function MiniStat({ label, value }) { return <div><p>{label}</p><em>{value}</em></div>; }
function Metric({ label, value }) { return <div><span>{label}</span><strong>{value}</strong></div>; }
function PlayerCard({ recommendation, featured }) { const player = recommendation.player || {}; return <div className={`player-card-art ${featured ? "featured" : ""}`}><PlayerCardArt bgImage={player.cardBgImage} cutoutImage={player.cardCutoutImage} cutoutType={player.cardCutoutType || "special"} fallbackImage={player.imageUrl} rating={player.rating} position={player.position} name={displayName(player)} altText={displayName(player)} stats={player.stats} nationImage={player.nationImage} leagueImage={player.leagueImage} clubImage={player.clubImage} showStats={Boolean(featured)} widthClass={featured ? "w-52" : "w-24"} /></div>; }
function DecisionMetric({ label, value, tone }) { return <div className={`decision-metric ${tone || ""}`}><span>{label}</span><strong>{value}</strong></div>; }
function Fact({ label, value, detail }) { return <div className="fact-cell"><span>{label}</span><strong>{value}</strong><em>{detail}</em></div>; }
function EvidencePanel({ title, items, danger }) { return <div className={`evidence-panel dashboard-evidence ${danger ? "danger" : ""}`}><h3>{title}</h3>{items.map((item) => <p key={item}>{danger ? <ShieldAlert size={14} /> : <CheckCircle2 size={14} />} {item}</p>)}</div>; }
function RailPanel({ title, action, onAction, danger, children }) { return <section className={`rail-panel ${danger ? "danger" : ""}`}><header><h2>{title}</h2>{action ? <button type="button" onClick={onAction}>{action}</button> : null}</header>{children}</section>; }
function MoverRow({ item }) { return <Link className="mover" to={`/v2/players/${item.cardId}`}><Avatar player={item.player} /><div><strong>{displayName(item.player)}</strong><span>{item.player?.version ?? "Card"}</span></div><em>{item.recommendation || "ACTIVE"}</em><small>{formatCoins(item.currentBin)}</small></Link>; }
function Avatar({ player = {} }) { return <span className="avatar"><PlayerCardArt compact bgImage={player.cardBgImage} cutoutImage={player.cardCutoutImage} cutoutType={player.cardCutoutType || "special"} fallbackImage={player.imageUrl} rating={player.rating} altText={displayName(player)} widthClass="w-10" /></span>; }
function AlertRow({ alert }) { return <button className="alert-row market" type="button"><span className="alert-label"><Zap size={14} />{alert.title}</span><strong>{alert.severity?.toUpperCase() || "INFO"}</strong><p>{alert.message}</p><ChevronRight size={18} /></button>; }
function EventRow({ event }) { const when = event.startsAt ? formatRelativeTime(event.startsAt) : "Time unknown"; return <div className="event-row"><span><Clock3 size={14} /> {event.kind || "event"}</span><strong>{event.title}</strong><small>{when}</small></div>; }
function ImpactRow({ impact }) { const positive = Number(impact.estimatedMarketImpact) >= 0; return <div className="impact-row"><span>{positive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}{impact.title}</span><strong className={positive ? "positive" : "negative"}>{formatPercent(impact.estimatedMarketImpact)}</strong><small>{impact.confidence}% confidence · {impact.fingerprints?.length || 0} groups</small></div>; }

function buildEvidence(item) { const evidence = []; if (item.reasoning) evidence.push(item.reasoning); (item.marketDrivers || []).slice(0, 3).forEach((driver) => evidence.push(driver)); if (item.sales24h) evidence.push(`${formatCount(item.sales24h)} completed sales in the last 24 hours.`); if (item.fairValue && item.currentBin && item.currentBin < item.fairValue) evidence.push(`Current BIN is ${formatPercent(((item.fairValue - item.currentBin) / item.fairValue) * 100)} below fair value.`); return evidence.length ? [...new Set(evidence)].slice(0, 5) : ["No additional supporting evidence is available yet."]; }
function buildItemRisks(item) { const risks = []; if (item.risk && item.risk !== "Low") risks.push(`${item.risk} modelled risk — keep the trade size sensible.`); if (item.dataQuality !== "GOOD") risks.push("Pricing data is limited or unusual; verify live listings before buying."); if (item.breakEvenPrice) risks.push(`A sale below ${formatCoins(item.breakEvenPrice)} loses coins after EA tax.`); risks.push("A new SBC, promo or supply spike can change demand quickly."); return risks.slice(0, 4); }
function buildRisks(item, regime) { const risks = buildItemRisks(item || {}); if (Number(regime?.metrics?.avgValueGap) < 0) risks.unshift("The wider market is trading above its recent typical value."); return [...new Set(risks)].slice(0, 4); }
function enrichWithLiveArt(item, layers) { if (!item || !layers?.bgImageUrl) return item; return { ...item, player: { ...item.player, cardBgImage: layers.bgImageUrl, cardCutoutImage: layers.cutoutImageUrl, cardCutoutType: layers.cutoutType || item.player?.cardCutoutType, cardName: layers.cardName || item.player?.cardName } }; }
function displayName(player) { return player?.cardName || player?.name || "Unknown card"; }
function plainReason(item, tone) { if (tone === "buy") return "This card currently clears at least one buying strategy."; if (tone === "sell") return item?.recommendation === "AVOID" ? "The likely return does not justify the entry price." : "The engine favours reducing exposure."; return "Demand exists, but the current entry does not clear the threshold."; }
function toneForRecommendation(value) { return value === "BUY" ? "buy" : value === "SELL" || value === "AVOID" ? "sell" : "wait"; }
function formatCoins(value) { if (value === null || value === undefined) return "Unavailable"; return new Intl.NumberFormat("en-GB").format(Math.round(value)); }
function formatCount(value) { if (value === null || value === undefined) return "0"; return new Intl.NumberFormat("en-GB").format(value); }
function formatPercent(value) { if (value === null || value === undefined || Number.isNaN(Number(value))) return "n/a"; const n = Number(value); return `${n > 0 ? "+" : ""}${n.toFixed(1)}%`; }
function formatRoi(value) { return formatPercent(value); }
function newestTimestamp(items) { return items.map((item) => item?.updatedAt).filter(Boolean).sort().at(-1) || null; }
function formatRelativeTime(value) { const date = new Date(value); if (Number.isNaN(date.getTime())) return "recently"; const minutes = Math.round((date.getTime() - Date.now()) / 60000); const formatter = new Intl.RelativeTimeFormat("en-GB", { numeric: "auto" }); if (Math.abs(minutes) < 60) return formatter.format(minutes, "minute"); const hours = Math.round(minutes / 60); if (Math.abs(hours) < 48) return formatter.format(hours, "hour"); return formatter.format(Math.round(hours / 24), "day"); }
