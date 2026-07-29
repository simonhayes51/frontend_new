// src/v2/pages/HomeDashboard/HomeDashboard.jsx
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Activity, ArrowRight, BarChart3, Bell, Briefcase, CheckCircle2, ChevronRight,
  Clock3, Command, Crown, ExternalLink, Flame, Home, LineChart, Palette,
  RefreshCw, Search, Share2, ShieldAlert, Sparkles, Star, Target, TrendingDown,
  TrendingUp, User, Users, WalletCards, Zap,
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
  { key: "best_picks", label: "Best picks", help: "Everything worth looking at right now" },
  { key: "quick_flip", label: "Quick flips", help: "Buy and sell in roughly a day" },
  { key: "swing_trade", label: "2–3 day holds", help: "A little patience for a bigger move" },
  { key: "low_risk", label: "Safer buys", help: "Stronger data and lower risk" },
  { key: "long_hold", label: "Longer holds", help: "Cards worth sitting on" },
  { key: "lazy_buyer", label: "Lazy buyer", help: "Simple listings with healthy sales" },
  { key: "sbc", label: "SBC plays", help: "Cards helped by SBC demand" },
];

const EMPTY_DASHBOARD = {
  marketRegime: { label: "Unknown", confidence: 0, summary: "", metrics: { liquidCards: 0, avgVolatility: 0, avgValueGap: 0 } },
  todaysOpportunities: [], highConfidenceInvestments: [], cardsToAvoid: [], biggestMovers: [],
  recentAiPredictions: [], watchlistAlerts: [], latestMarketEvents: [], latestSbcImpact: [],
  locked: { opportunityFeed: false },
};

