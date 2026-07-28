// src/v2/pages/HomeDashboard/HomeDashboard.jsx
//
// Literal port of the user-supplied reference implementation
// (App.tsx/styles.css) - a terminal-style AI market-intelligence
// dashboard. Wired to the real GET /api/v2/dashboard endpoint instead
// of the reference's illustrative fallbackDashboard(), with one
// additive change the reference's simpler contract doesn't model:
// `data.locked.opportunityFeed` renders an upgrade upsell in place of
// the gated sections instead of the reference's "no grounded signal"
// empty-state copy, which would otherwise misrepresent a paywall as
// "no live data." Every other panel (Risk/Invalidation, Content
// Countdown, Recent AI Changes, Yesterday's Calls, Historical
// Evidence's n/a stats) matches the reference's own honest-empty
// treatment for panels with no real backing data source yet.
import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bell,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  Code2,
  Command,
  Crown,
  Home,
  LineChart,
  Radio,
  Search,
  Sparkles,
  Star,
  TrendingDown,
  TrendingUp,
  User,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useDashboard } from "../../hooks/useDashboard";
import { useLiveCardLayers } from "../../hooks/useLiveCardLayers";
import { useEntitlements } from "../../../context/EntitlementsContext";
import PlayerCardArt from "../../../components/PlayerCardArt";
import "../../styles/terminal.css";

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

