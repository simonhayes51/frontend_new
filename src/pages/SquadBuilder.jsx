// src/pages/SquadBuilder.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import "../styles/squad.css";

import Pitch from "../components/squad/Pitch";
import { VERTICAL_COORDS } from "../components/squad/formations_vertical";
import { computeChemistry } from "../components/squad/chemistry";
import { searchPlayers, getLivePrice } from "../api/squadApi"; // ✅ only these
import { isValidForSlot } from "../utils/positions";
import ChemDebug from "../components/squad/ChemDebug";

export default function SquadBuilder() {
  const [formation, setFormation] = useState("4-3-3");
  const [placed, setPlaced] = useState({});           // { [slotKey]: player }
  const [searchResults, setSearchResults] = useState([]);
  const [query, setQuery] = useState("");
  const [selectedSlot, setSelectedSlot] = useState(null); // { key, pos } or null
  const fetchingPriceRef = useRef(new Set());             // avoid double price fetches

  // --- Chemistry (depends on placed + current formation layout) -------------
  const chem = useMemo(() => {
    return computeChemistry(placed, VERTICAL_COORDS[formation]);
  }, [placed, formation]);

  // --- Search (filters by selected slot's position) -------------------------
  useEffect(() => {
    const run = async () => {
      const q = (query || "").trim();
      const pos = selectedSlot?.pos || "";
      if (!q && !pos) {
        setSearchResults([]);
        return;
      }
      try {
        const res = await searchPlayers(q, { pos });
        setSearchResults(Array.isArray(res) ? res : []);
      } catch (err) {
        console.error("Search error:", err);
        setSearchResults([]);
      }
    };
    run();
  }, [query, selectedSlot]);

  // --- Place player into a slot --------------------------------------------
  const handlePlace = async (slotKey, player) => {
    // mark inPos now (UI nicety; chem engine can also re-evaluate)
    const primary = (player.position || "").toUpperCase();
    const alts = (player.altposition || "")
      .split(/[;,|/ ]+/)
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
    const valid = isValidForSlot(selectedSlot?.pos || slotKey, [primary, ...alts]);

    const toPlace = {
      ...player,
      inPos: !!valid,
    };

    setPlaced((prev) => ({ ...prev, [slotKey]: toPlace }));

    // lazy fill price if missing
    if ((toPlace.price == null || Number.isNaN(toPlace.price)) && toPlace.card_id && !fetchingPriceRef.current.has(toPlace.card_id)) {
      fetchingPriceRef.current.add(toPlace.card_id);
      try {
        const live = await getLivePrice(toPlace.card_id);
        if (typeof live === "number" && live >= 0) {
          setPlaced((prev) => {
            if (!prev[slotKey] || prev[slotKey].card_id !== toPlace.card_id) return prev;
            return { ...prev, [slotKey]: { ...prev[slotKey], price: live } };
          });
        }
      } catch (e) {
        console.warn("price fetch failed", e);
      } finally {
        fetchingPriceRef.current.delete(toPlace.card_id);
      }
    }

    // reset search UI
    setSelectedSlot(null);
    setQuery("");
    setSearchResults([]);
  };

  // --- Remove player from a slot -------------------------------------------
  const handleRemove = (slotKey) => {
    setPlaced((prev) => {
      const copy = { ...prev };
      delete copy[slotKey];
      return copy;
    });
  };

  // --- Render ---------------------------------------------------------------
  return (
    <div className="squad-grid grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Pitch + formation + chem debug */}
      <div className="pitch-container lg:col-span-2">
        <Pitch
          formation={formation}
          placed={placed}
          chem={chem}
          selectedSlot={selectedSlot}
          onSelectSlot={setSelectedSlot}
          onRemove={handleRemove}
        />

        <div className="mt-4 flex items-center gap-3">
          <select
            className="formation-select px-3 py-2 rounded-md text-sm"
            value={formation}
            onChange={(e) => setFormation(e.target.value)}
          >
            {Object.keys(VERTICAL_COORDS).map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>

          {/* (Optional) quick clear button */}
          <button
            className="enhanced-btn btn-green px-3 py-2 rounded-md text-sm"
            onClick={() => setPlaced({})}
          >
            Clear Squad
          </button>
        </div>

        {/* Toggleable debug is handy while tuning chem */}
        <div className="mt-4">
          <ChemDebug chem={chem} placed={placed} formation={formation} />
        </div>
      </div>

      {/* Search column */}
      <div className="search-container">
        {selectedSlot ? (
          <>
            <input
              type="text"
              placeholder={`Search ${selectedSlot.pos}…`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="search-input w-full px-3 py-2 rounded-md mb-3"
            />

            <div className="search-results custom-scrollbar max-h-[70vh] overflow-auto space-y-2">
              {searchResults.map((p) => {
                const primary = (p.position || "").toUpperCase();
                const alts = (p.altposition || "")
                  .split(/[;,|/ ]+/)
                  .map((s) => s.trim().toUpperCase())
                  .filter(Boolean);
                const valid = isValidForSlot(selectedSlot.pos, [primary, ...alts]);

                return (
                  <div
                    key={p.card_id || p.id}
                    className={`search-item flex items-center gap-3 p-2 rounded-md cursor-pointer ${!valid ? "invalid" : ""}`}
                    onClick={() => valid && handlePlace(selectedSlot.key, p)}
                    title={!valid ? "Not eligible for this position" : "Add to squad"}
                  >
                    <img
                      src={p.image_url}
                      alt={p.name}
                      className="search-thumb w-12 h-16 object-cover rounded"
                    />
                    <div className="search-info">
                      <div className="search-name font-semibold">{p.name}</div>
                      <div className="search-meta text-xs opacity-80">
                        {p.rating ?? "-"} · {p.position ?? "—"}
                        {p.altposition ? ` (${p.altposition})` : ""} · {p.club ?? "—"}
                      </div>
                    </div>
                    <div className="ml-auto text-xs font-semibold">
                      {typeof p.price === "number" ? `${p.price.toLocaleString()}c` : ""}
                    </div>
                  </div>
                );
              })}
              {searchResults.length === 0 && (
                <div className="text-sm opacity-70">No results.</div>
              )}
            </div>
          </>
        ) : (
          <div className="search-placeholder text-sm opacity-80">
            Select a slot on the pitch to search for players.
          </div>
        )}
      </div>
    </div>
  );
}