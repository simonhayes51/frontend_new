// src/components/squad/Pitch.jsx
// NOTE: Do NOT import the CSS here. It is imported once in SquadBuilder.jsx.

import React from "react";

// coords: array of { key, pos, x, y } (VERTICAL_COORDS[formation])
export default function Pitch({
  formation,
  coords,
  placed,
  chem,
  onSelectSlot,
  onRemove,
}) {
  const perPlayerChem = chem?.perPlayer || {};

  return (
    <div className="pitch-box enhanced-pitch relative">
      {/* turf stripes */}
      <div className="pitch-turf" />

      {/* white pitch lines (SVG) */}
      <svg className="pitch-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
        <rect x="2" y="2" width="96" height="96" rx="4" className="pl" />
        <line x1="2" y1="50" x2="98" y2="50" className="pl" />
        <circle cx="50" cy="50" r="1.5" className="pl filled" />
        <circle cx="50" cy="50" r="14" className="pl" />

        {/* penalty boxes */}
        <g className="pl">
          <rect x="28" y="2" width="44" height="10" className="pl" />
          <circle cx="50" cy="12" r="0.6" className="pl filled" />
          <rect x="28" y="88" width="44" height="10" className="pl" />
          <circle cx="50" cy="88" r="0.6" className="pl filled" />
        </g>
      </svg>

      {/* content layer with padding */}
      <div className="pitch-content">
        {coords.map(({ key, pos, x, y }) => {
          const pl = placed[key];
          const chemVal = perPlayerChem[key] ?? 0;

          return (
            <div
              key={key}
              className="absolute"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: "translate(-50%, -50%)",
                width: 96,
                height: 134,
              }}
            >
              {/* empty slot */}
              {!pl && (
                <button
                  className="empty-slot w-full h-full rounded-xl border-2 border-dashed border-emerald-300/40 bg-emerald-300/5 text-emerald-200 text-xs flex flex-col items-center justify-center"
                  onClick={() => onSelectSlot({ key, pos })}
                  title={`Add ${pos}`}
                >
                  <div className="font-semibold opacity-80">{pos}</div>
                  <div className="text-lg leading-none">+</div>
                </button>
              )}

              {/* placed card */}
              {pl && (
                <div
                  className="squad-card relative w-full h-full rounded-xl cursor-pointer select-none"
                  onClick={() => onSelectSlot({ key, pos })}
                  title={`${pl.name} (${pos})`}
                >
                  <img
                    className="squad-card__img rounded-xl"
                    src={pl.image_url}
                    alt={pl.name}
                    draggable={false}
                  />

                  {/* price pill (bottom center) */}
                  {pl.price != null && (
                    <div
                      className="price absolute left-1/2 -translate-x-1/2 bottom-1"
                      style={{ pointerEvents: "none" }}
                    >
                      <span className="coin" /> {Number(pl.price).toLocaleString()}c
                    </div>
                  )}

                  {/* chem dot (top-right) */}
                  <div
                    className={`chem-dot absolute right-2 top-2 ${
                      chemVal >= 3 ? "chem-3" : chemVal === 2 ? "chem-2" : chemVal === 1 ? "chem-1" : "chem-0"
                    }`}
                    title={`Chem: ${chemVal}`}
                  />

                  {/* remove (small red dot top-left) */}
                  <button
                    className="absolute left-2 top-2 w-3.5 h-3.5 rounded-full bg-red-500 hover:bg-red-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(key);
                    }}
                    title="Remove"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}