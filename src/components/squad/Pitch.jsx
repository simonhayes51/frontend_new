// src/components/squad/Pitch.jsx
import React from "react";
import { VERTICAL_COORDS } from "./formations_vertical";

/**
 * Props:
 * - formation: string (e.g. "4-3-3")
 * - placed: { [slotKey]: playerObj }
 *    playerObj: {
 *      card_id, name, image_url, rating, version, position, altposition,
 *      club, league, nation, price
 *    }
 * - chem: {
 *    teamChem: number,
 *    perPlayer: { [slotKey]: { inPos: boolean, val: 0|1|2|3 } }
 *   }
 * - selectedSlot: { key, pos } | null
 * - onSelectSlot(slot)
 * - onRemove(slotKey)
 */
export default function Pitch({
  formation,
  placed,
  chem,
  selectedSlot,
  onSelectSlot,
  onRemove,
}) {
  const coords = VERTICAL_COORDS[formation] || [];

  return (
    <div className="pitch-box enhanced-pitch relative">
      {/* simple turf stripes backdrop */}
      <div className="pitch-turf" />

      {/* Lines using SVG (kept lightweight; your CSS styles .pl) */}
      <svg className="pitch-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Perimeter */}
        <rect x="2" y="2" width="96" height="96" className="pl" />
        {/* Halfway line */}
        <line x1="2" y1="50" x2="98" y2="50" className="pl" />
        {/* Center circle */}
        <circle cx="50" cy="50" r="9" className="pl" />
        <circle cx="50" cy="50" r="1" className="pl filled" />
        {/* Penalty boxes */}
        <rect x="25" y="2" width="50" height="16" className="pl" />
        <rect x="25" y="82" width="50" height="16" className="pl" />
        {/* Six-yard boxes */}
        <rect x="36" y="2" width="28" height="6" className="pl" />
        <rect x="36" y="92" width="28" height="6" className="pl" />
        {/* Penalty spots */}
        <circle cx="50" cy="13" r="0.8" className="pl filled" />
        <circle cx="50" cy="87" r="0.8" className="pl filled" />
        {/* Arcs */}
        <path d="M 39 18 A 11 11 0 0 0 61 18" className="pl" />
        <path d="M 39 82 A 11 11 0 0 1 61 82" className="pl" />
        {/* Corners */}
        <path d="M 2 6 A 4 4 0 0 1 6 2" className="pl" />
        <path d="M 98 6 A 4 4 0 0 0 94 2" className="pl" />
        <path d="M 2 94 A 4 4 0 0 0 6 98" className="pl" />
        <path d="M 98 94 A 4 4 0 0 1 94 98" className="pl" />
      </svg>

      {/* CONTENT – this class is what your CSS targets for “no outer box” */}
      <div className="pitch-content">
        {coords.map((slot) => {
          const p = placed?.[slot.key];
          const posStyle = {
            position: "absolute",
            left: `${slot.x}%`,
            top: `${slot.y}%`,
            transform: "translate(-50%, -50%)",
          };

          const chemForSlot = chem?.perPlayer?.[slot.key];
          const chemVal = chemForSlot?.val ?? 0;
          const inPos = !!chemForSlot?.inPos;

          return (
            <div key={slot.key} className="slot" style={posStyle}>
              {p ? (
                <CardOnPitch
                  player={p}
                  chemVal={chemVal}
                  inPos={inPos}
                  onRemove={() => onRemove(slot.key)}
                />
              ) : (
                <button
                  className={`empty-slot rounded-xl px-2 py-1 text-xs text-white/80 bg-black/20 border border-white/10`}
                  title={`Select ${slot.key}`}
                  onClick={() => onSelectSlot?.(slot)}
                >
                  {slot.key}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CardOnPitch({ player, chemVal, inPos, onRemove }) {
  // style chem dots a touch larger
  const dots = [0, 1, 2].map((i) => {
    const active = chemVal > i;
    return (
      <span
        key={i}
        className={`chem-dot ${active ? `chem-${chemVal}` : "chem-0"}`}
        style={{ width: 14, height: 14 }}
        title={`Chem: ${chemVal}`}
      />
    );
  });

  // Icon/Hero subtle tags (for search list; overridden on pitch by CSS)
  const specialClass =
    player.version?.toLowerCase().includes("icon")
      ? "icon-card"
      : player.version?.toLowerCase().includes("hero")
      ? "hero-card"
      : "";

  return (
    <div
      className={`squad-card ${specialClass}`}
      style={{
        width: 96,
        height: 134,
        borderRadius: 12,
        position: "relative",
      }}
    >
      {/* main image */}
      <img
        className="squad-card__img"
        src={player.image_url}
        alt={player.name}
        draggable={false}
      />

      {/* optional frame layer (hidden by CSS in pitch) */}
      <div className="squad-card__frame" />

      {/* remove button (small, top-left) */}
      <button
        onClick={onRemove}
        aria-label="Remove"
        className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center hover:bg-black/80"
      >
        ×
      </button>

      {/* chem dots (top-right) */}
      <div
        className="absolute top-1 right-1 flex gap-1 items-center"
        title={inPos ? "In position" : "Out of position"}
      >
        {!inPos && (
          <span
            className="oop-indicator inline-block w-2 h-2 rounded-full"
            style={{ marginRight: 2 }}
          />
        )}
        {dots}
      </div>

      {/* name (top-left, very small) — kept subtle */}
      <div
        className="absolute top-1 left-1 name"
        style={{ maxWidth: 72 }}
        title={player.name}
      >
        {player.name}
      </div>

      {/* centered price pill at bottom */}
      {typeof player.price === "number" && player.price > 0 && (
        <div
          className="price absolute left-1/2 -translate-x-1/2 bottom-1"
          title="Current price"
        >
          <span className="coin" />
          {formatCoins(player.price)}
        </div>
      )}
    </div>
  );
}

function formatCoins(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}m`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  return `${n}`;
}