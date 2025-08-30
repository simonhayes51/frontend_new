// src/pages/SquadBuilder.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import "../styles/squad.css";

import Pitch from "../components/squad/Pitch";
import { VERTICAL_COORDS } from "../components/squad/formations_vertical";
import { computeChemistry } from "../components/squad/chemistry";
import { searchPlayers, getLivePrice } from "../api/squadApi";
import { isValidForSlot } from "../utils/positions";
import ChemDebug from "../components/squad/ChemDebug";

export default function SquadBuilder() {
  const [formation, setFormation] = useState("4-3-3");
  const [placed, setPlaced] = useState({});
  const [searchResults, setSearchResults] = useState([]);
  const [query, setQuery] = useState("");
  const [selectedSlot, setSelectedSlot] = useState(null);
  const fetchingPriceRef = useRef(new Set());

  const chem = useMemo(
    () => computeChemistry(placed, VERTICAL_COORDS[formation]),
    [placed, formation]
  );

  useEffect(() => {
    const run = async () => {
      const q = (query || "").trim();
      const pos = selectedSlot?.pos || "";
      if (!q && !pos) return setSearchResults([]);
      try {
        const res = await searchPlayers(q, { pos });
        setSearchResults(Array.isArray(res) ? res : []);
      } catch (e) {
        console.error("search error:", e);
        setSearchResults([]);
      }
    };
    run();
  }, [query, selectedSlot]);

  const handlePlace = async (slotKey, p) => {
    const primary = (p.position || "").toUpperCase();
    const alts = (p.altposition || "")
      .split(/[;,|/ ]+/)
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
    const valid = isValidForSlot(selectedSlot?.pos || slotKey, [primary, ...alts]);

    const toPlace = { ...p, inPos: !!valid };
    setPlaced((prev) => ({ ...prev, [slotKey]: toPlace }));

    if ((toPlace.price == null || Number.isNaN(toPlace.price)) && toPlace.card_id) {
      if (!fetchingPriceRef.current.has(toPlace.card_id)) {
        fetchingPriceRef.current.add(toPlace.card_id);
        try {
          const live = await getLivePrice(toPlace.card_id);
          if (typeof live === "number") {
            setPlaced((prev) => {
              if (!prev[slotKey] || prev[slotKey].card_id !== toPlace.card_id) return prev;
              return { ...prev, [slotKey]: { ...prev[slotKey], price: live } };
            });
          }
        } catch {}
        fetchingPriceRef.current.delete(toPlace.card_id);
      }
    }

    setSelectedSlot(null);
    setQuery("");
    setSearchResults([]);
  };

  const handleRemove = (slotKey) => {
    setPlaced((prev) => {
      const next = { ...prev };
      delete next[slotKey];
      return next;
    });
  };

  return (
    <div className="sb-grid">
      {/* LEFT: pitch */}
      <div className="sb-left">
        <Pitch
          formation={formation}
          placed={placed}
          chem={chem}
          selectedSlot={selectedSlot}
          onSelectSlot={setSelectedSlot}
          onRemove={handleRemove}
        />

        <div className="sb-controls">
          <select
            className="formation-select"
            value={formation}
            onChange={(e) => setFormation(e.target.value)}
          >
            {Object.keys(VERTICAL_COORDS).map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>

          <button className="enhanced-btn btn-green sb-clear" onClick={() => setPlaced({})}>
            Clear Squad
          </button>
        </div>

        {/* keep while tuning */}
        <ChemDebug chem={chem} placed={placed} formation={formation} />
      </div>

      {/* RIGHT: search */}
      <div className="sb-right">
        {selectedSlot ? (
          <>
            <input
              className="search-input"
              type="text"
              placeholder={`Search ${selectedSlot.pos}…`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="search-results custom-scrollbar">
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
                    className={`search-item row ${!valid ? "invalid" : ""}`}
                    onClick={() => valid && handlePlace(selectedSlot.key, p)}
                    title={!valid ? "Not eligible for this slot" : "Add to squad"}
                  >
                    <img className="thumb" src={p.image_url} alt={p.name} />
                    <div className="info">
                      <div className="name">{p.name}</div>
                      <div className="meta">
                        {p.rating ?? "-"} · {p.position ?? "—"}
                        {p.altposition ? ` (${p.altposition})` : ""} · {p.club ?? "—"}
                      </div>
                    </div>
                    <div className="priceCell">
                      {typeof p.price === "number" ? `${p.price.toLocaleString()}c` : ""}
                    </div>
                  </div>
                );
              })}
              {searchResults.length === 0 && (
                <div className="empty">No results</div>
              )}
            </div>
          </>
        ) : (
          <div className="search-placeholder">
            Select a slot on the pitch to search for players.
          </div>
        )}
      </div>
    </div>
  );
}