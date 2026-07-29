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
  Home,
  LineChart,
  Radio,
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

const EMPTY_DASHBOARD = {
  marketRegime: { label: "Unknown", confidence: 0, summary: "", metrics: { liquidCards: 0, avgVolatility: 0, avgValueGap: 0 } },
  todaysOpportunities: [],
  highConfidenceInvestments: [],
  cardsToAvoid: [],
  biggestMovers: [],
  recentAiPredictions: [],
  watchlistAlerts: [],
  latestMarketEvents: [],
  latestSbcImpact: [],
  locked: { opportunityFeed: false },
};

const DATA_QUALITY_LABEL = {
  GOOD: "Reliable",
  SUSPECT: "Unusual pricing",
  LIMITED: "Limited data",
};

export default function HomeDashboard() {
  const dashboardQuery = useDashboard();
  const { isPremium, isAdmin, features } = useEntitlements();
  const navigate = useNavigate();
  const dashboard = dashboardQuery.data ?? EMPTY_DASHBOARD;
  const locked = Boolean(dashboard.locked?.opportunityFeed);
  const tierLabel = isAdmin || features.includes("opportunity_feed") ? "ELITE" : isPremium ? "PRO" : "FREE";

  const [activeStrategy, setActiveStrategy] = useState("quick_flip");
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [watchState, setWatchState] = useState("idle");
  const [notice, setNotice] = useState("");

  const strategyQuery = useStrategyRecommendations(activeStrategy, { limit: 6 });
  const strategyItems = locked ? [] : strategyQuery.data?.items ?? [];

  const recommendations = useMemo(() => {
    const unique = new Map();
    [
      ...dashboard.todaysOpportunities,
      ...dashboard.highConfidenceInvestments,
      ...dashboard.cardsToAvoid,
      ...dashboard.recentAiPredictions,
    ].forEach((item) => {
      if (item?.cardId) unique.set(String(item.cardId), item);
    });
    return [...unique.values()];
  }, [dashboard]);

  const buy = pickRecommendation(recommendations, "BUY") ?? dashboard.todaysOpportunities[0] ?? null;
  const wait = pickRecommendation(recommendations, "WAIT");
  const avoid = pickRecommendation(recommendations, "AVOID") ?? pickRecommendation(recommendations, "SELL");
  const defaultSelected = buy ?? recommendations[0] ?? null;
  const selectedRaw = recommendations.find((item) => String(item.cardId) === String(selectedCardId)) ?? defaultSelected;

  const { data: liveLayers } = useLiveCardLayers(selectedRaw?.cardId);
  const selected = enrichWithLiveArt(selectedRaw, liveLayers);
  const topCards = [buy, wait, avoid].filter(Boolean);
  const liveMovers = dashboard.biggestMovers.length ? dashboard.biggestMovers : recommendations.slice(0, 5);
  const status = dashboardQuery.isLoading ? "loading" : dashboardQuery.isError ? "error" : "live";
  const updatedAt = newestTimestamp(recommendations);

  async function handleAddWatchlist() {
    if (!selected || watchState === "saving") return;
    setWatchState("saving");
    setNotice("");
    try {
      await addWatch({
        player_name: displayName(selected.player),
        card_id: String(selected.cardId),
        version: selected.player?.version ?? null,
        platform: "ps",
      });
      setWatchState("saved");
      setNotice("Added to your watchlist.");
    } catch (error) {
      if (error?.response?.status === 401) {
        navigate("/login");
        return;
      }
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
      else {
        await navigator.clipboard.writeText(url);
        setNotice("Player link copied.");
      }
    } catch {
      // User cancelling native share is not an error worth surfacing.
    }
  }

  return (
    <div className="terminal-shell dashboard-v2">
      <aside className="sidebar" aria-label="Navigation">
        <Link className="brand-lockup" to="/v2" aria-label="FUT Hub home">
          <span className="brand-mark"><Command size={19} /></span>
          <strong>FUT Hub</strong>
        </Link>
        <nav className="nav-list">
          <NavItem icon={<Home size={18} />} label="Dashboard" to="/v2" active />
          <NavItem icon={<Activity size={18} />} label="Signals" to="/v2#strategy-signals" />
          <NavItem icon={<Users size={18} />} label="Players" to="/player-search" />
          <NavItem icon={<BarChart3 size={18} />} label="Market" to="/trending" />
          <NavItem icon={<Star size={18} />} label="Watchlist" to="/watchlist" />
          <NavItem icon={<Bell size={18} />} label="Alerts" to="/watchlist" badge={dashboard.watchlistAlerts.length || undefined} />
          <NavItem icon={<Briefcase size={18} />} label="Portfolio" to="/trades" />
        </nav>
        {tierLabel !== "ELITE" ? (
          <div className="upgrade-panel">
            <span><Crown size={15} /> {tierLabel} plan</span>
            <p>Unlock every strategy feed, avoid list and full AI breakdown.</p>
            <button type="button" onClick={() => navigate("/billing")}>See plans</button>
          </div>
        ) : null}
      </aside>

      <main className="workspace">
        <header className="topbar dashboard-topbar">
          <button className="command-center dashboard-search" type="button" onClick={() => navigate("/player-search")}> 
            <Search size={18} />
            <span><strong>Find a player</strong> Search cards, compare prices and open a full breakdown</span>
            <kbd>/</kbd>
          </button>
          <div className="operator-cluster">
            <div className={`live-status ${status}`}>
              <span />
              <div>
                <strong>{status === "live" ? "Market live" : status === "loading" ? "Loading market" : "Data unavailable"}</strong>
                <small>{updatedAt ? `Latest signal ${formatRelativeTime(updatedAt)}` : "Waiting for the next scoring run"}</small>
              </div>
            </div>
            <button className="icon-button" type="button" aria-label="Open alerts" onClick={() => navigate("/watchlist")}> 
              <Bell size={18} />
              {dashboard.watchlistAlerts.length ? <span>{dashboard.watchlistAlerts.length}</span> : null}
            </button>
            <button className="profile-chip dashboard-profile" type="button" onClick={() => navigate("/profile")}> 
              <User size={15} /> You <em>{tierLabel}</em>
            </button>
          </div>
        </header>

        {dashboardQuery.isError ? (
          <div className="dashboard-error" role="alert">
            <ShieldAlert size={18} />
            <div><strong>The dashboard could not load.</strong><p>Your account is fine. Retry the market request.</p></div>
            <button type="button" onClick={() => dashboardQuery.refetch()}><RefreshCw size={15} /> Retry</button>
          </div>
        ) : null}

        <section className="dashboard-hero" aria-label="Market overview">
          <div className="dashboard-hero-copy">
            <span><Sparkles size={15} /> Today&apos;s trading brief</span>
            <h1>{selected ? `${displayName(selected.player)} is the strongest live setup.` : "No card clears the bar yet."}</h1>
            <p>{selected ? selected.reasoning || "The card qualifies against the current strategy thresholds." : "The engine is live, but it is not forcing a pick without enough evidence."}</p>
            <div className="hero-actions">
              {selected ? <Link to={`/v2/players/${selected.cardId}`}>Open full analysis <ArrowRight size={16} /></Link> : <Link to="/player-search">Search players <ArrowRight size={16} /></Link>}
              <button type="button" onClick={() => navigate("/trades")}>Log a trade</button>
            </div>
          </div>
          <div className="market-state-card">
            <span>Market state</span>
            <strong>{dashboard.marketRegime.label}</strong>
            <p>{dashboard.marketRegime.summary || "Not enough market-state data yet."}</p>
            <div className="market-state-stats">
              <Metric label="Confidence" value={`${Math.round(dashboard.marketRegime.confidence || 0)}%`} />
              <Metric label="Cards tracked" value={formatCount(dashboard.marketRegime.metrics?.liquidCards)} />
              <Metric label="Value gap" value={formatPercent(dashboard.marketRegime.metrics?.avgValueGap)} />
            </div>
          </div>
        </section>

        <div className="terminal-grid dashboard-grid">
          <section className="main-column">
            <section className="opportunity-strip" aria-labelledby="best-opportunities">
              <SectionHeading eyebrow="Best live calls" title="Know what to buy, wait on and avoid." actionLabel="View market" onAction={() => navigate("/trending")} />
              {locked ? <LockedOpportunityStrip /> : (
                <div className="opportunity-cards">
                  <OpportunityCard item={buy} accent="buy" label="BUY" selected={selected?.cardId === buy?.cardId} onSelect={setSelectedCardId} />
                  <OpportunityCard item={wait} accent="wait" label="WAIT" selected={selected?.cardId === wait?.cardId} onSelect={setSelectedCardId} />
                  <OpportunityCard item={avoid} accent="sell" label={avoid?.recommendation === "SELL" ? "SELL" : "AVOID"} selected={selected?.cardId === avoid?.cardId} onSelect={setSelectedCardId} />
                </div>
              )}
            </section>

            <section className="analysis-board dashboard-analysis" aria-labelledby="player-analysis">
              <div className="analysis-header">
                <span><LineChart size={17} /> Selected card</span>
                {selected ? (
                  <div className="analysis-actions">
                    <button type="button" onClick={handleAddWatchlist} disabled={watchState === "saving"}><Star size={15} /> {watchState === "saving" ? "Adding..." : watchState === "saved" ? "Watching" : "Add to watchlist"}</button>
                    <button type="button" aria-label="Share card" onClick={handleShare}><Share2 size={15} /></button>
                  </div>
                ) : null}
              </div>
              {notice ? <p className={`dashboard-notice ${watchState === "error" ? "error" : ""}`}>{notice}</p> : null}
              {locked ? <UpgradeState navigate={navigate} /> : selected ? (
                <div className="dashboard-analysis-body">
                  <div className="dashboard-card-stage"><PlayerCard recommendation={selected} featured /></div>
                  <div className="asset-thesis">
                    <p className="asset-kicker">{selected.player?.version ?? "FC card"}</p>
                    <h2 id="player-analysis">{displayName(selected.player)}</h2>
                    <div className="decision-matrix dashboard-decision-grid">
                      <DecisionMetric label="Call" value={selected.recommendation || "NO CALL"} tone={toneForRecommendation(selected.recommendation)} />
                      <DecisionMetric label="Confidence" value={`${Math.round(selected.confidence || 0)}%`} />
                      <DecisionMetric label="Likely net ROI" value={formatRoi(selected.netRoi?.likely ?? selected.expectedRoi)} tone={(selected.netRoi?.likely ?? selected.expectedRoi) < 0 ? "sell" : "buy"} />
                      <DecisionMetric label="Hold" value={selected.holdingPeriod || "Unavailable"} />
                    </div>
                    <div className="market-facts dashboard-facts">
                      <Fact label="Entry" value={formatCoins(selected.entryPrice ?? selected.currentBin)} detail="price used by the signal" />
                      <Fact label="Current BIN" value={formatCoins(selected.currentBin)} detail="current market price" />
                      <Fact label="Fair value" value={formatCoins(selected.fairValue)} detail="recent 24h median" />
                      <Fact label="Break-even" value={formatCoins(selected.breakEvenPrice)} detail="sale price after 5% tax" />
                      <Fact label="Sales 24h" value={formatCount(selected.sales24h)} detail="completed sales" />
                      <Fact label="Data" value={DATA_QUALITY_LABEL[selected.dataQuality] ?? "Unknown"} detail="signal reliability" good={selected.dataQuality === "GOOD"} />
                    </div>
                    <EvidencePanel title="Why this call" items={buildEvidence(selected)} />
                    <div className="analysis-footer-actions">
                      <Link to={`/v2/players/${selected.cardId}`}>Open player page <ExternalLink size={15} /></Link>
                      <span>{selected.updatedAt ? `Scored ${formatRelativeTime(selected.updatedAt)}` : "Scoring time unavailable"}</span>
                    </div>
                  </div>
                </div>
              ) : <EmptyDecision />}
            </section>

            <section className="opportunity-strip strategy-signals" id="strategy-signals" aria-labelledby="strategy-title">
              <SectionHeading eyebrow="Strategy scanner" title="Only cards that clear each strategy's rules appear here." />
              <div className="time-tabs strategy-tabs" role="tablist" aria-label="Strategy">
                {STRATEGY_TABS.map((tab) => (
                  <button key={tab.key} type="button" role="tab" aria-selected={activeStrategy === tab.key} className={activeStrategy === tab.key ? "active" : ""} onClick={() => setActiveStrategy(tab.key)}>{tab.label}</button>
                ))}
              </div>
              {locked ? <LockedOpportunityStrip /> : strategyQuery.isLoading ? <LoadingRows /> : strategyQuery.isError ? (
                <div className="inline-error"><span>Strategy feed failed to load.</span><button type="button" onClick={() => strategyQuery.refetch()}>Retry</button></div>
              ) : strategyItems.length ? (
                <div className="strategy-signal-list">{strategyItems.map((item) => <StrategySignalRow key={item.cardId} item={item} />)}</div>
              ) : <p className="empty-rail">No cards currently clear this strategy&apos;s threshold. That is a valid result, not a broken feed.</p>}
            </section>

            <section className="movers-row dashboard-movers" aria-label="Market activity">
              <div className="row-title">Market activity <small>live</small></div>
              {liveMovers.slice(0, 5).map((item, index) => <MoverRow key={`${item.cardId}-${index}`} item={item} />)}
              {!liveMovers.length ? <div className="mover-empty">No market activity is available yet.</div> : null}
            </section>
          </section>

          <aside className="intelligence-rail" aria-label="Live intelligence">
            <RailPanel title="Watchlist alerts" action="View all" onAction={() => navigate("/watchlist")}>
              {dashboard.watchlistAlerts.slice(0, 4).map((alert) => <AlertRow key={`${alert.title}-${alert.message}`} alert={alert} />)}
              {!dashboard.watchlistAlerts.length ? <EmptyRail text="No triggered alerts. Add cards and thresholds from Watchlist." /> : null}
            </RailPanel>

            <RailPanel title="Upcoming content">
              {dashboard.latestMarketEvents.length ? dashboard.latestMarketEvents.slice(0, 4).map((event) => <EventRow key={event.id} event={event} />) : <EmptyRail text="No upcoming content events have been detected." />}
            </RailPanel>

            <RailPanel title="Latest SBC impact">
              {dashboard.latestSbcImpact.length ? dashboard.latestSbcImpact.slice(0, 3).map((impact) => <ImpactRow key={impact.eventId} impact={impact} />) : <EmptyRail text="No measured SBC market impact yet." />}
            </RailPanel>

            <RailPanel title="Risk check" danger>
              <ul className="risk-list">{buildRisks(selected, dashboard.marketRegime).map((risk) => <li key={risk}>{risk}</li>)}</ul>
            </RailPanel>

            <RailPanel title="What is still missing">
              <div className="missing-list">
                <MissingItem title="Outcome tracking" text="Win rate, realised ROI and average hold need recommendation snapshots linked to later sales." />
                <MissingItem title="Real alert worker" text="The alert UI exists, but the backend watchlist engine still needs a scheduled runner." />
                <MissingItem title="Content calendar" text="Market events are detected, but official release times need a reliable calendar source." />
                <MissingItem title="Portfolio intelligence" text="Logged buys and sells should feed exposure, profit and suggested exits back into this page." />
              </div>
            </RailPanel>
          </aside>
        </div>

        <p className="disclaimer">Signals are evidence-based, not guaranteed. Check the live price before buying and remember EA&apos;s 5% sale tax.</p>
      </main>
    </div>
  );
}

