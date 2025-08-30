// src/pages/SquadBuilder.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Search, X, Star, Users, Trophy, DollarSign, Plus } from "lucide-react";
import Pitch from "../components/squad/Pitch";
import { FORMATIONS } from "../components/squad/formations";
import { VERTICAL_COORDS } from "../components/squad/formations_vertical";
import { computeChemistry } from "../components/squad/chemistry";
import { searchPlayers, enrichFromDbOnly } from "../api/squadApi";
import { isValidForSlot } from "../utils/positions";
import "../styles/squad.css";

const c = (n) => (typeof n === "number" ? `${n.toLocaleString()}c` : "—");
const cls = (...xs) => xs.filter(Boolean).join(" ");

// ———————————————————————————————————————————————————————————
// Player card — NO outer box/background/border; only overlays.
// ———————————————————————————————————————————————————————————
function PlayerCard({ player, slotPosition, onRemove, chem = 0, draggable = false, onDragStart, size = "md" }) {
  if (!player) return null;
  const outOfPosition = !isValidForSlot(slotPosition, player.positions);
  const sizeClasses = size === "sm" ? "w-16 h-24" : "w-24 h-36";

  return (
    <div className={cls("relative group select-none", sizeClasses)} draggable={draggable} onDragStart={onDragStart}>
      {/* Card image only */}
      {player.image_url && (
        <img
          className="absolute inset-0 w-full h-full object-contain rounded-xl squad-card__img"
          src={player.image_url}
          alt={player.name}
          referrerPolicy="no-referrer"
        />
      )}

      {/* Chemistry dot (slightly bigger) */}
      <div
        className={cls(
          "absolute top-1.5 right-1.5 chem-dot",
          outOfPosition ? "oop-indicator" : chem >= 3 ? "chem-3" : chem === 2 ? "chem-2" : chem === 1 ? "chem-1" : "chem-0"
        )}
        title={`Chemistry: ${outOfPosition ? 0 : chem}/3${outOfPosition ? " (Out of Position)" : ""}`}
        style={{ width: 14, height: 14 }}
      />

      {/* Price pill (center bottom) */}
      {typeof player.price === "number" && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-1">
          <div className="price">
            <span className="coin" />
            <span>{player.price.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Remove button */}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center hover:bg-red-600 shadow-lg z-10"
          aria-label="Remove"
        >
          <X size={10} />
        </button>
      )}
    </div>
  );
}

function EmptySlot({ position, onClick, isSelected }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cls(
        "empty-slot w-24 h-36 rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all",
        isSelected
          ? "border-green-400 bg-green-400/10 shadow-lg shadow-green-400/20"
          : "border-gray-600 hover:border-gray-500 hover:bg-gray-800/30"
      )}
    >
      <div className={cls("text-sm font-bold", isSelected ? "text-green-400" : "text-gray-400")}>{position}</div>
      <Plus size={16} className={cls("mt-1", isSelected ? "text-green-400" : "text-gray-500")} />
      {isSelected && <div className="text-xs text-green-400 mt-1 font-medium">Click player</div>}
    </button>
  );
}

function rotateSlot(slot) {
  return { ...slot, x: slot.y, y: 100 - slot.x };
}
function rotateFormationSlots(slots) {
  return (slots || []).map(rotateSlot);
}
function getVerticalSlots(formationKey) {
  return VERTICAL_COORDS[formationKey] || rotateFormationSlots(FORMATIONS[formationKey] || []);
}

