// src/pages/SquadBuilder.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Search, X, Star, Trophy, DollarSign, Users } from "lucide-react";
import Pitch from "../components/squad/Pitch";
import PlayerTile from "../components/squad/PlayerTile";
import { FORMATIONS } from "../components/squad/formations";
import { VERTICAL_COORDS } from "../components/squad/formations_vertical";
import { computeChemistry } from "../components/squad/chemistry";
import { searchPlayers } from "../api/squadApi";
import { isValidForSlot } from "../utils/positions";
import "../styles/squad.css";

const cls = (...xs) => xs.filter(Boolean).join(" ");
const c = (n) => (typeof n === "number" ? `${n.toLocaleString()}c` : "—");

function rotateSlot(s) { return { ...s, x: s.y, y: 100 - s.x }; }
function rotateFormationSlots(slots) { return (slots || []).map(rotateSlot); }
function getVerticalSlots(formationKey) {
  return VERTICAL_COORDS[formationKey] || rotateFormationSlots(FORMATIONS[formationKey] || []);
}

export default function SquadBuilder() {
  const [formationKey, setFormationKey] = useState("4-3-3");
  const slots = useMemo(() => getVerticalSlots(formationKey), [formationKey]);

  // placed players keyed by slot.key
  const [placed, setPlaced] = useState(() => Object.fromEntries(slots.map((s) => [s.key, null])));

  // preserve placed when formation changes (same keys retained)
  useEffect(() => {
    setPlaced((prev) => {
      const next = {};
      for (const s of slots) next[s.key] = prev[s.key] || null;
      return next;
    });
  }, [formationKey, slots]);

  const { perPlayerChem, teamChem } = useMemo(
    () => computeChemistry(placed, slots),
    [placed, slots]
  );

  const avgRating = useMemo(() => {
    const ps = Object.values(placed).filter(Boolean);
    if (!ps.length) return 0;
    return Math.round(ps.reduce((a, p) => a + (p.rating || 0), 0) / ps.length);
  }, [placed]);

  const squadPrice = useMemo(() => {
    return Object.values(placed).filter(Boolean).reduce((a, p) => a + (p.price || 0), 0);
  }, [placed]);

  const playerCount = useMemo(() => Object.values(placed).filter(Boolean).length, [placed]);

  // ---------- search ----------
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [searchOpen, setSearchOpen] = useState(null); // slot.key
  const debounceRef = useRef();

  useEffect(() => {
    clearTimeout(debounceRef.current);
    // If a slot is selected, prefilter eligible players by that slot's position
    const slotPos = searchOpen ? (slots.find((s) => s.key === searchOpen)?.pos || null) : null;

    // Allow position-only search (empty q) to list *eligible* players for slot
    if (!search.trim() && slotPos) {
      debounceRef.current = setTimeout(async () => {
        const base = await searchPlayers("", slotPos);
        setResults(base);
      }, 250);
      return () => clearTimeout(debounceRef.current);
    }

    if (!search.trim()) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const base = await searchPlayers(search, slotPos);
      setResults(base);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search, searchOpen, slots]);

  async function addToSlot(p, slotKey) {
    setPlaced((prev) => ({ ...prev, [slotKey]: p }));
    setSearch("");
    setSearchOpen(null);
  }

  function onDragStart(e, id) {
    e.dataTransfer.setData("text/plain", String(id));
  }

  function onDrop(e, slotKey) {
    e.preventDefault();
    const id = Number(e.dataTransfer.getData("text/plain"));
    const base = results.find((x) => x.id === id) || null;
    if (!base) return;
    addToSlot(base, slotKey);
  }

  function clearSlot(slotKey) { setPlaced((prev) => ({ ...prev, [slotKey]: null })); }
  function clearAll() { setPlaced(Object.fromEntries(slots.map((s) => [s.key, null]))); setSearchOpen(null); }

  function copyShare() {
    const pruned = Object.fromEntries(
      Object.entries(placed).map(([k, v]) => [
        k,
        v ? {
          id: v.id, name: v.name, rating: v.rating,
          club: v.club, league: v.league, nation: v.nation,
          positions: v.positions, image_url: v.image_url,
          price: v.price, isIcon: v.isIcon, isHero: v.isHero,
        } : null,
      ])
    );
    const state = { formationKey, placed: pruned };
    const encoded = encodeURIComponent(btoa(JSON.stringify(state)));
    const url = new URL(window.location.href);
    url.searchParams.set("squad", encoded);
    navigator.clipboard.writeText(url.toString());
  }

  // import from ?squad=
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const encoded = url.searchParams.get("squad");
      if (!encoded) return;
      const state = JSON.parse(atob(decodeURIComponent(encoded)));
      if (state?.formationKey && (VERTICAL_COORDS[state.formationKey] || FORMATIONS[state.formationKey])) {
        setFormationKey(state.formationKey);
      }
      if (state?.placed && typeof state.placed === "object") {
        setPlaced(state.placed);
      }
    } catch {}
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* header */}
      <header className="sticky top-0 z-20 border-b border-gray-800 bg-gray-950/90 backdrop-blur-sm">
        <div className="mx-auto max-w-[1400px] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="text-2xl font-black tracking-tight">
              <span className="text-green-400">FUT</span> Squad Builder
            </div>

            <select
              className="formation-select rounded-lg px-3 py-2 text-sm"
              value={formationKey}
              onChange={(e) => setFormationKey(e.target.value)}
            >
              {Object.keys({ ...VERTICAL_COORDS, ...FORMATIONS }).map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <div className="stats-badge px-3 py-2 rounded-lg flex items-center gap-2">
              <Star size={16} className="text-yellow-400" />
              <span className="font-semibold">{avgRating}</span>
            </div>
            <div className="stats-badge px-3 py-2 rounded-lg flex items-center gap-2">
              <Trophy size={16} className="text-blue-400" />
              <span className="font-semibold">{teamChem}/33</span>
            </div>
            <div className="stats-badge px-3 py-2 rounded-lg flex items-center gap-2">
              <DollarSign size={16} className="text-green-400" />
              <span className="font-semibold">{c(squadPrice)}</span>
            </div>
            <button className="enhanced-btn btn-green px-4 py-2 rounded-lg" onClick={copyShare}>
              Share Link
            </button>
            <button className="enhanced-btn px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-700" onClick={clearAll}>
              Clear
            </button>
          </div>
        </div>
      </header>

      {/* body */}
      <main className="mx-auto max-w-[1400px] px-6 py-6 grid grid-cols-12 gap-6 squad-grid">
        {/* pitch */}
        <div className="col-span-8 pitch-container">
          <Pitch height="640px">
            {slots.map((slot) => {
              const p = placed[slot.key];
              const chem = p ? perPlayerChem[p.id] ?? 0 : 0;

              return (
                <div
                  key={slot.key}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => onDrop(e, slot.key)}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
                >
                  {p ? (
                    <div className="group relative">
                      <PlayerTile
                        player={p}
                        slotPosition={slot.pos}
                        chem={chem}
                        draggable
                        onDragStart={(e) => onDragStart(e, p.id)}
                      />
                      <div className="absolute left-1/2 -translate-x-1/2 -bottom-7 opacity-0 group-hover:opacity-100 transition">
                        <div className="flex gap-2 text-xs">
                          <button
                            className="px-2 py-1 bg-gray-800/90 border border-gray-700 rounded hover:bg-gray-700"
                            onClick={() => setSearchOpen(slot.key)}
                          >
                            Swap
                          </button>
                          <button
                            className="px-2 py-1 bg-red-800/90 border border-red-700 rounded hover:bg-red-700"
                            onClick={() => clearSlot(slot.key)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSearchOpen(slot.key)}
                      title={`Add ${slot.pos}`}
                      className={cls(
                        "empty-slot w-24 h-32 rounded-xl border-2 border-dashed border-gray-600 grid place-items-center bg-white/5 hover:bg-white/10"
                      )}
                    >
                      <div className="text-sm font-bold text-gray-300">{slot.pos}</div>
                    </button>
                  )}
                </div>
              );
            })}
          </Pitch>

          <div className="mt-6 flex items-center gap-6 text-xs text-gray-400">
            <span className="flex items-center gap-2">
              💡 <strong>Tip:</strong> Click a slot to filter search to eligible players
            </span>
            <span className="flex items-center gap-2">
              🔴 <strong>Red dot:</strong> Out of position (0 chemistry)
            </span>
            <span className="flex items-center gap-2">
              🟢 <strong>Green dot:</strong> 3/3 chemistry
            </span>
          </div>
        </div>

        {/* search */}
        <aside className="col-span-4 search-container space-y-4">
          <div className="glass-effect rounded-2xl overflow-hidden border border-gray-800">
            <div className="p-4 border-b border-gray-800">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  className="w-full bg-gray-800/80 border border-gray-700 rounded-lg pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400"
                  placeholder={
                    searchOpen ? `Search for ${slots.find(s => s.key === searchOpen)?.pos}…` : "Search name, club, league, nation, position"
                  }
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-white"
                    onClick={() => setSearch("")}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {searchOpen && (
                <div className="mt-3 flex items-center justify-between bg-gray-800/50 rounded-lg px-3 py-2">
                  <span className="text-sm text-gray-300">
                    Adding to:{" "}
                    <span className="font-semibold text-green-400">
                      {slots.find(s => s.key === searchOpen)?.pos}
                    </span>
                  </span>
                  <button
                    onClick={() => { setSearchOpen(null); setSearch(""); setResults([]); }}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto custom-scrollbar p-3 space-y-2">
              {results.length > 0 ? (
                results.map((p) => {
                  const slotPos = searchOpen ? (slots.find(s => s.key === searchOpen)?.pos || null) : null;
                  const valid = slotPos ? isValidForSlot(slotPos, p.positions) : true;
                  return (
                    <div
                      key={p.id}
                      className={cls(
                        "search-item bg-gray-800 border border-gray-700 rounded-xl p-2",
                        searchOpen && valid ? "hover:bg-gray-700 cursor-pointer" : "",
                        searchOpen && !valid ? "invalid cursor-not-allowed" : ""
                      )}
                      onClick={() => {
                        if (!searchOpen || !valid) return;
                        addToSlot(p, searchOpen);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative" draggable onDragStart={(e) => e.dataTransfer.setData("text/plain", String(p.id))}>
                          <div style={{ width: 64, height: 86 }}>
                            <img src={p.image_url} alt={p.name} className="w-full h-full object-cover rounded-md" />
                          </div>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-sm truncate">{p.name}</div>
                          <div className="text-xs text-gray-400 truncate">
                            {p.club || "—"} • {p.nation || "—"} • {p.league || "—"}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {p.positions?.join(" / ") || "—"}
                          </div>
                        </div>

                        {searchOpen && (
                          <button
                            className={cls(
                              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                              valid ? "btn-green" : "bg-gray-600 text-gray-300 cursor-not-allowed"
                            )}
                            disabled={!valid}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (valid) addToSlot(p, searchOpen);
                            }}
                          >
                            Add
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-gray-500">
                  {search || searchOpen ? (
                    <>
                      <Search size={32} className="mx-auto mb-3 opacity-50" />
                      <div className="text-sm">
                        {searchOpen ? "Type to search eligible players…" : "Start typing to search players…"}
                      </div>
                    </>
                  ) : (
                    <div className="text-sm">Start typing to search players…</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* overview */}
          <div className="glass-effect rounded-2xl p-4 border border-gray-800">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Users size={16} className="text-blue-400" />
              Squad Overview
            </h3>
            <div className="space-y-3">
              <div className="bg-gray-800 rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-400 text-xs">Squad Completion</span>
                  <span className="font-bold text-sm">{playerCount}/11</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full transition-all"
                    style={{ width: `${(playerCount / 11) * 100}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-800 rounded-lg p-3 text-center">
                  <div className="text-yellow-400 font-bold text-xl">{avgRating}</div>
                  <div className="text-gray-400 text-xs">Avg Rating</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-3 text-center">
                  <div className="text-green-400 font-bold text-xl">{teamChem}</div>
                  <div className="text-gray-400 text-xs">Team Chem</div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-3 text-center">
                <div className="text-blue-400 font-bold text-lg">{squadPrice.toLocaleString()}</div>
                <div className="text-gray-400 text-xs">Total Squad Value</div>
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}