function SectionHeading({ eyebrow, title, actionLabel, onAction }) {
  return <div className="section-heading"><div><span><Sparkles size={16} /> {eyebrow}</span><h1>{title}</h1></div>{actionLabel ? <button type="button" onClick={onAction}>{actionLabel} <ArrowRight size={16} /></button> : null}</div>;
}

function NavItem({ icon, label, active, badge, to }) {
  return <Link className={`nav-item ${active ? "active" : ""}`} to={to}>{icon}<span>{label}</span>{badge ? <em>{badge}</em> : null}</Link>;
}

function OpportunityCard({ item, accent, label, selected, onSelect }) {
  if (!item) return <article className="op-card empty"><div className="op-content"><span>{label}</span><strong>No live call</strong><small>The engine is not forcing a weak recommendation.</small><div className="signal-foot"><b>Live thresholds only</b></div></div></article>;
  return (
    <article className={`op-card ${accent} ${selected ? "selected" : ""}`}>
      <button className="op-select" type="button" onClick={() => onSelect(String(item.cardId))} aria-label={`Select ${displayName(item.player)}`} />
      <PlayerCard recommendation={item} />
      <div className="op-content">
        <span>{label}</span><strong>{displayName(item.player)}</strong><small>{item.reasoning || plainReason(item, accent)}</small>
        <div className="op-stats-grid"><MiniStat label="Confidence" value={`${Math.round(item.confidence || 0)}%`} /><MiniStat label="Net ROI" value={formatRoi(item.netRoi?.likely ?? item.expectedRoi)} /><MiniStat label="Hold" value={item.holdingPeriod || "n/a"} /><MiniStat label="Risk" value={item.risk || "n/a"} /></div>
        <div className="signal-foot"><b>{formatCoins(item.currentBin)}</b><Link to={`/v2/players/${item.cardId}`}>Details <ChevronRight size={14} /></Link></div>
      </div>
    </article>
  );
}

