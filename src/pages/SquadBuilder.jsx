// src/pages/SquadBuilder.jsx
import React, { useEffect, useMemo, useState } from "react";
import "../styles/squad.css";
import Pitch from "../components/squad/Pitch";
import { VERTICAL_COORDS } from "../components/squad/formations_vertical";
import { computeChemistry } from "../components/squad/chemistry";
import { searchPlayers } from "../api/squadApi";
import { isValidForSlot } from "../utils/positions";
import ChemDebug from "../components/squad/ChemDebug";

export default function SquadBuilder() {
  const [formation, setFormation] = useState("4-3-3");
  const [placed, setPlaced] = useState({});
  const [searchResults, setSearchResults] = useState([]);
  const [query, setQuery] = useState("");
  const [selectedSlot, setSelectedSlot] = useState(null);

  // compute chem with placed + formation
  const chem = useMemo(() => {
    return computeChemistry(placed, VERTICAL_COORDS[formation]);
  }, [placed, formation]);

  // handle search
  useEffect(() => {
    const run = async () => {
      if (!query) {
        setSearchResults([]);
        return;
      }
      try {
        const pos = selectedSlot?.pos || null;
        const res = await searchPlayers(query, pos);
        setSearchResults(res.players || []);
      } catch (err) {
        console.error("Search error:", err);
        setSearchResults([]);
      }
    };
    run();
  }, [query, selectedSlot]);

  const handlePlace = (slotKey, player) => {
    setPlaced((prev) => ({ ...prev, [slotKey]: player }));
    setSelectedSlot(null);
    setQuery("");
    setSearchResults([]);
  };

  const handleRemove = (slotKey) => {
    setPlaced((prev) => {
      const copy = { ...prev };
      delete copy[slotKey];
      return copy;
    });
  };

  return (
    <div className="squad-grid">
      <div className="pitch-container">
        <Pitch
          formation={formation}
          placed={placed}
          chem={chem}
          selectedSlot={selectedSlot}
          onSelectSlot={setSelectedSlot}
          onRemove={handleRemove}
        />
        <div className="formation-select-container">
          <select
            className="formation-select"
            value={formation}
            onChange={(e) => setFormation(e.target.value)}
          >
            {Object.keys(VERTICAL_COORDS).map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
        <ChemDebug chem={chem} placed={placed} formation={formation} />
      </div>

      <div className="search-container">
        {selectedSlot ? (
          <>
            <input
              type="text"
              placeholder={`Search for ${selectedSlot.pos}...`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="search-input"
            />
            <div className="search-results custom-scrollbar">
              {searchResults.map((p) => {
                const valid = isValidForSlot(selectedSlot.pos, [
                  p.position,
                  ...(p.altposition ? p.altposition.split(/[;,| ]+/) : []),
                ]);
                return (
                  <div
                    key={p.card_id}
                    className={`search-item ${!valid ? "invalid" : ""}`}
                    onClick={() => valid && handlePlace(selectedSlot.key, p)}
                  >
                    <img
                      src={p.image_url}
                      alt={p.name}
                      className="search-thumb"
                    />
                    <div className="search-info">
                      <div className="search-name">{p.name}</div>
                      <div className="search-meta">
                        {p.rating} · {p.position} · {p.club}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="search-placeholder">
            Select a slot to search for players
          </div>
        )}
      </div>
    </div>
  );
}