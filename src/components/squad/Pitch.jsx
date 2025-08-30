import React from "react";
import { FORMATIONS } from "./formations";
import "../styles/squad.css";

export default function Pitch({
  formation,
  placed,
  chem,
  selectedSlot,
  onSelectSlot,
  onRemove,
}) {
  const coords = FORMATIONS[formation] || [];

  return (
    <div className="pitch-box enhanced-pitch">
      {/* Turf stripes */}
      <div className="pitch-turf"></div>

      {/* SVG pitch lines */}
      <svg
        className="pitch-svg"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <rect x="0" y="0" width="100" height="100" className="pl" />
        {/* Halfway line */}
        <line x1="0" y1="50" x2="100" y2="50" className="pl" />
        {/* Centre circle */}
        <circle cx="50" cy="50" r="9" className="pl" />
        <circle cx="50" cy="50" r="1" className="pl filled" />
        {/* Penalty boxes */}
        <rect x="25" y="0" width="50" height="16" className="pl" />
        <rect x="25" y="84" width="50" height="16" className="pl" />
        {/* Penalty spots */}
        <circle cx="50" cy="11" r="1" className="pl filled" />
        <circle cx="50" cy="89" r="1" className="pl filled" />
      </svg>

      {/* Slots + players */}
      <div className="pitch-content">
        {coords.map(({ key, x, y, pos }) => {
          const player = placed[key];
          const isSelected = selectedSlot?.key === key;

          return (
            <div
              key={key}
              className={`slot ${isSelected ? "selected" : ""}`}
              style={{
                position: "absolute",
                left: `${x}%`,
                top: `${y}%`,
                transform: "translate(-50%, -50%)",
              }}
              onClick={() => {
                if (player) {
                  onRemove?.(key);
                } else {
                  onSelectSlot?.({ key, pos });
                }
              }}
            >
              {player ? (
                <div className="squad-card">
                  <img src={player.image_url} alt={player.name} />
                  <div className="name">{player.name}</div>
                  {player.price ? (
                    <div className="price">
                      <span className="coin" /> {player.price.toLocaleString()}c
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="empty-slot">{pos || key}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}