function LockedOpportunityStrip() { return <div className="locked-dashboard-card"><Crown size={22} /><div><strong>Opportunity feed locked</strong><p>Upgrade to see the live BUY, WAIT and AVOID cards with evidence.</p></div><Link to="/billing">Unlock feed</Link></div>; }
function UpgradeState({ navigate }) { return <div className="decision-empty"><Crown size={24} /><strong>Player breakdown is a Pro feature</strong><p>Unlock strategy-qualified picks and their supporting market evidence.</p><button type="button" onClick={() => navigate("/billing")}>View plans</button></div>; }
function EmptyDecision() { return <div className="decision-empty"><Activity size={24} /><strong>No qualified card yet</strong><p>The engine will show a breakdown when a card genuinely clears the rules.</p><Link to="/player-search">Search a player instead</Link></div>; }
function LoadingRows() { return <div className="loading-rows">{[1, 2, 3].map((n) => <span key={n} />)}</div>; }
function EmptyRail({ text }) { return <p className="empty-rail">{text}</p>; }
function MiniStat({ label, value }) { return <div><p>{label}</p><em>{value}</em></div>; }
function Metric({ label, value }) { return <div><span>{label}</span><strong>{value}</strong></div>; }

function PlayerCard({ recommendation, featured }) {
  const player = recommendation.player || {};
  return <div className={`player-card-art ${featured ? "featured" : ""}`}><PlayerCardArt bgImage={player.cardBgImage} cutoutImage={player.cardCutoutImage} cutoutType={player.cardCutoutType || "special"} fallbackImage={player.imageUrl} rating={player.rating} position={player.position} name={displayName(player)} altText={displayName(player)} stats={player.stats} nationImage={player.nationImage} leagueImage={player.leagueImage} clubImage={player.clubImage} showStats={Boolean(featured)} widthClass={featured ? "w-52" : "w-20"} /></div>;
}