const DATA_QUALITY_LABEL = { GOOD: "Strong data", SUSPECT: "Odd pricing", LIMITED: "Limited data" };

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
  const [theme, setTheme] = useState("lime");

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
  const withSavedCard = (item) => item ? {
    ...item,
    player: { ...item.player, generatedCardUrl: generatedImages[String(item.cardId)] || item.player?.generatedCardUrl },
  } : null;

  const recommendations = dashboardItems.map(withSavedCard);
  const strategyItems = strategyItemsRaw.map(withSavedCard);
  const buyItems = recommendations.filter((item) => item.recommendation === "BUY").slice(0, 8);
  const waitItems = recommendations.filter((item) => item.recommendation === "WAIT").slice(0, 8);
  const avoidItems = recommendations.filter((item) => ["AVOID", "SELL"].includes(item.recommendation)).slice(0, 8);
  const allCalls = [...buyItems, ...waitItems, ...avoidItems];
  const defaultSelected = buyItems[0] ?? waitItems[0] ?? avoidItems[0] ?? recommendations[0] ?? null;
  const selectedRaw = allCalls.find((item) => String(item.cardId) === String(selectedCardId)) ?? defaultSelected;
  const { data: liveLayers } = useLiveCardLayers(selectedRaw?.player?.generatedCardUrl ? null : selectedRaw?.cardId);
  const selected = enrichWithLiveArt(selectedRaw, liveLayers);
  const status = dashboardQuery.isLoading ? "loading" : dashboardQuery.isError ? "error" : "live";
  const updatedAt = newestTimestamp(recommendations);

  const marketPulse = buildTicker(recommendations, dashboard);
  const buyProfit = buyItems.reduce((sum, item) => sum + Math.max(0, estimatedCoinProfit(item)), 0);
  const featured = [buyItems[0], waitItems[0], avoidItems[0]].filter(Boolean);

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
    <div className={`terminal-shell dashboard-v2 dashboard-fun theme-${theme}`}>
      <aside className="sidebar" aria-label="Navigation">
        <Link className="brand-lockup" to="/v2"><span className="brand-mark"><Command size={19} /></span><strong>FUT Hub</strong></Link>
        <nav className="nav-list">
          <NavItem icon={<Home size={18} />} label="Dashboard" to="/v2" active />
          <NavItem icon={<Flame size={18} />} label="Trading Tips" to="/v2#tips" />
          <NavItem icon={<Users size={18} />} label="Players" to="/player-search" />
          <NavItem icon={<BarChart3 size={18} />} label="Market" to="/trending" />
          <NavItem icon={<Star size={18} />} label="Watchlist" to="/watchlist" />
          <NavItem icon={<Bell size={18} />} label="Alerts" to="/watchlist" badge={dashboard.watchlistAlerts.length || undefined} />
          <NavItem icon={<Briefcase size={18} />} label="My Trades" to="/trades" />
        </nav>
        <div className="theme-switcher">
          <span><Palette size={14} /> Your colours</span>
          <div>{["lime", "cyan", "purple", "orange"].map((name) => <button key={name} type="button" className={theme === name ? "active" : ""} aria-label={`Use ${name} theme`} onClick={() => setTheme(name)} />)}</div>
        </div>
        {tierLabel !== "ELITE" ? <div className="upgrade-panel"><span><Crown size={15} /> {tierLabel} plan</span><p>Unlock every live pick and full breakdown.</p><button type="button" onClick={() => navigate("/billing")}>Upgrade</button></div> : null}
      </aside>

      <main className="workspace">
        <header className="topbar dashboard-topbar">
          <button className="command-center dashboard-search" type="button" onClick={() => navigate("/player-search")}><Search size={18} /><span><strong>Find a player</strong> Search any card or price</span><kbd>/</kbd></button>
          <div className="operator-cluster">
            <div className={`live-status ${status}`}><span /><div><strong>{status === "live" ? "Market live" : status === "loading" ? "Loading" : "Offline"}</strong><small>{updatedAt ? `Updated ${formatRelativeTime(updatedAt)}` : "Waiting for an update"}</small></div></div>
            <button className="icon-button" type="button" onClick={() => navigate("/watchlist")}><Bell size={18} />{dashboard.watchlistAlerts.length ? <span>{dashboard.watchlistAlerts.length}</span> : null}</button>
            <button className="profile-chip dashboard-profile" type="button" onClick={() => navigate("/profile")}><User size={15} /> You <em>{tierLabel}</em></button>
          </div>
        </header>

        <Ticker items={marketPulse} />

        {dashboardQuery.isError ? <div className="dashboard-error"><ShieldAlert size={18} /><div><strong>Dashboard could not load.</strong><p>Try the live market again.</p></div><button type="button" onClick={() => dashboardQuery.refetch()}><RefreshCw size={15} /> Retry</button></div> : null}

        <section className="market-hero">
          <div className="hero-copy">
            <span className="hero-kicker"><Flame size={16} /> TODAY&apos;S MARKET</span>
            <div className="hero-title-row"><h1>{marketMood(dashboard.marketRegime)}</h1><span className="live-pill">LIVE</span></div>
            <p>{dashboard.marketRegime.summary || "Live prices, sales and trading signals are being checked now."}</p>
            <div className="hero-numbers">
              <HeroMetric label="Buy picks" value={buyItems.length} tone="buy" />
              <HeroMetric label="Potential coins" value={buyProfit ? `+${formatCoins(buyProfit)}` : "Scanning"} tone="coins" />
              <HeroMetric label="Market score" value={`${Math.round(dashboard.marketRegime.confidence || 0)}/100`} tone="score" />
            </div>
            <div className="hero-actions"><button type="button" onClick={() => document.getElementById("tips")?.scrollIntoView({ behavior: "smooth" })}><Zap size={16} /> Show me the picks</button><button type="button" className="ghost" onClick={() => navigate("/trades")}><WalletCards size={16} /> Log a trade</button></div>
          </div>
          <div className="hero-orbit" aria-hidden="true"><div className="orbit-ring" /><div className="market-core"><strong>{Math.round(dashboard.marketRegime.confidence || 0)}</strong><span>MARKET<br/>SCORE</span></div></div>
        </section>

        <section className="feature-picks" id="tips">
          <SectionTitle icon={<Sparkles size={18} />} eyebrow="DO THIS NOW" title="Your top moves" action="See all players" onAction={() => navigate("/player-search")} />
          {locked ? <LockedOpportunityStrip /> : <div className="feature-pick-grid">{featured.length ? featured.map((item, index) => <FeaturePick key={item.cardId} item={item} rank={index + 1} selected={String(selected?.cardId) === String(item.cardId)} onSelect={setSelectedCardId} />) : <EmptyDecision />}</div>}
        </section>

        <section className="swipe-lanes">
          <PickRail title="🔥 Buy now" subtitle="Best entries available" tone="buy" items={buyItems} selectedId={selected?.cardId} onSelect={setSelectedCardId} />
          <PickRail title="👀 Watch" subtitle="Good card, wrong price" tone="wait" items={waitItems} selectedId={selected?.cardId} onSelect={setSelectedCardId} />
          <PickRail title="🚨 Avoid / sell" subtitle="Risk beats reward" tone="sell" items={avoidItems} selectedId={selected?.cardId} onSelect={setSelectedCardId} />
        </section>

        <section className="player-command" aria-label="Selected player analysis">
          <div className="command-heading"><div><span><Target size={17} /> CURRENT PLAY</span><h2>{selected ? displayName(selected.player) : "Choose a card"}</h2></div>{selected ? <div className="analysis-actions"><button type="button" onClick={handleAddWatchlist} disabled={watchState === "saving"}><Star size={15} /> {watchState === "saved" ? "Watching" : "Watch"}</button><button type="button" onClick={handleShare}><Share2 size={15} /></button></div> : null}</div>
          {notice ? <p className={`dashboard-notice ${watchState === "error" ? "error" : ""}`}>{notice}</p> : null}
          {locked ? <UpgradeState navigate={navigate} /> : selected ? <PlayerCommand item={selected} navigate={navigate} /> : <EmptyDecision />}
        </section>

        <section className="live-now-grid">
          <LivePanel title="Happening now" icon={<Zap size={17} />} tone="purple">
            {dashboard.latestMarketEvents.length ? dashboard.latestMarketEvents.slice(0, 4).map((event) => <EventRow key={event.id} event={event} />) : <EmptyRail text="No new content detected yet." />}
          </LivePanel>
          <LivePanel title="SBC price moves" icon={<TrendingUp size={17} />} tone="orange">
            {dashboard.latestSbcImpact.length ? dashboard.latestSbcImpact.slice(0, 4).map((impact) => <ImpactRow key={impact.eventId} impact={impact} />) : <EmptyRail text="No measured SBC move yet." />}
          </LivePanel>
          <LivePanel title="Your alerts" icon={<Bell size={17} />} tone="cyan" action="Open" onAction={() => navigate("/watchlist")}>
            {dashboard.watchlistAlerts.length ? dashboard.watchlistAlerts.slice(0, 4).map((alert) => <AlertRow key={`${alert.title}-${alert.message}`} alert={alert} />) : <EmptyRail text="Nothing has triggered. Add a price alert." />}
          </LivePanel>
        </section>

        <section className="strategy-zone" id="strategy-signals">
          <SectionTitle icon={<Activity size={18} />} eyebrow="WAYS TO MAKE COINS" title="Choose your style" />
          <div className="strategy-picker" role="tablist">{STRATEGY_TABS.map((tab) => <button key={tab.key} type="button" className={activeStrategy === tab.key ? "active" : ""} onClick={() => setActiveStrategy(tab.key)}><strong>{tab.label}</strong><small>{tab.help}</small></button>)}</div>
          {locked ? <LockedOpportunityStrip /> : strategyQuery.isLoading ? <LoadingRows /> : strategyQuery.isError ? <div className="inline-error"><span>Could not load these picks.</span><button type="button" onClick={() => strategyQuery.refetch()}>Retry</button></div> : strategyItems.length ? <div className="strategy-card-grid">{strategyItems.map((item, index) => <StrategyCard key={item.cardId} item={item} rank={index + 1} />)}</div> : <div className="strategy-empty"><strong>No clean picks here right now.</strong><p>The checks are strict. Try another style instead of forcing a bad trade.</p><button type="button" onClick={() => setActiveStrategy("best_picks")}>Show best picks</button></div>}
        </section>

        <section className="popular-strip"><div className="row-title">🔥 Popular right now</div><div className="popular-scroll">{recommendations.slice(0, 8).map((item, i) => <PopularCard key={`${item.cardId}-${i}`} item={item} />)}</div></section>

        <p className="disclaimer">Tips use recent prices and sales, not guaranteed profit. Check the live market and remember EA takes 5% when you sell.</p>
      </main>
    </div>
  );
}