export default function HomeDashboard() {
  const { data, isLoading, isError } = useDashboard();
  const { isPremium, isAdmin, features } = useEntitlements();
  const navigate = useNavigate();
  const dashboard = data ?? EMPTY_DASHBOARD;
  const status = isLoading ? "loading" : isError ? "fallback" : "live";
  const locked = !!dashboard.locked?.opportunityFeed;
  const tierLabel = isAdmin || features.includes("opportunity_feed") ? "ELITE" : isPremium ? "PRO" : "FREE";

  const recommendations = useMemo(() => {
    const merged = [
      ...dashboard.todaysOpportunities,
      ...dashboard.highConfidenceInvestments,
      ...dashboard.cardsToAvoid,
      ...dashboard.recentAiPredictions,
    ];
    const unique = new Map();
    merged.forEach((item) => unique.set(item.cardId, item));
    return [...unique.values()];
  }, [dashboard]);

  const buyRaw = pickRecommendation(recommendations, "BUY");
  const wait = pickRecommendation(recommendations, "WAIT");
  const sell = pickRecommendation(recommendations, "SELL") ?? pickRecommendation(recommendations, "AVOID");
  const fallbackSelected = buyRaw ?? recommendations[0] ?? null;

  // card_bg_image/card_cutout_image are only populated by a backfill
  // worker that's never actually been scheduled (see the hook's own
  // comment), so they're null for nearly every card today. Fetching the
  // same live layers v1's Player Search already uses is only safe for
  // the ONE featured/selected card here, not every card in a list - so
  // only `buy`/`selected` (which are the same card whenever a buy signal
  // exists) get the live-fetched art; `wait`/`sell` keep the existing
  // fallback-photo treatment.
  const { data: liveLayers } = useLiveCardLayers(fallbackSelected?.cardId);
  const enrichWithLiveArt = (item) => {
    if (!item || !liveLayers?.bgImageUrl || item.cardId !== fallbackSelected?.cardId) return item;
    return {
      ...item,
      player: {
        ...item.player,
        cardBgImage: liveLayers.bgImageUrl,
        cardCutoutImage: liveLayers.cutoutImageUrl,
        cardCutoutType: liveLayers.cutoutType || item.player.cardCutoutType,
        cardName: liveLayers.cardName || item.player.cardName,
      },
    };
  };
  const buy = enrichWithLiveArt(buyRaw);
  const selected = enrichWithLiveArt(fallbackSelected);
  const confidence = selected ? Math.round(selected.confidence) : 0;
  const investment = selected ? Math.round(selected.scores?.investment ?? selected.scores?.opportunity ?? selected.confidence) : 0;
  const expectedRoi = !selected || selected.expectedRoi === null || selected.expectedRoi === undefined
    ? "Unavailable"
    : `${selected.expectedRoi > 0 ? "+" : ""}${selected.expectedRoi}%`;
  const historicalMatches = selected?.historicalSimilarEvents?.length ?? 0;
  const liveMovers = dashboard.biggestMovers.length ? dashboard.biggestMovers : recommendations;

  return (
    <div className="terminal-shell">
      <aside className="sidebar" aria-label="Navigation">
        <Link className="brand-lockup" to="/v2" aria-label="FC27 Intelligence home">
          <span className="brand-mark"><Command size={19} /></span>
          <strong>FC27 Intelligence</strong>
        </Link>
        <nav className="nav-list">
          <NavItem icon={<Home size={18} />} label="Home" to="/v2" active />
          <NavItem icon={<Activity size={18} />} label="Signals" to="/v2" />
          <NavItem icon={<Users size={18} />} label="Players" to="/player-search" />
          <NavItem icon={<BarChart3 size={18} />} label="Market" to="/trending" />
          <NavItem icon={<Star size={18} />} label="Watchlist" to="/watchlist" />
          <NavItem icon={<Bell size={18} />} label="Alerts" to="/watchlist" badge={dashboard.watchlistAlerts.length ? String(dashboard.watchlistAlerts.length) : undefined} />
          <NavItem icon={<Briefcase size={18} />} label="Portfolio" to="/trades" />
          <NavItem icon={<Code2 size={18} />} label="API" to="/v2" />
        </nav>
        {tierLabel !== "ELITE" ? (
          <div className="upgrade-panel">
            <span><Crown size={15} /> {tierLabel === "FREE" ? "Free Plan" : `${tierLabel} Plan`}</span>
            <p>Unlock all of today&apos;s picks, cards to avoid, and AI predictions.</p>
            <button type="button" onClick={() => navigate("/billing")}>Upgrade Now</button>
          </div>
        ) : null}
      </aside>

      <main className="workspace" id="home">
        <header className="topbar">
          <div className="command-center">
            <Search size={18} />
            <span><strong>AI Command</strong> Ask: what should I do with 500k coins today?</span>
            <kbd>Ctrl K</kbd>
          </div>
          <div className="operator-cluster">
            <div className={`live-status ${status}`}>
              <span />
              <div>
                <strong>{status === "live" ? "Live Data" : status === "loading" ? "Reading Market" : "Preview Data"}</strong>
                <small>Updated from real sales data</small>
              </div>
            </div>
            <button className="icon-button" type="button" aria-label="Alerts">
              <Bell size={18} />
              <span>{dashboard.watchlistAlerts.length}</span>
            </button>
            <div className="profile-chip"><User size={15} /> {isPremium || isAdmin ? "You" : "Guest"} <em>{tierLabel}</em></div>
          </div>
        </header>

        <div className="terminal-grid">
          <section className="main-column">
            <section className="morning-brief-panel" aria-label="AI morning brief">
              <div className="market-regime-read">
                <span>Current Market State</span>
                <strong>{dashboard.marketRegime.label}</strong>
                <p>{dashboard.marketRegime.summary}</p>
              </div>
              <div className="brief-copy">
                <span><Sparkles size={15} /> AI Morning Brief</span>
                <p>
                  {selected
                    ? `Good morning! Our AI thinks ${displayName(selected.player)} is today's best pick, based on real prices and sales. ${selected.reasoning}`
                    : "Good morning! We don't have enough live data yet to make a solid pick."}
                </p>
              </div>
              <div className="brief-stat">
                <small>Data mode</small>
                <strong>{status === "live" ? "Live" : status === "loading" ? "Loading" : "Limited"}</strong>
                <em>{recommendations.length} signals</em>
              </div>
            </section>

            <section className="opportunity-strip" aria-labelledby="best-opportunities">
              <div className="section-heading">
                <div>
                  <span><Sparkles size={16} /> Today&apos;s Best Opportunities</span>
                  <h1 id="best-opportunities">Our AI tells you what to do. The card is just proof.</h1>
                </div>
                <button type="button">View all opportunities <ArrowRight size={16} /></button>
              </div>
              {locked ? (
                <LockedOpportunityStrip />
              ) : (
                <div className="opportunity-cards">
                  {buy ? <OpportunityCard item={buy} rank={1} accent="buy" /> : <EmptyOpportunity action="BUY" />}
                  {wait ? <OpportunityCard item={wait} rank={2} accent="wait" /> : <EmptyOpportunity action="WAIT" />}
                  {sell ? <OpportunityCard item={sell} rank={3} accent="sell" /> : <EmptyOpportunity action="SELL" />}
                </div>
              )}
            </section>

            <section className="analysis-board" aria-labelledby="player-analysis">
              <div className="analysis-header">
                <span><LineChart size={17} /> Player Breakdown</span>
                <div className="analysis-actions">
                  <button type="button"><Star size={15} /> Add to watchlist</button>
                  <button type="button" aria-label="Share"><Radio size={15} /></button>
                </div>
              </div>

              {locked ? (
                <div className="decision-empty">
                  <strong>Opportunity feed is a Pro feature</strong>
                  <p>Upgrade to unlock the Player Breakdown, today&apos;s picks, cards to avoid and recent AI predictions.</p>
                  <button type="button" onClick={() => navigate("/billing")}>Upgrade Now</button>
                </div>
              ) : selected ? (
              <>
              <div className="asset-grid">
                <PlayerCard recommendation={selected} featured />
                <div className="asset-thesis">
                  <p className="asset-kicker">{selected.player.version ?? "FC Card"}</p>
                  <h2 id="player-analysis">{displayName(selected.player)}</h2>
                  <p className="decision-summary">{selected.reasoning}</p>
                  <div className="decision-matrix">
                    <DecisionMetric label="Our Call" value={selected.recommendation} tone="buy" />
                    <DecisionMetric label="Confidence" value={`${confidence}%`} ring={confidence} />
                    <DecisionMetric label="Expected Profit" value={expectedRoi} tone={selected.expectedRoi && selected.expectedRoi < 0 ? "sell" : "buy"} />
                    <DecisionMetric label="How Long to Hold" value={selected.holdingPeriod} />
                  </div>
                  <div className="decision-proof-row">
                    <span>{selected.updatedAt ? `Updated ${formatDateTime(selected.updatedAt)}` : "Update time unavailable"}</span>
                    <span>{DATA_QUALITY_LABEL[selected.dataQuality] ?? "Unknown data"}</span>
                    <span>{historicalMatches ? `${historicalMatches} similar past situations` : "No similar situations yet"}</span>
                    <span>{investment}/100 pick strength</span>
                  </div>
                  <div className="market-facts">
                    <Fact label="Current BIN" value={formatCoins(selected.currentBin)} detail="Buy Now price right now" />
                    <Fact label="Fair Value" value={formatCoins(selected.fairValue)} detail="typical recent price" />
                    <Fact label="Sales 24h" value={formatCount(selected.sales24h)} detail="completed sales" />
                    <Fact label="Sales 7d" value={formatCount(selected.sales7d)} detail="completed sales" />
                    <Fact label="Data Quality" value={DATA_QUALITY_LABEL[selected.dataQuality] ?? "Unknown"} detail="how much we trust this" good={selected.dataQuality === "GOOD"} />
                  </div>
                </div>
              </div>

              <div className="evidence-priority">
                <EvidencePanel
                  title="Why Now?"
                  items={[
                    "Cards are selling much faster than they're being listed.",
                    "Buyers are snapping these up instead of waiting for a cheaper price.",
                    ...((selected.marketDrivers || []).length ? selected.marketDrivers : ["We don't have more reasons for this card yet."]),
                    historicalMatches ? "We've seen this happen before with similar cards." : "We haven't matched this to past situations yet.",
                  ]}
                />
                <div className="history-panel accountability-panel">
                  <h3>Past Results</h3>
                  <p>{historicalMatches ? `We found ${historicalMatches} similar situations in the past.` : "Not enough past data yet."}</p>
                  <div>
                    <span>Average Profit <strong>n/a</strong></span>
                    <span>Win Rate <strong>n/a</strong></span>
                    <span>Avg. Hold <strong>n/a</strong></span>
                  </div>
                </div>
              </div>

              <div className="analysis-lower">
                <div className="price-module">
                  <div className="time-tabs">
                    {["1H", "24H", "7D", "30D", "90D", "All"].map((tab) => (
                      <button className={tab === "7D" ? "active" : ""} type="button" key={tab}>{tab}</button>
                    ))}
                  </div>
                  <ResponsiveContainer width="100%" height={222}>
                    <AreaChart data={[]} margin={{ top: 10, right: 14, left: -16, bottom: 0 }}>
                      <defs>
                        <linearGradient id="priceGlow" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#67e85f" stopOpacity={0.42} />
                          <stop offset="100%" stopColor="#67e85f" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="rgba(255,255,255,.055)" vertical={false} />
                      <XAxis dataKey="time" tickLine={false} axisLine={false} tick={{ fill: "#8e98a8", fontSize: 11 }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fill: "#8e98a8", fontSize: 11 }} tickFormatter={(value) => `${value}K`} />
                      <Tooltip contentStyle={{ background: "#080c11", border: "1px solid #253041", borderRadius: 8 }} />
                      <Area type="monotone" dataKey="price" stroke="#67e85f" strokeWidth={2.5} fill="url(#priceGlow)" />
                    </AreaChart>
                  </ResponsiveContainer>
                  <p className="empty-rail" style={{ marginTop: "-1rem" }}>
                    Full price history is on this card&apos;s Player Page.
                  </p>
                </div>

                <div className="evidence-stack">
                  <div className="raw-context-panel">
                    <h3>Extra Details</h3>
                    <p>Just background info - you don&apos;t need this to make your decision.</p>
                    {(selected.marketDrivers || []).slice(0, 3).map((driver) => <span key={driver}>{driver}</span>)}
                  </div>
                </div>
              </div>
              </>
              ) : (
                <div className="decision-empty">
                  <strong>No pick yet</strong>
                  <p>We don&apos;t have enough live data yet to break down a card. Try searching for a player instead.</p>
                </div>
              )}
            </section>

            <section className="movers-row" aria-label="Top movers">
              <div className="row-title">Top Movers <small>24h</small></div>
              {(liveMovers.length ? liveMovers.slice(0, 5) : []).map((item, i) => (
                <Link className="mover" key={`${item.cardId}-${i}`} to={`/v2/players/${item.cardId}`}>
                  <Avatar player={item.player} />
                  <div>
                    <strong>{displayName(item.player)}</strong>
                    <span>{item.player.version ?? "Card"}</span>
                  </div>
                  <em>{item.expectedRoi === null || item.expectedRoi === undefined ? "n/a" : `${item.expectedRoi > 0 ? "+" : ""}${item.expectedRoi}%`}</em>
                  <small>{formatCoins(item.currentBin)}</small>
                </Link>
              ))}
              {!liveMovers.length ? <div className="mover-empty">No mover data yet.</div> : null}
            </section>
          </section>

          <aside className="intelligence-rail" aria-label="Live intelligence">
            <RailPanel title="Live Alerts" action="View all">
              {dashboard.watchlistAlerts.map((alert) => (
                <AlertRow key={`${alert.title}-${alert.message}`} tone="market" title={alert.title} asset={alert.severity.toUpperCase()} meta={alert.message} time="timestamp unavailable" />
              ))}
              {!dashboard.watchlistAlerts.length ? <EmptyRail text="No alerts set up yet." /> : null}
            </RailPanel>

            <RailPanel title="Market Mood">
              <div className="state-module">
                <ConfidenceRing value={Math.round(dashboard.marketRegime.confidence || 0)} compact />
                <div>
                  <strong>{dashboard.marketRegime.label}</strong>
                  <p>{dashboard.marketRegime.summary || "Not enough data yet to read the market."}</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={74}>
                <AreaChart data={[]} margin={{ left: 0, right: 0, top: 8, bottom: 0 }}>
                  <Area type="monotone" dataKey="price" stroke="#67e85f" strokeWidth={2} fill="rgba(103,232,95,.12)" />
                </AreaChart>
              </ResponsiveContainer>
              <div className="rail-comparison"><span>Cards being tracked</span><strong>{dashboard.marketRegime.metrics.liquidCards}</strong></div>
            </RailPanel>

            <RailPanel title="What Could Go Wrong" danger>
              <ul className="risk-list">
                <li>People stop buying before the busiest hours.</li>
                <li>More copies get listed than are actually selling.</li>
                <li>The price catches up before you can sell.</li>
                <li>New content means fewer people need this card.</li>
              </ul>
            </RailPanel>

            <RailPanel title="Content Countdown">
              <div className="countdown-module">
                <strong>n/a</strong>
                <p>We don&apos;t have the content schedule connected yet.</p>
              </div>
            </RailPanel>

            <RailPanel title="Recent AI Changes">
              <div className="ai-change-list">
                <p>We're not tracking pick changes over time yet.</p>
              </div>
            </RailPanel>

            <RailPanel title="Yesterday's Calls">
              <div className="accountability-list">
                <EmptyRail text="We need to track results first before we can show this." />
              </div>
            </RailPanel>
          </aside>
        </div>

        <p className="disclaimer">Nothing here is guaranteed - prices change fast and data may be a little delayed.</p>
      </main>
    </div>
  );
}