function DecisionMetric({ label, value, tone }) { return <div className={`decision-metric ${tone || ""}`}><span>{label}</span><strong>{value}</strong></div>; }
function Fact({ label, value, detail, good }) { return <div className="fact-cell"><span>{label}</span><strong>{value}</strong><em className={good ? "good" : ""}>{detail}</em></div>; }
function EvidencePanel({ title, items }) { return <div className="evidence-panel dashboard-evidence"><h3>{title}</h3>{items.map((item) => <p key={item}><CheckCircle2 size={14} /> {item}</p>)}</div>; }
function RailPanel({ title, action, onAction, danger, children }) { return <section className={`rail-panel ${danger ? "danger" : ""}`}><header><h2>{title}</h2>{action ? <button type="button" onClick={onAction}>{action}</button> : null}</header>{children}</section>; }

function StrategySignalRow({ item }) {
  const roi = item.netRoi?.likely ?? item.expectedRoi;
  return <Link className="mover strategy-row" to={`/v2/players/${item.cardId}`}><Avatar player={item.player} /><div><strong>{displayName(item.player)}</strong><span>{item.holdingPeriod || "Flexible"} · {item.risk || "Unknown"} risk</span></div><em>{formatRoi(roi)}</em><small>{formatCoins(item.currentBin)}</small></Link>;
}