export default function SquadBuilder() {
  const [formationKey, setFormationKey] = useState("4-3-3");
  const slots = useMemo(() => getVerticalSlots(formationKey), [formationKey]);

  const [placed, setPlaced] = useState(() => Object.fromEntries(slots.map((s) => [s.key, null])));

  // preserve players on formation change
  useEffect(() => {
    setPlaced((prev) => {
      const next = {};
      for (const s of slots) next[s.key] = prev[s.key] || null;
      return next;
    });
  }, [formationKey, slots]);

  // chemistry
  const { perPlayerChem, teamChem } = useMemo(() => computeChemistry(placed, slots), [placed, slots]);

  const avgRating = useMemo(() => {
    const ps = Object.values(placed).filter(Boolean);
    if (ps.length === 0) return 0;
    return Math.round(ps.reduce((a, p) => a + (p.rating || 0), 0) / ps.length);
  }, [placed]);

  const squadPrice = useMemo(() => {
    return Object.values(placed)
      .filter(Boolean)
      .reduce((a, p) => a + (p.price || 0), 0);
  }, [placed]);

  const playerCount = useMemo(() => Object.values(placed).filter(Boolean).length, [placed]);

  // search
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [searchOpen, setSearchOpen] = useState(null);
  const debounceRef = useRef();

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!search.trim()) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const base = await searchPlayers(search, searchOpen ? slots.find((s) => s.key === searchOpen)?.pos : undefined);
      setResults(base);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search, searchOpen, slots]);

  async function addPlayerToSlot(basePlayer, slotKey) {
    const full = await enrichFromDbOnly(basePlayer); // stays DB-only to avoid reintroducing card frames
    setPlaced((prev) => ({ ...prev, [slotKey]: full }));
    setSearchOpen(null);
    setSearch("");
  }

  // DnD
  function handleDragStart(e, playerId) {
    e.dataTransfer.setData("text/plain", String(playerId));
  }
  function handleDrop(e, slotKey) {
    e.preventDefault();
    const id = Number(e.dataTransfer.getData("text/plain"));
    const base = results.find((x) => x.id === id) || null;
    if (!base) return;
    addPlayerToSlot(base, slotKey);
  }

  function clearSlot(slotKey) {
    setPlaced((prev) => ({ ...prev, [slotKey]: null }));
  }
  function clearAll() {
    setPlaced(Object.fromEntries(slots.map((s) => [s.key, null])));
    setSearchOpen(null);
  }

  function shareUrl() {
    const pruned = Object.fromEntries(
      Object.entries(placed).map(([k, v]) => [
        k,
        v
          ? {
              id: v.id,
              name: v.name,
              rating: v.rating,
              club: v.club,
              league: v.league,
              nation: v.nation,
              positions: v.positions,
              image_url: v.image_url,
              price: v.price,
              isIcon: v.isIcon,
              isHero: v.isHero,
            }
          : null,
      ])
    );
    const state = { formationKey, placed: pruned };
    const encoded = encodeURIComponent(btoa(JSON.stringify(state)));
    const url = new URL(window.location.href);
    url.searchParams.set("squad", encoded);
    navigator.clipboard.writeText(url.toString());
  }

  // import from URL
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
    } catch {
      // ignore
    }
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-gray-800 bg-gray-950/90 backdrop-blur-sm">
        <div className="mx-auto max-w-[1400px] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="text-2xl font-black tracking-tight">
              <span className="text-green-400">FUT</span> Squad Builder
            </div>
            <select
              className="formation-select rounded-lg px-3 py-2 text-sm focus:outline-none"
              value={formationKey}
              onChange={(e) => setFormationKey(e.target.value)}
            >
              {Object.keys({ ...VERTICAL_COORDS, ...FORMATIONS }).map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <div className="stats-badge flex items-center gap-2 px-3 py-2 rounded-lg">
              <Star size={16} className="text-yellow-400" />
              <span className="font-semibold">{avgRating}</span>
            </div>
            <div className="stats-badge flex items-center gap-2 px-3 py-2 rounded-lg">
              <Trophy size={16} className="text-blue-400" />
              <span className="font-semibold">{teamChem}/33</span>
            </div>
            <div className="stats-badge flex items-center gap-2 px-3 py-2 rounded-lg">
              <DollarSign size={16} className="text-green-400" />
              <span className="font-semibold">{c(squadPrice)}</span>
            </div>
            <button className="enhanced-btn btn-green px-4 py-2 rounded-lg" onClick={shareUrl}>
              Share Link
            </button>
            <button className="enhanced-btn px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600" onClick={clearAll}>
              Clear
            </button>
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="mx-auto max-w-[1400px] px-6 py-6 grid grid-cols-12 gap-6">
        {/* Pitch */}
        <div className="col-span-8">
          <Pitch height="600px">
            {slots.map((slot) => {
              const pl = placed[slot.key];
              const chem = pl ? perPlayerChem[pl.id] ?? 0 : 0;

              return (
                <div
                  key={slot.key}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, slot.key)}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
                >
                  {pl ? (
                    <PlayerCard
                      player={pl}
                      slotPosition={slot.pos}
                      chem={chem}
                      draggable
                      onDragStart={(e) => handleDragStart(e, pl.id)}
                      onRemove={() => clearSlot(slot.key)}
                    />
                  ) : (
                    <EmptySlot position={slot.pos} isSelected={searchOpen === slot.key} onClick={() => setSearchOpen(slot.key)} />
                  )}
                </div>
              );
            })}
          </Pitch>

          <div className="mt-6 flex items-center gap-6 text-xs text-gray-400">
            <span className="flex items-center gap-2">💡 <strong>Tip:</strong> Click empty slots to add players, drag to rearrange</span>
            <span className="flex items-center gap-2">🔴 <strong>Red dot:</strong> Out of position (0 chemistry)</span>
            <span className="flex items-center gap-2">🟢 <strong>Green dot:</strong> Full chemistry (3/3)</span>
          </div>
        </div>

        {/* Search */}
        <aside className="col-span-4 space-y-4">
          <div className="glass-effect rounded-2xl overflow-hidden border border-gray-800">
            <div className="p-4 border-b border-gray-800">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400"
                  placeholder={searchOpen ? `Search for ${searchOpen}...` : "Search name, club, league, nation, position"}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {searchOpen && (
                <div className="mt-3 flex items-center justify-between bg-gray-800/50 rounded-lg px-3 py-2">
                  <span className="text-sm text-gray-300">
                    Adding to: <span className="font-semibold text-green-400">{searchOpen}</span>
                  </span>
                  <button
                    onClick={() => {
                      setSearchOpen(null);
                      setSearch("");
                    }}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto custom-scrollbar">
              {results.length > 0 ? (
                <div className="p-3 space-y-2">
                  {results.map((p) => {
                    const slotPos = searchOpen ? slots.find((s) => s.key === searchOpen)?.pos : null;
                    const validForSlot = slotPos ? isValidForSlot(slotPos, p.positions) : true;

                    return (
                      <div
                        key={p.id}
                        onClick={() => searchOpen && validForSlot && addPlayerToSlot(p, searchOpen)}
                        className={cls(
                          "search-item bg-gray-800 border border-gray-700 rounded-xl p-3",
                          searchOpen && validForSlot ? "hover:bg-gray-700 cursor-pointer hover:border-gray-600" : "",
                          searchOpen && !validForSlot ? "invalid cursor-not-allowed" : ""
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {/* small preview without border */}
                          <div className="relative w-16 h-24">
                            {p.image_url && (
                              <img
                                className="absolute inset-0 w-full h-full object-contain rounded-lg"
                                src={p.image_url}
                                alt={p.name}
                                referrerPolicy="no-referrer"
                              />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm truncate">{p.name}</span>
                              {p.isIcon && <span className="text-xs bg-orange-500/80 text-white px-1.5 py-0.5 rounded font-bold">ICON</span>}
                              {p.isHero && <span className="text-xs bg-purple-500/80 text-white px-1.5 py-0.5 rounded font-bold">HERO</span>}
                            </div>
                            <div className="text-xs text-gray-400 truncate">{p.club || "—"} • {p.nation || "—"}</div>
                            <div className="text-xs flex items-center gap-2">
                              <span className="text-white font-medium">⭐ {p.rating ?? "-"}</span>
                              <span className="text-gray-500">•</span>
                              <span className="text-green-400 font-medium">{c(p.price)}</span>
                            </div>
                            {!validForSlot && searchOpen && <div className="text-xs text-red-400 mt-1">❌ Cannot play {slotPos}</div>}
                          </div>

                          {searchOpen && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (validForSlot) addPlayerToSlot(p, searchOpen);
                              }}
                              disabled={!validForSlot}
                              className={cls(
                                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                                validForSlot ? "bg-green-500 hover:bg-green-600 text-white shadow-sm" : "bg-gray-600 text-gray-400 cursor-not-allowed"
                              )}
                            >
                              Add
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : search ? (
                <div className="p-8 text-center text-gray-400">
                  <Search size={32} className="mx-auto mb-3 opacity-50" />
                  <div className="text-sm">No players found for "{search}"</div>
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <Users size={32} className="mx-auto mb-3 opacity-50" />
                  <div className="text-sm">Start typing to search players...</div>
                  {searchOpen && <div className="text-xs mt-2 text-green-400">Looking for {searchOpen} players</div>}
                </div>
              )}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}