function LockedOpportunityStrip() {
  return (
    <div className="opportunity-cards">
      <article className="op-card empty">
        <div className="op-content">
          <span>PRO</span>
          <strong>Today&apos;s picks are locked</strong>
          <small>Upgrade to unlock today&apos;s BUY, WAIT and AVOID picks, with the reasons why.</small>
          <div className="signal-foot">
            <Link to="/billing"><b>Upgrade Now</b></Link>
          </div>
        </div>
      </article>
    </div>
  );
}

function pickRecommendation(items, action) {
  return items.find((item) => item.recommendation === action);
}

// futbin's own card art prints a shorter display name than a player's
// full legal name (e.g. "Mikel Merino" rather than "Mikel Merino
// Zazón") - cardName is parsed straight off that card art (see
// dashboard.py's _to_recommendation / useLiveCardLayers), so prefer it
// everywhere a name is shown, falling back to the full name only for
// cards that don't have it yet.
function displayName(player) {
  return player?.cardName || player?.name || "";
}

// GOOD/SUSPECT/LIMITED are internal backend status codes - translate to
// plain language rather than showing them raw to a young FUT-trading
// audience with no financial-trading background.
const DATA_QUALITY_LABEL = { GOOD: "Reliable", SUSPECT: "Unusual pricing", LIMITED: "Limited data" };

