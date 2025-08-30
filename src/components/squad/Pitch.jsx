// src/components/squad/Pitch.jsx
import React from "react";

/**
 * Vertical (portrait) football pitch with correct markings and no extra guides.
 * - 800 x 1200 logical canvas (portrait). Goals at top & bottom.
 * - preserveAspectRatio="xMidYMid meet" so nothing stretches.
 * - Children render on an absolute layer (use % left/top like you already do).
 *
 * Props:
 *   height: CSS height of the pitch (default 640px)
 *   className: extra classes
 */
export default function Pitch({ height = "640px", className = "", children }) {
  return (
    <div
      className={`pitch-box enhanced-pitch ${className}`}
      style={{ height }}
    >
      {/* turf stripes */}
      <div className="pitch-turf" />

      {/* Portrait SVG pitch (no training rectangles) */}
      <svg
        className="pitch-svg"
        viewBox="0 0 800 1200"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        {/* Outer boundary */}
        <rect x="20" y="20" width="760" height="1160" rx="18" ry="18" className="pl" />

        {/* Halfway line */}
        <line x1="20" y1="600" x2="780" y2="600" className="pl" />

        {/* Centre circle + spot */}
        <circle cx="400" cy="600" r="90" className="pl" />
        <circle cx="400" cy="600" r="5"  className="pl filled" />

        {/* --- Top end (attacking downwards) --- */}
        {/* Penalty area */}
        <rect x="180" y="20" width="440" height="180" className="pl" />
        {/* Goal area */}
        <rect x="260" y="20" width="280" height="60" className="pl" />
        {/* Penalty spot */}
        <circle cx="400" cy="160" r="5" className="pl filled" />
        {/* Penalty arc */}
        <path d="M 310 200 A 90 90 0 0 0 490 200" className="pl" fill="none" />
        {/* Simple goal outline */}
        <rect x="360" y="10" width="80" height="10" className="pl" />

        {/* --- Bottom end (attacking upwards) --- */}
        {/* Penalty area */}
        <rect x="180" y="1000" width="440" height="180" className="pl" />
        {/* Goal area */}
        <rect x="260" y="1120" width="280" height="60" className="pl" />
        {/* Penalty spot */}
        <circle cx="400" cy="1040" r="5" className="pl filled" />
        {/* Penalty arc */}
        <path d="M 490 1000 A 90 90 0 0 0 310 1000" className="pl" fill="none" />
        {/* Simple goal outline */}
        <rect x="360" y="1180" width="80" height="10" className="pl" />
      </svg>

      {/* absolute layer for cards/slots */}
      <div className="pitch-content">{children}</div>
    </div>
  );
}