import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, Users } from "lucide-react";
import CoinValue from "../../components/CoinValue";
import "../../styles/v2-destinations.css";

const API_BASE = import.meta.env.VITE_API_URL || "";

export default function Players() {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get("q") || "");
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const search = query.trim();
    if (search.length < 2) {
      setPlayers([]);
      setError("");
      return undefined;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const normalised = search.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        const response = await fetch(`${API_BASE}/api/search-players?q=${encodeURIComponent(search)}&q_norm=${encodeURIComponent(normalised)}`, {
          credentials: "include",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = await response.json();
        setPlayers(payload.players || []);
        setParams(search ? { q: search } : {}, { replace: true });
      } catch (requestError) {
        if (requestError.name !== "AbortError") setError("Player search is unavailable right now.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, setParams]);

  return (
    <main className="v2-destination">
      <PageHead eyebrow="PLAYER DATABASE" title="Find any card" copy="Search by player name, then open the live v2 market analysis." />
      <label className="v2-search-box">
        <Search size={20} />
        <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a player…" />
      </label>
      {loading ? <State text="Searching cards…" /> : error ? <State text={error} error /> : query.trim().length < 2 ? <State icon={<Users />} text="Type at least two letters to search." /> : players.length ? (
        <section className="v2-player-grid">
          {players.map((player) => {
            const cardId = player.card_id || player.id;
            const price = player.price_num ?? player.price ?? player.current_price;
            return (
              <Link className="v2-player-result" key={cardId} to={`/v2/players/${cardId}`}>
                <img src={player.generated_card_url || player.image_url || "/img/card-placeholder.png"} alt="" />
                <div><span>{player.rating || "—"} {player.position || ""}</span><strong>{player.nickname || player.card_name || player.name}</strong><small>{player.version || "Card"}</small></div>
                <CoinValue value={price} />
              </Link>
            );
          })}
        </section>
      ) : <State text={`No cards found for “${query.trim()}”.`} />}
    </main>
  );
}

export function PageHead({ eyebrow, title, copy, action }) {
  return <header className="v2-page-head"><div><span>{eyebrow}</span><h1>{title}</h1><p>{copy}</p></div>{action}</header>;
}
function State({ icon, text, error }) { return <div className={`v2-page-state ${error ? "error" : ""}`}>{icon}<p>{text}</p></div>; }