// The reference's own hrefs were same-page anchors (`#signals` etc.),
// which meant nothing in that standalone app but is a real bug once
// mounted under this app's HashRouter: `#signals` becomes the entire
// route (pathname "signals", no leading slash), which matches no
// route and 404s. Routes to real destinations - falling back to /v2
// itself for the ones with no dedicated page yet - rather than
// reproducing that broken pattern.
function NavItem({ icon, label, active, badge, to }) {
  return (
    <Link className={`nav-item ${active ? "active" : ""}`} to={to}>
      {icon}
      <span>{label}</span>
      {badge ? <em>{badge}</em> : null}
    </Link>
  );
}

function OpportunityCard({ item, rank, accent }) {
  const roi = item.expectedRoi === null || item.expectedRoi === undefined ? "--" : `${item.expectedRoi > 0 ? "+" : ""}${item.expectedRoi}%`;
  const action = accent === "sell" ? "SELL" : item.recommendation;
  const signalStrength = Math.round(item.scores?.investment ?? item.scores?.opportunity ?? item.confidence);

  return (
    <Link className={`op-card ${accent}`} to={`/v2/players/${item.cardId}`}>
      <div className="rank-pill">#{rank}</div>
      <PlayerCard recommendation={item} />
      <div className="op-content">
        <span>{action}</span>
        <strong>{displayName(item.player)}</strong>
        <small>{plainReason(item, accent)}</small>
        <div className="op-stats-grid">
          <div>
            <p>Confidence</p>
            <em>{Math.round(item.confidence)}%</em>
          </div>
          <div>
            <p>Expected Profit</p>
            <em>{roi}</em>
          </div>
          <div>
            <p>Hold</p>
            <em>{accent === "wait" ? "Wait" : item.holdingPeriod}</em>
          </div>
          <div>
            <p>Risk</p>
            <em>{item.risk}</em>
          </div>
        </div>
        <div className="signal-foot">
          <b>{signalStrength}/100 strength</b>
          <b>{item.updatedAt ? formatDateTime(item.updatedAt) : "Updated recently"}</b>
          <b>{item.historicalSimilarEvents?.length ?? 0} matches</b>
        </div>
      </div>
      <ConfidenceRing value={Math.round(item.confidence)} />
      <button type="button" aria-label={`View ${displayName(item.player)}`}>
        <ChevronRight size={18} />
      </button>
    </Link>
  );
}

