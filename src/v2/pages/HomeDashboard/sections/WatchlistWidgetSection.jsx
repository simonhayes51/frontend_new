// src/v2/pages/HomeDashboard/sections/WatchlistWidgetSection.jsx
import { Link } from "react-router-dom";
import SectionCard from "../../../components/SectionCard";
import CardArtThumb from "../../../components/CardArtThumb";
import { useWatchlist } from "../../../hooks/useWatchlist";
import { formatCoins, formatPct } from "../../../lib/format";

export default function WatchlistWidgetSection() {
  const { data, isLoading, error } = useWatchlist();

  if (error) {
    if (error?.response?.status === 401) {
      return (
        <SectionCard title="Your Watchlist">
          <p className="text-xs text-[var(--v2-muted)]">
            <Link to="/login" className="text-[var(--v2-accent)]">Log in</Link> to see your watchlist.
          </p>
        </SectionCard>
      );
    }
    // Any other error (500, network failure, etc.) must not silently look
    // like "no items yet" - that would hide a real outage from the user.
    return (
      <SectionCard title="Your Watchlist">
        <p className="text-xs text-[var(--v2-negative)]">Couldn't load your watchlist right now.</p>
      </SectionCard>
    );
  }

  const items = data?.items || [];

  return (
    <SectionCard title="Your Watchlist">
      {isLoading ? (
        <p className="text-xs text-[var(--v2-muted)]">Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-xs text-[var(--v2-muted)]">No cards on your watchlist yet.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-[var(--v2-border)]">
          {items.map((it) => (
            <li key={it.id} className="flex items-center gap-3 py-2 text-xs">
              <CardArtThumb card={it} widthClass="w-9" />
              <Link to={`/v2/players/${it.card_id}`} className="flex-1 min-w-0 truncate hover:text-[var(--v2-accent)]">
                {it.name || it.player_name}
              </Link>
              <span className="flex items-center gap-2 whitespace-nowrap">
                <span>{formatCoins(it.current_price)}</span>
                {it.change_pct !== null && it.change_pct !== undefined && (
                  <span
                    className={
                      it.change_pct >= 0 ? "text-[var(--v2-positive)]" : "text-[var(--v2-negative)]"
                    }
                  >
                    {formatPct(it.change_pct, { withSign: true })}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