function Ticker({ items }) { const doubled = [...items, ...items]; return <div className="market-ticker"><div>{doubled.map((item, index) => <span key={`${item.text}-${index}`} className={item.tone}><b>{item.icon}</b>{item.text}</span>)}</div></div>; }
function HeroMetric({ label, value, tone }) { return <div className={`hero-metric ${tone}`}><span>{label}</span><strong>{value}</strong></div>; }
function SectionTitle({ icon, eyebrow, title, action, onAction }) { return <div className="fun-section-title"><div><span>{icon}{eyebrow}</span><h2>{title}</h2></div>{action ? <button type="button" onClick={onAction}>{action}<ArrowRight size={15} /></button> : null}</div>; }

function FeaturePick({ item, rank, selected, onSelect }) {
  const call = friendlyCall(item.recommendation);
  const coins = estimatedCoinProfit(item);
  return <button type="button" className={`feature-pick ${call.toLowerCase()} ${selected ? "selected" : ""}`} onClick={() => onSelect(String(item.cardId))}><div className="feature-top"><span>#{rank}</span><b>{call}</b><em>{Math.round(item.confidence || 0)}% sure</em></div><CardImage player={item.player} featured /><div className="feature-copy"><h3>{displayName(item.player)}</h3><p>{friendlyReason(item)}</p><div><strong>{coins ? `${coins > 0 ? "+" : ""}${formatCoins(coins)} coins` : formatCoins(item.currentBin)}</strong><small>{coins ? `${formatRoi(item.netRoi?.likely ?? item.expectedRoi)} after tax` : "price now"}</small></div></div></button>;
}

