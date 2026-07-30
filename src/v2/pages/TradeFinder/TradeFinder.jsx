import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, RotateCcw, SlidersHorizontal } from "lucide-react";
import CoinValue from "../../components/CoinValue";
import EmptyState from "../../components/EmptyState";
import { useOpportunities } from "../../hooks/useRecommendationFeeds";
import { PageHead } from "../Players/Players";
import "./trade-finder.css";

const DEFAULTS = { maxBudget: "", minProfit: "", risk: "any", sort: "confidence" };
const RISK_RANK = { low: 1, medium: 2, high: 3, unknown: 4 };

export default function TradeFinder() {
  const query = useOpportunities({ limit: 50 });
  const [filters, setFilters] = useState(DEFAULTS);
  const items = (query.data?.items || []).map(normalise).filter(Boolean);

  const results = useMemo(() => {
    const maxBudget = numberOrNull(filters.maxBudget);
    const minProfit = numberOrNull(filters.minProfit);
    const maxRisk = filters.risk === "low" ? 1 : filters.risk === "medium" ? 2 : Infinity;
    return items
      .filter((item) => maxBudget === null || item.entry <= maxBudget)
      .filter((item) => minProfit === null || item.profit >= minProfit)
      .filter((item) => (RISK_RANK[item.risk.toLowerCase()] || 4) <= maxRisk)
      .sort((a, b) => {
        if (filters.sort === "profit") return b.profit - a.profit;
        if (filters.sort === "roi") return b.roi - a.roi;
        if (filters.sort === "price") return a.entry - b.entry;
        return b.confidence - a.confidence;
      });
  }, [items, filters]);

  const set = (key) => (event) => setFilters((current) => ({ ...current, [key]: event.target.value }));
  const filtersActive = Object.keys(DEFAULTS).some((key) => filters[key] !== DEFAULTS[key]);

  return <main className="v2-destination trade-finder-page">
    <PageHead eyebrow="TRADE FINDER" title="Find a move that fits you" copy="Set your coin budget and the return you want. We’ll only show current FutHub opportunities that match." />

    <section className="finder-controls" aria-label="Trade filters">
      <div className="finder-control">
        <label htmlFor="finder-budget">Maximum spend</label>
        <div className="finder-coin-input"><input id="finder-budget" inputMode="numeric" type="number" min="0" step="100" placeholder="Any budget" value={filters.maxBudget} onChange={set("maxBudget")}/></div>
        <small>The most you can pay for one card</small>
      </div>
      <div className="finder-control">
        <label htmlFor="finder-profit">Minimum profit</label>
        <div className="finder-coin-input"><input id="finder-profit" inputMode="numeric" type="number" min="0" step="100" placeholder="Any profit" value={filters.minProfit} onChange={set("minProfit")}/></div>
        <small>Expected coins after EA tax</small>
      </div>
      <div className="finder-control">
        <label htmlFor="finder-risk">Maximum risk</label>
        <select id="finder-risk" value={filters.risk} onChange={set("risk")}>
          <option value="any">Any risk</option>
          <option value="medium">Low or medium</option>
          <option value="low">Low only</option>
        </select>
        <small>How much uncertainty you’ll accept</small>
      </div>
      <div className="finder-control">
        <label htmlFor="finder-sort">Prioritise</label>
        <select id="finder-sort" value={filters.sort} onChange={set("sort")}>
          <option value="confidence">Best confidence</option>
          <option value="profit">Highest profit</option>
          <option value="roi">Highest return</option>
          <option value="price">Lowest price</option>
        </select>
        <small>How matching trades are ordered</small>
      </div>
    </section>

    <div className="finder-result-head">
      <div><SlidersHorizontal size={16}/><strong>{query.isLoading ? "Scanning opportunities…" : `${results.length} matching ${results.length === 1 ? "trade" : "trades"}`}</strong></div>
      {filtersActive ? <button onClick={() => setFilters(DEFAULTS)}><RotateCcw size={14}/> Reset filters</button> : null}
    </div>

    {query.isLoading ? <EmptyState icon={<SlidersHorizontal size={25}/>} text="Checking the latest calculated opportunities…" /> : query.isError ? <EmptyState icon={<SlidersHorizontal size={25}/>} error text="Trade Finder could not load the opportunity feed." action={<button onClick={() => query.refetch()}>Try again</button>} /> : results.length ? (
      <section className="finder-grid">
        {results.map((item) => <Link className="finder-card" key={item.cardId} to={`/v2/players/${item.cardId}`} state={{ from: "trade-finder" }}>
          <div className="finder-card-top">
            <img src={item.image || "/img/card-placeholder.png"} alt="" />
            <div><h2>{item.name}</h2><div className="v2-meta-pills"><span>{item.rating || "—"} OVR</span><span>{item.position || "—"}</span><span>{item.version || "Card"}</span></div><p>{item.reason}</p></div>
            <span className="finder-confidence">{item.confidence}%<small>CONFIDENCE</small></span>
          </div>
          <div className="finder-signals">
            <div className="entry"><span>BUY BELOW</span><CoinValue value={item.entry}/></div>
            <ArrowRight size={18}/>
            <div className="profit"><span>EXPECTED PROFIT</span><CoinValue value={item.profit} signed/><small>{signedPct(item.roi)} after tax</small></div>
          </div>
          <div className="finder-card-foot"><span className={`risk-${item.risk.toLowerCase()}`}>{item.risk} risk</span><span>View analysis <ArrowRight size={14}/></span></div>
        </Link>)}
      </section>
    ) : <EmptyState icon={<SlidersHorizontal size={25}/>} text="No current opportunities match those filters." action={<button onClick={() => setFilters(DEFAULTS)}>Clear filters</button>} />}
  </main>;
}

function normalise(raw) {
  if (!raw) return null;
  const player = raw.player || raw;
  const entry = Number(raw.entryPrice ?? raw.entry_price ?? raw.currentBin ?? raw.current_bin ?? 0);
  const roi = toPct(raw.netRoi?.likely ?? raw.expectedRoi ?? raw.likely_net_roi ?? raw.expected_roi_pct);
  return {
    cardId: raw.cardId ?? raw.card_id,
    name: player.nickname || player.cardName || player.card_name || player.displayName || player.name || "Unknown player",
    rating: player.rating,
    position: player.position,
    version: player.version,
    image: player.generatedCardUrl || player.generated_card_url || player.imageUrl || player.image_url,
    entry,
    roi,
    profit: Math.round(entry * roi / 100),
    risk: String(raw.risk || riskLabel(raw.score_risk)),
    confidence: Math.round(Number(raw.confidence ?? raw.score_confidence ?? 0)),
    reason: raw.reasoning || "Current price and completed sales support this move.",
  };
}
function numberOrNull(value) { const number = Number(value); return value === "" || !Number.isFinite(number) ? null : number; }
function toPct(value) { const number = Number(value); return !Number.isFinite(number) ? 0 : Math.abs(number) <= 1 ? number * 100 : number; }
function signedPct(value) { const number = Number(value); return `${number > 0 ? "+" : ""}${number.toFixed(1)}%`; }
function riskLabel(value) { const number = Number(value); return !Number.isFinite(number) ? "Unknown" : number >= 70 ? "High" : number >= 40 ? "Medium" : "Low"; }