function MoverRow({ item }) {
  return <Link className="mover" to={`/v2/players/${item.cardId}`}><Avatar player={item.player} /><div><strong>{displayName(item.player)}</strong><span>{item.player?.version ?? "Card"}</span></div><em>{item.recommendation || "ACTIVE"}</em><small>{formatCoins(item.currentBin)}</small></Link>;
}

function Avatar({ player = {} }) { return <span className="avatar"><PlayerCardArt compact bgImage={player.cardBgImage} cutoutImage={player.cardCutoutImage} cutoutType={player.cardCutoutType || "special"} fallbackImage={player.imageUrl} rating={player.rating} altText={displayName(player)} widthClass="w-10" /></span>; }

function AlertRow({ alert }) { return <button className="alert-row market" type="button"><span className="alert-label"><Zap size={14} />{alert.title}</span><strong>{alert.severity?.toUpperCase() || "INFO"}</strong><p>{alert.message}</p><ChevronRight size={18} /></button>; }
function EventRow({ event }) { const when = event.startsAt ? formatRelativeTime(event.startsAt) : "Time unknown"; return <div className="event-row"><span><Clock3 size={14} /> {event.kind || "event"}</span><strong>{event.title}</strong><small>{when}</small></div>; }
function ImpactRow({ impact }) { const positive = Number(impact.estimatedMarketImpact) >= 0; return <div className="impact-row"><span>{positive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}{impact.title}</span><strong className={positive ? "positive" : "negative"}>{formatPercent(impact.estimatedMarketImpact)}</strong><small>{impact.confidence}% confidence · {impact.fingerprints?.length || 0} groups</small></div>; }
function MissingItem({ title, text }) { return <div><strong>{title}</strong><p>{text}</p></div>; }