function PickRail({ title, subtitle, tone, items, selectedId, onSelect }) { return <section className={`pick-rail ${tone}`}><header><div><h2>{title}</h2><p>{subtitle}</p></div><span>{items.length}</span></header><div className="rail-scroll">{items.length ? items.map((item) => <MiniPick key={item.cardId} item={item} selected={String(selectedId) === String(item.cardId)} onSelect={onSelect} />) : <div className="lane-empty">Nothing here right now.</div>}</div></section>; }
function MiniPick({ item, selected, onSelect }) { const profit = estimatedCoinProfit(item); return <button type="button" className={`mini-pick ${selected ? "selected" : ""}`} onClick={() => onSelect(String(item.cardId))}><CardImage player={item.player} compact /><div><strong>{displayName(item.player)}</strong><small>{item.player?.rating} {item.player?.position} · {item.player?.version || "Card"}</small><p>{profit ? `${profit > 0 ? "+" : ""}${formatCoins(profit)} coins` : `${formatCoins(item.currentBin)} coins`}</p><em>{formatRoi(item.netRoi?.likely ?? item.expectedRoi)}</em></div><ChevronRight size={17} /></button>; }

function PlayerCommand({ item, navigate }) {
  const profit = estimatedCoinProfit(item);
  return <div className="player-command-body"><div className="player-stage"><div className="stage-glow" /><CardImage player={item.player} featured /><span className={`call-badge ${friendlyCall(item.recommendation).toLowerCase()}`}>{friendlyCall(item.recommendation)}</span></div><div className="command-data"><div className="command-primary"><div><span>ENTRY</span><strong>{formatCoins(item.entryPrice ?? item.currentBin)}</strong><small>coins</small></div><div><span>POTENTIAL</span><strong className={profit >= 0 ? "positive" : "negative"}>{profit ? `${profit > 0 ? "+" : ""}${formatCoins(profit)}` : "n/a"}</strong><small>coins after tax</small></div><div><span>RISK</span><strong>{item.risk || "Unknown"}</strong><small>{Math.round(item.confidence || 0)}% confidence</small></div></div><p className="player-verdict">{friendlyReason(item)}</p><div className="position-strip"><Fact label="Price now" value={formatCoins(item.currentBin)} detail="live BIN" /><Fact label="Usual value" value={formatCoins(item.fairValue)} detail="recent fair price" /><Fact label="Need to sell" value={formatCoins(item.breakEvenPrice)} detail="covers EA tax" /><Fact label="Sales today" value={formatCount(item.sales24h)} detail="completed sales" /></div><EvidencePanel title="Why this move?" items={buildEvidence(item)} /><div className="analysis-footer-actions"><Link to={`/v2/players/${item.cardId}`}>Full player page <ExternalLink size={15} /></Link><button type="button" onClick={() => navigate("/trades")}>Log this trade</button><span>{item.updatedAt ? `Updated ${formatRelativeTime(item.updatedAt)}` : "Update time unavailable"}</span></div></div></div>;
}

