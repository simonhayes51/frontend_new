// src/components/PlayerSearch.jsx
import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import { Search, TrendingUp, TrendingDown, Minus, Loader2, Target } from "lucide-react";
import PriceTrendChart from "./PriceTrendChart.jsx"; // ← the chart

const API_BASE = import.meta.env.VITE_API_URL || "";
const buildProxy = (url) => `${API_BASE}/img?url=${encodeURIComponent(url)}`;

const PLACEHOLDER = "/img/card-placeholder.png";

// ------- backend helpers -------
const searchPlayers = async (query) => {
  if (!query.trim()) return [];
  try {
    const r = await fetch(`${API_BASE}/api/search-players?q=${encodeURIComponent(query)}`, {
      credentials: "include",
    });
    if (!r.ok) return [];
    const data = await r.json();
    return data.players || [];
  } catch (e) {
    console.error("Search failed:", e);
    return [];
  }
};

// ================== SearchBox ==================
const SearchBox = ({ onPlayerSelect }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!query.trim()) {
        setResults([]);
        setShowResults(false);
        return;
      }
      setLoading(true);
      const players = await searchPlayers(query);
      setResults(players);
      setLoading(false);
      setShowResults(true);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div className="relative w-full max-w-md mx-auto">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 animate-spin" />
        )}
        <input
          type="text"
          placeholder="Search players (e.g. Messi, Mbappé)..."
          className="w-full pl-10 pr-4 py-3 bg-[#1e293b]/80 border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none text-lg text-white placeholder-gray-400 backdrop-blur-sm"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowResults(true)}
        />
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute z-10 w-full mt-2 bg-[#1e293b]/95 backdrop-blur-md border border-gray-600 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {results.map((player) => (
            <button
              key={`${player.card_id}-${player.rating}`}
              className="w-full px-4 py-3 text-left hover:bg-[#334155]/80 border-b border-gray-700 last:border-b-0 focus:outline-none focus:bg-blue-500/20"
              onClick={() => {
                onPlayerSelect(player);
                setShowResults(false);
                setQuery("");
              }}
            >
              <div className="flex items-center gap-3">
                <img
                  src={player.image_url || PLACEHOLDER}
                  alt={`${player.name} (${player.rating})`}
                  loading="lazy"
                  className="w-12 h-16 object-contain"
                  onError={(e) => {
                    const img = e.currentTarget;
                    if (!img.dataset.triedProxy && player.image_url) {
                      img.dataset.triedProxy = "1";
                      img.src = buildProxy(player.image_url);
                    } else {
                      img.src = PLACEHOLDER;
                    }
                  }}
                  referrerPolicy="no-referrer"
                />
                <div className="font-semibold text-white truncate">
                  {player.name} ({player.rating})
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {showResults && !loading && query && results.length === 0 && (
        <div className="absolute z-10 w-full mt-2 bg-[#1e293b]/95 border border-gray-600 rounded-lg shadow-lg p-4 text-center text-gray-400">
          No players found for "{query}"
        </div>
      )}
    </div>
  );
};

// ================== Main ==================
export default function PlayerSearch() {
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  return (
    <div className="min-h-screen relative text-white">
      {/* Background stadium */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('/img/football-stadium-night.jpg')",
        }}
      ></div>

      {/* Purple overlay */}
      <div className="absolute inset-0 bg-purple-900/70"></div>

      {/* Content */}
      <div className="relative z-10 p-6">
        <div className="container mx-auto">
          {!selectedPlayer ? (
            <div className="text-center py-20">
              <h1 className="text-4xl font-bold text-white mb-8">Player Search</h1>
              <SearchBox onPlayerSelect={setSelectedPlayer} />
              <p className="text-gray-200 mt-4">
                Search by player name to view live market data and detailed stats
              </p>
            </div>
          ) : (
            <div className="bg-[#0f172a]/80 backdrop-blur-md rounded-xl p-6">
              {/* Replace with your existing <PlayerDetail /> if needed */}
              <h2 className="text-2xl font-bold">{selectedPlayer.name} ({selectedPlayer.rating})</h2>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
