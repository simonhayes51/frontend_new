// src/pages/SquadBuilder.jsx
import React, { useEffect, useMemo, useState } from "react";

// ✅ Import the squad styles ONCE here (pages → ../styles)
import "../styles/squad.css";

import Pitch from "../components/squad/Pitch";
import { VERTICAL_COORDS } from "../components/squad/formations_vertical";
import { computeChemistry } from "../components/squad/chemistry";
import { searchPlayers } from "../api/squadApi";
import { isValidForSlot } from "../utils/positions";

export default function SquadBuilder() {
  const [formation, setFormation] = useState("4-3-3");
  const [placed, setPlaced] = useState({}); // { [slotKey]: player }
  const [selectedSlot, setSelectedSlot] = useState(null); // { key, pos }
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  // --- chemistry (recomputed when placed or formation changes) ---
  const chem = useMemo(() => {
    try {
      return computeChemistry(placed, VERTICAL_COORDS[formation]);
    } catch (e) {
      console.warn("chemistry error:", e);
      return { teamChem: 0, perPlayer: {}, tallies: {} };
    }
  }, [placed, formation]);

  // --- search (filters by selected slot position if any) ---
  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!query && !selectedSlot) {
        setResults([]);
        return;
      }
      try {
        const pos = selectedSlot?.pos || "";
        const list = await searchPlayers(query || "", { pos });
        if (!cancelled) setResults(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error("search error", e);
        if (!cancelled) setResults([]);
      }
    }

    run();
    return () => { cancelled = true; };
  }, [query, selectedSlot]);

  // --- actions ---
  const clearSquad = () => {
    setPlaced({});
    setSelectedSlot(null);
    setQuery("");
    setResults([]);
  };

  const placeInSelected = (player) => {
    if (!selectedSlot) return;
    setPlaced((prev) => ({ ...prev, [selectedSlot.key]: player }));
    setSelectedSlot(null);
    setQuery("");
    setResults([]);
  };

  const removeFromSlot = (slotKey) => {
    setPlaced((prev) => {
      const c = { ...prev };
      delete c[slotKey];
      return c;
    });
  };

  // --- render ---
  return (
    <div className="squad-grid gap-6 lg:grid-cols-[1fr_360px]">
      {/* Pitch & controls */}
      <div className="pitch-container">
        <Pitch
          formation={formation}
          coords={VERTICAL_COORDS[formation]}
          placed={placed}
          chem={chem}
          onSelectSlot={setSelectedSlot}
          onRemove={removeFromSlot}
        />

        <div className="mt-4 flex items-center gap-3">
          <select
            className="formation-select px-3 py-2 rounded-md text-sm"
            value={formation}
            onChange={(e) => {
              setFormation(e.target.value);
              // keep current selection but clear search results
              setResults([]);
            }}
          >
            {Object.keys(VERTICAL_COORDS).map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>

          <button
            className="enhanced-btn btn-green px-4 py-2 rounded-md text-sm"
            onClick={clearSquad}
          >
            Clear Squad
          </button>

          <div className="ml-auto text-xs opacity-80">
            Team Chem: <strong>{chem?.teamChem ?? 0}</strong>
          </div>
        </div>
      </div>

      {/* Search side panel */}
      <aside className="search-container">
        {selectedSlot ? (
          <>
            <div className="mb-2 text-sm opacity-80">
              Selected slot: <strong>{selectedSlot.pos}</strong>
            </div>
            <input
              className="search-input w-full px-3 py-2 rounded-md bg-gray-900/60 border border-gray-700 outline-none"
              type="text"
              placeholder={`Search for ${selectedSlot.pos}…`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            <div className="search-results custom-scrollbar mt-3 space-y-2 max-h-[520px] overflow-auto">
              {results.map((p) => {
                const valid = isValidForSlot(selectedSlot.pos, [
                  p.position,
                  ...(p.altposition ? p.altposition.split(/[;,| ]+/).map(s => s.trim()) : []),
                ]);
                return (
                  <div
                    key={p.card_id || p.id}
                    className={`search-item flex items-center gap-3 p-2 rounded-md bg-gray-900/40 border border-gray-800 cursor-pointer ${!valid ? "invalid" : ""}`}
                    onClick={() => valid && placeInSelected(p)}
                  >
                    <img
                      src={p.image_url}
                      alt={p.name}
                      className="search-thumb w-10 h-14 object-cover rounded"
                    />
                    <div className="search-info">
                      <div className="search-name font-semibold text-sm">{p.name}</div>
                      <div className="search-meta text-xs opacity-75">
                        {p.rating ?? "—"} · {p.position ?? "—"} · {p.club ?? "—"}
                      </div>
                    </div>
                    {p.price != null && (
                      <div className="ml-auto price">
                        <span className="coin" /> {p.price.toLocaleString()}c
                      </div>
                    )}
                  </div>
                );
              })}
              {!results.length && (
                <div className="text-xs opacity-60 py-6 text-center">
                  Start typing to search players…
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="search-placeholder text-sm opacity-75">
            Select a slot on the pitch to search for players.
          </div>
        )}
      </aside>
    </div>
  );
}