function EmptyOpportunity({ action }) {
  return (
    <article className="op-card empty">
      <div className="op-content">
        <span>{action}</span>
        <strong>No pick right now</strong>
        <small>We don&apos;t have a solid {action.toLowerCase()} pick today.</small>
        <div className="signal-foot">
          <b>Live data only</b>
        </div>
      </div>
    </article>
  );
}

function plainReason(item, accent) {
  if (accent === "buy") return "Cards are selling faster than they're being listed.";
  if (accent === "wait") return "People want this card, but the price hasn't settled yet.";
  if (item.recommendation === "AVOID") return "The gap between buy and sell price is too big right now.";
  return "More people are trying to sell this than are buying it.";
}

function EmptyRail({ text }) {
  return <p className="empty-rail">{text}</p>;
}

function formatCoins(value) {
  if (value === null || value === undefined) return "Unavailable";
  return new Intl.NumberFormat("en-GB").format(Math.round(value));
}

function formatCount(value) {
  if (value === null || value === undefined) return "Unavailable";
  return new Intl.NumberFormat("en-GB").format(value);
}

function formatDateTime(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" });
}

// Full (non-compact) PlayerCardArt - the same bg+cutout+name+6-stat
// overlay Player Search/Compare already render - rather than the
// compact rating-chip-only mode: the whole point raised was that the
// card itself should carry the name/stats, not just a badge next to a
// photo. The featured card (~176px) has room for the full 6-stat grid;
// the mini opportunity cards (~128px, 3 side by side) don't - the stat
// grid's fixed text sizes turn into an illegible smear at that width, so
// those keep rating/position/name only (showStats=false).
function PlayerCard({ recommendation, featured }) {
  const player = recommendation.player;
  return (
    <div className={`player-card-art ${featured ? "featured" : ""}`}>
      <PlayerCardArt
        bgImage={player.cardBgImage}
        cutoutImage={player.cardCutoutImage}
        cutoutType={player.cardCutoutType || "special"}
        fallbackImage={player.imageUrl}
        rating={player.rating}
        position={player.position || player.version?.split(" - ")[0]}
        name={displayName(player)}
        altText={displayName(player)}
        stats={player.stats}
        nationImage={player.nationImage}
        leagueImage={player.leagueImage}
        clubImage={player.clubImage}
        showStats={!!featured}
        widthClass={featured ? "w-44" : "w-32"}
      />
    </div>
  );
}