function buildEvidence(item) {
  const evidence = [];
  if (item.reasoning) evidence.push(item.reasoning);
  (item.marketDrivers || []).slice(0, 3).forEach((driver) => evidence.push(driver));
  if (item.sales24h) evidence.push(`${formatCount(item.sales24h)} completed sales in the last 24 hours.`);
  if (item.dataQuality) evidence.push(`Data quality: ${DATA_QUALITY_LABEL[item.dataQuality] ?? item.dataQuality}.`);
  return evidence.length ? [...new Set(evidence)] : ["No additional supporting evidence is available yet."];
}

function buildRisks(item, regime) {
  const risks = [];
  if (item?.risk && item.risk !== "Low") risks.push(`${item.risk} signal risk — size the trade accordingly.`);
  if (item?.dataQuality !== "GOOD") risks.push("Market data is limited or unusual, so verify the live listings first.");
  if (Number(regime?.metrics?.avgValueGap) < 0) risks.push("The wider market is above its recent typical value.");
  risks.push("A new SBC or promo can change demand quickly.");
  risks.push("Your eventual sale loses 5% to EA tax.");
  return risks.slice(0, 4);
}

function enrichWithLiveArt(item, layers) { if (!item || !layers?.bgImageUrl) return item; return { ...item, player: { ...item.player, cardBgImage: layers.bgImageUrl, cardCutoutImage: layers.cutoutImageUrl, cardCutoutType: layers.cutoutType || item.player?.cardCutoutType, cardName: layers.cardName || item.player?.cardName } }; }
function pickRecommendation(items, action) { return items.find((item) => item.recommendation === action); }
function displayName(player) { return player?.cardName || player?.name || "Unknown card"; }
function plainReason(item, accent) { if (accent === "buy") return "This card currently clears at least one buying strategy."; if (accent === "wait") return "Demand exists, but the current entry does not clear the threshold."; return item?.recommendation === "AVOID" ? "The likely return does not justify the entry price." : "The engine favours reducing exposure."; }
function toneForRecommendation(value) { return value === "BUY" ? "buy" : value === "SELL" || value === "AVOID" ? "sell" : ""; }
function formatCoins(value) { if (value === null || value === undefined) return "Unavailable"; return new Intl.NumberFormat("en-GB").format(Math.round(value)); }
function formatCount(value) { if (value === null || value === undefined) return "0"; return new Intl.NumberFormat("en-GB").format(value); }
function formatPercent(value) { if (value === null || value === undefined || Number.isNaN(Number(value))) return "n/a"; const n = Number(value); return `${n > 0 ? "+" : ""}${n.toFixed(1)}%`; }
function formatRoi(value) { return formatPercent(value); }
function newestTimestamp(items) { return items.map((item) => item?.updatedAt).filter(Boolean).sort().at(-1) || null; }
function formatRelativeTime(value) { const date = new Date(value); if (Number.isNaN(date.getTime())) return "recently"; const minutes = Math.round((date.getTime() - Date.now()) / 60000); const formatter = new Intl.RelativeTimeFormat("en-GB", { numeric: "auto" }); if (Math.abs(minutes) < 60) return formatter.format(minutes, "minute"); const hours = Math.round(minutes / 60); if (Math.abs(hours) < 48) return formatter.format(hours, "hour"); return formatter.format(Math.round(hours / 24), "day"); }
