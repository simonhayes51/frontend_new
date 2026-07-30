import { Link } from "react-router-dom";
import { ArrowRight, RefreshCw, Star, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { deleteWatch, refreshWatch } from "../../../api/watchlist";
import CoinValue from "../../components/CoinValue";
import EmptyState from "../../components/EmptyState";
import { useWatchlist } from "../../hooks/useWatchlist";
import { PageHead } from "../Players/Players";
import "../../styles/v2-destinations.css";

export default function Watchlist() {
  const queryClient = useQueryClient();
  const query = useWatchlist();
  const items = Array.isArray(query.data) ? query.data : query.data?.items || [];
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["v2", "watchlist"] });
  async function remove(id) { await deleteWatch(id); refresh(); }
  async function update(id) { await refreshWatch(id); refresh(); }

  return (
    <main className="v2-destination">
      <PageHead eyebrow="YOUR WATCHLIST" title="Cards you’re tracking" copy="Live prices and movement for the cards you care about." action={<Link className="v2-primary-link" to="/v2/players">Add a player</Link>} />
      {query.isLoading ? <EmptyState icon={<Star size={28} />} text="Loading watchlist…" /> : query.error?.response?.status === 401 ? <EmptyState icon={<Star size={28} />} text="Sign in to view your watchlist." action={<Link to="/login">Sign in</Link>} /> : query.isError ? <EmptyState icon={<Star size={28} />} error text="Your watchlist could not be loaded." action={<button onClick={() => query.refetch()}>Try again</button>} /> : items.length ? (
        <section className="v2-watch-grid">
          {items.map((item) => (
            <article className="v2-watch-card" key={item.id}>
              <div className="v2-watch-top"><Star size={17} fill="currentColor"/><span>WATCHING</span><small>{String(item.platform || "ps").toUpperCase()}</small></div>
              <Link className="v2-watch-identity" to={`/v2/players/${item.card_id}`}>
                <img src={item.generated_card_url || item.image_url || "/img/card-placeholder.png"} alt="" />
                <div><h2>{item.player_name}</h2><div className="v2-meta-pills"><span>{item.rating || "—"} OVR</span><span>{item.version || "Card"}</span></div></div>
                <ArrowRight size={18}/>
              </Link>
              <div className="v2-watch-values">
                <div><span>NOW</span><CoinValue value={item.current_price} /></div>
                <div><span>WHEN ADDED</span><CoinValue value={item.started_price} /></div>
              </div>
              <div className="v2-watch-change"><span>Movement since added</span><b className={Number(item.change) >= 0 ? "positive" : "negative"}>{Number(item.change_pct) > 0 ? "+" : ""}{Number(item.change_pct || 0).toFixed(1)}%</b></div>
              <div className="v2-watch-actions"><button onClick={() => update(item.id)}><RefreshCw size={15} /> Refresh</button><button className="danger" onClick={() => remove(item.id)}><Trash2 size={15} /> Remove</button></div>
            </article>
          ))}
        </section>
      ) : <EmptyState icon={<Star size={28} />} text="Your watchlist is empty." action={<Link to="/v2/players">Find a player</Link>} />}
    </main>
  );
}