function LivePanel({ title, icon, tone, action, onAction, children }) { return <section className={`live-panel ${tone}`}><header><h2>{icon}{title}</h2>{action ? <button type="button" onClick={onAction}>{action}</button> : null}</header>{children}</section>; }
function StrategyCard({ item, rank }) { const profit = estimatedCoinProfit(item); return <Link className="strategy-card" to={`/v2/players/${item.cardId}`}><span className="strategy-rank">#{rank}</span><CardImage player={item.player} compact /><div><strong>{displayName(item.player)}</strong><small>{friendlyHold(item.holdingPeriod)} · {item.risk || "Unknown"} risk</small><p>{friendlyReason(item)}</p><footer><b>{profit ? `${profit > 0 ? "+" : ""}${formatCoins(profit)} coins` : formatCoins(item.currentBin)}</b><em>{formatRoi(item.netRoi?.likely ?? item.expectedRoi)}</em></footer></div></Link>; }
function PopularCard({ item }) { return <Link className="popular-card" to={`/v2/players/${item.cardId}`}><CardImage player={item.player} compact /><strong>{displayName(item.player)}</strong><span>{formatCoins(item.currentBin)} coins</span><em>{formatRoi(item.netRoi?.likely ?? item.expectedRoi)}</em></Link>; }

function CardImage({ player = {}, featured, compact }) { if (player.generatedCardUrl) return <img className={`saved-card-image ${featured ? "featured" : compact ? "compact" : ""}`} src={player.generatedCardUrl} alt={displayName(player)} />; return <PlayerCardArt compact={compact} bgImage={player.cardBgImage} cutoutImage={player.cardCutoutImage} cutoutType={player.cardCutoutType || "special"} fallbackImage={player.imageUrl} rating={player.rating} position={player.position} name={displayName(player)} altText={displayName(player)} stats={player.stats} nationImage={player.nationImage} leagueImage={player.leagueImage} clubImage={player.clubImage} showStats={Boolean(featured)} widthClass={featured ? "w-52" : compact ? "w-16" : "w-20"} />; }
function NavItem({ icon, label, active, badge, to }) { return <Link className={`nav-item ${active ? "active" : ""}`} to={to}>{icon}<span>{label}</span>{badge ? <em>{badge}</em> : null}</Link>; }
function LockedOpportunityStrip() { return <div className="locked-dashboard-card"><Crown size={22} /><div><strong>Trading tips are locked</strong><p>Upgrade to see the live picks and reasons.</p></div><Link to="/billing">Unlock tips</Link></div>; }
function UpgradeState({ navigate }) { return <div className="decision-empty"><Crown size={24} /><strong>Full breakdown is a Pro feature</strong><p>Unlock entry prices, risk and reasons.</p><button type="button" onClick={() => navigate("/billing")}>See plans</button></div>; }
function EmptyDecision() { return <div className="decision-empty"><Activity size={24} /><strong>No clean move yet</strong><p>The engine will not force a bad pick.</p></div>; }
function LoadingRows() { return <div className="loading-rows">{[1,2,3].map((n) => <span key={n} />)}</div>; }
function EmptyRail({ text }) { return <p className="empty-rail">{text}</p>; }
function Fact({ label, value, detail }) { return <div className="fact-cell"><span>{label}</span><strong>{value}</strong><em>{detail}</em></div>; }
function EvidencePanel({ title, items }) { return <div className="evidence-panel dashboard-evidence"><h3>{title}</h3>{items.map((item) => <p key={item}><CheckCircle2 size={14} /> {item}</p>)}</div>; }
function AlertRow({ alert }) { return <button className="alert-row market" type="button"><span className="alert-label"><Zap size={14} />{alert.title}</span><strong>{alert.severity?.toUpperCase() || "INFO"}</strong><p>{alert.message}</p><ChevronRight size={18} /></button>; }
function EventRow({ event }) { return <div className="event-row"><span><Clock3 size={14} /> {event.kind || "event"}</span><strong>{event.title}</strong><small>{event.startsAt ? formatRelativeTime(event.startsAt) : "Time unknown"}</small></div>; }
function ImpactRow({ impact }) { const positive = Number(impact.estimatedMarketImpact) >= 0; return <div className="impact-row"><span>{positive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}{impact.title}</span><strong className={positive ? "positive" : "negative"}>{formatPercent(impact.estimatedMarketImpact)}</strong><small>{impact.confidence}% confidence</small></div>; }

function buildTicker(items, dashboard) {
  const cardTicks = items.slice(0, 6).map((item) => ({ icon: Number(item.expectedRoi) >= 0 ? "▲" : "▼", text: `${displayName(item.player)} ${formatRoi(item.expectedRoi)}`, tone: Number(item.expectedRoi) >= 0 ? "up" : "down" }));
  const eventTicks = (dashboard.latestMarketEvents || []).slice(0, 3).map((event) => ({ icon: "⚡", text: event.title, tone: "event" }));
  return [...cardTicks, ...eventTicks, { icon: "●", text: `${dashboard.marketRegime.metrics?.liquidCards || 0} cards tracked`, tone: "info" }];
}
function marketMood(regime) { const score = Number(regime?.confidence || 0); if (score >= 80) return "🔥 MARKET IS HOT"; if (score >= 60) return "⚡ GOOD TRADING WINDOW"; if (score >= 40) return "👀 PICK YOUR SPOTS"; return "🧊 MARKET IS QUIET"; }
function estimatedCoinProfit(item) { const entry = Number(item?.entryPrice ?? item?.currentBin); const roi = Number(item?.netRoi?.likely ?? item?.expectedRoi); if (!entry || !Number.isFinite(roi)) return 0; return Math.round(entry * (roi / 100)); }
function normaliseRecommendation(item) { if (!item) return null; if (item.player) return item; return { ...item, cardId:item.cardId??item.card_id, recommendation:item.recommendation??item.status, expectedRoi:toPercent(item.likely_net_roi), netRoi:{likely:toPercent(item.likely_net_roi),conservative:toPercent(item.conservative_net_roi),bullish:toPercent(item.bullish_net_roi)}, currentBin:item.currentBin??item.current_bin, fairValue:item.fairValue??item.fair_value_24h, entryPrice:item.entryPrice??item.entry_price, breakEvenPrice:item.breakEvenPrice??item.break_even_sale_price, sales24h:item.sales24h??item.sales_24h, holdingPeriod:item.holdingPeriod??friendlyStrategyHold(item.qualified_strategies), risk:item.risk??riskLabel(item.score_risk), updatedAt:item.updatedAt??item.computed_at, reasoning:item.reasoning||reasonFromStatus(item.status,item.qualified_strategies), dataQuality:item.dataQuality??(item.data_quality_suspect?"SUSPECT":item.sales_24h?"GOOD":"LIMITED"), player:{name:item.name,cardName:item.card_name,rating:item.rating,version:item.version,position:item.position,imageUrl:item.image_url,cardBgImage:item.card_bg_image,cardCutoutImage:item.card_cutout_image,cardCutoutType:item.card_cutout_type,generatedCardUrl:item.generated_card_url,nationImage:item.nation_image,leagueImage:item.league_image,clubImage:item.club_image,stats:{pace:item.pace,shooting:item.shooting,passing:item.passing,dribbling:item.dribbling,defending:item.defending,physicality:item.physicality}} }; }
function enrichWithLiveArt(item,layers){if(!item||!layers?.bgImageUrl)return item;return{...item,player:{...item.player,cardBgImage:layers.bgImageUrl,cardCutoutImage:layers.cutoutImageUrl,cardCutoutType:layers.cutoutType||item.player?.cardCutoutType,cardName:layers.cardName||item.player?.cardName}};}
function buildEvidence(item){const list=[];if(item.reasoning)list.push(item.reasoning);(item.marketDrivers||[]).slice(0,3).forEach((x)=>list.push(x));if(item.sales24h)list.push(`${formatCount(item.sales24h)} sales in the last 24 hours.`);if(item.dataQuality)list.push(`Data check: ${DATA_QUALITY_LABEL[item.dataQuality]||item.dataQuality}.`);return list.length?[...new Set(list)]:["The card passed the current price and sales checks."];}
function friendlyReason(item){if(item.reasoning)return item.reasoning.replace("Qualifies for:","Works for:").replaceAll("_"," ");if(item.recommendation==="BUY")return"The price and sales data currently make this a decent buy.";if(item.recommendation==="WAIT")return"Worth watching, but do not rush in at this price.";return"The risk is too high compared with the possible return.";}
function friendlyCall(value){return value==="BUY"?"BUY":value==="WAIT"?"WATCH":value==="SELL"?"SELL":value==="AVOID"?"AVOID":"ACTIVE";}
function friendlyHold(value){return String(value||"Flexible").replace("~24h","Up to 1 day").replace("~48h","1–2 days").replace("~7d","Up to a week");}
function friendlyStrategyHold(values=[]){if(values.includes("quick_flip"))return"Up to 1 day";if(values.includes("swing_trade"))return"1–2 days";if(values.includes("long_hold"))return"Up to a week";return"Flexible";}
function reasonFromStatus(status,strategies=[]){if(status==="BUY")return strategies.length?`Works for: ${strategies.map((x)=>x.replaceAll("_"," ")).join(", ")}.`:"This card passes the current buying checks.";if(status==="WAIT")return"The card is interesting, but the entry price is not good enough yet.";if(status==="AVOID")return"The likely return does not cover the risk and EA tax.";return"";}
function riskLabel(v){if(v==null)return"Unknown";return Number(v)<.33?"Low":Number(v)<.66?"Medium":"High";}
function displayName(player){return player?.cardName||player?.name||"Unknown card";}
function toPercent(value){return value==null?null:Number(value)*100;}
function formatCoins(value){if(value==null||!Number.isFinite(Number(value)))return"n/a";return new Intl.NumberFormat("en-GB").format(Math.round(value));}
function formatCount(value){if(value==null)return"0";return new Intl.NumberFormat("en-GB").format(value);}
function formatPercent(value){if(value==null||Number.isNaN(Number(value)))return"n/a";const n=Number(value);return`${n>0?"+":""}${n.toFixed(1)}%`;}
function formatRoi(value){return formatPercent(value);}
function newestTimestamp(items){return items.map((x)=>x?.updatedAt).filter(Boolean).sort().at(-1)||null;}
function formatRelativeTime(value){const date=new Date(value);if(Number.isNaN(date.getTime()))return"recently";const mins=Math.round((date-Date.now())/60000);const f=new Intl.RelativeTimeFormat("en-GB",{numeric:"auto"});if(Math.abs(mins)<60)return f.format(mins,"minute");const hours=Math.round(mins/60);if(Math.abs(hours)<48)return f.format(hours,"hour");return f.format(Math.round(hours/24),"day");}
