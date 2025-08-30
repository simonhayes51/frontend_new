// src/components/squad/Pitch.jsx
import React from "react";
import "../../styles/squad.css";

/**
 * Vertical pitch with crisp, non-stretch lines.
 * Uses a fixed viewBox and lets the SVG scale — lines stay correct.
 */
export default function Pitch({ height = "640px", children }) {
  return (
    <div className="pitch-box enhanced-pitch" style={{ height }}>
      <div className="pitch-turf" />
      <svg
        className="pitch-svg"
        viewBox="0 0 100 160" // vertical field units
        preserveAspectRatio="none"
      >
        {/* outer lines */}
        <rect x="2" y="2" width="96" height="156" className="pl" />

        {/* halfway */}
        <line x1="2" y1="80" x2="98" y2="80" className="pl" />

        {/* center circle & spot */}
        <circle cx="50" cy="80" r="9.15" className="pl" />
        <circle cx="50" cy="80" r="0.5" className="pl filled" />

        {/* penalty areas */}
        {/* top box */}
        <rect x="18" y="2" width="64" height="16" className="pl" />
        <rect x="26" y="2" width="48" height="6" className="pl" />
        <circle cx="50" cy="12" r="0.5" className="pl filled" />

        {/* bottom box */}
        <rect x="18" y="146" width="64" height="12" className="pl" />
        <rect x="26" y="154" width="48" height="4" className="pl" />
        <circle cx="50" cy="148" r="0.5" className="pl filled" />

        {/* corner arcs (simple) */}
        <path d="M2,6 A4,4 0 0 1 6,2" className="pl" />
        <path d="M98,6 A4,4 0 0 0 94,2" className="pl" />
        <path d="M2,154 A4,4 0 0 0 6,158" className="pl" />
        <path d="M98,154 A4,4 0 0 1 94,158" className="pl" />
      </svg>

      {/* Safe inset content so cards don’t sit on the line */}
      <div className="pitch-content">{children}</div>
    </div>
  );
}