function ConfidenceRing({ value, compact }) {
  const style = { "--ring": `${Math.max(0, Math.min(100, value)) * 3.6}deg` };
  return (
    <div className={`confidence-ring ${compact ? "compact" : ""}`} style={style}>
      <strong>{value}</strong>
      {!compact ? <span>%</span> : null}
    </div>
  );
}

function DecisionMetric({ label, value, tone, ring }) {
  return (
    <div className={`decision-metric ${tone ?? ""}`}>
      <span>{label}</span>
      {ring ? (
        <div className="metric-ring-row">
          <ConfidenceRing value={ring} compact />
          <strong>{value}</strong>
        </div>
      ) : (
        <strong>{value}</strong>
      )}
    </div>
  );
}

function Fact({ label, value, detail, good }) {
  return (
    <div className="fact-cell">
      <span>{label}</span>
      <strong>{value}</strong>
      <em className={good ? "good" : ""}>{detail}</em>
    </div>
  );
}

function EvidencePanel({ title, items }) {
  return (
    <div className="evidence-panel">
      <h3>{title}</h3>
      {items.map((item) => (
        <p key={item}><CheckCircle2 size={14} /> {item}</p>
      ))}
    </div>
  );
}

function RailPanel({ title, action, danger, children }) {
  return (
    <section className={`rail-panel ${danger ? "danger" : ""}`}>
      <header>
        <h2>{title}</h2>
        {action ? <button type="button">{action}</button> : null}
      </header>
      {children}
    </section>
  );
}

function AlertRow({ tone, title, asset, meta, time }) {
  const icon = tone === "sell" ? <TrendingDown size={14} /> : tone === "market" ? <LineChart size={14} /> : <TrendingUp size={14} />;
  return (
    <button className={`alert-row ${tone}`} type="button">
      <span className="alert-label">{icon}{title}</span>
      <time>{time}</time>
      <strong>{asset}</strong>
      <p>{meta}</p>
      <ChevronRight size={18} />
    </button>
  );
}

function Avatar({ player }) {
  return (
    <span className="avatar">
      <PlayerCardArt
        compact
        bgImage={player.cardBgImage}
        cutoutImage={player.cardCutoutImage}
        cutoutType={player.cardCutoutType || "special"}
        fallbackImage={player.imageUrl}
        rating={player.rating}
        altText={player.cardName || player.name}
        widthClass="w-10"
      />
    </span>
  );
}
