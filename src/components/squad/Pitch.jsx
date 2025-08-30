// src/components/squad/Pitch.jsx
import React from "react";
import "../styles/squad.css";

/**
 * Vertical football pitch drawn with SVG at a 68 x 105 ratio.
 * Children are absolutely positioned in the inner content area (in %),
 * so your slot coords continue to work as before.
 *
 * Props:
 *  - height (optional): CSS height for the whole pitch box (e.g. "600px")
 *  - children: absolutely-positioned nodes (use left/top %) inside .pitch-content
 */
export default function Pitch({ height = "600px", children }) {
  return (
    <div className="pitch-box" style={{ height }}>
      {/* Turf stripes (CSS) */}
      <div className="pitch-turf" />

      {/* True-ratio SVG (vertical 68x105) */}
      <svg
        className="pitch-svg"
        viewBox="0 0 68 105"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        {/* Frame */}
        <rect x="1.5" y="1.5" width="65" height="102" rx="2" ry="2" className="pl" />

        {/* Halfway line */}
        <line x1="1.5" y1="52.5" x2="66.5" y2="52.5" className="pl" />

        {/* Centre circle + spot */}
        <circle cx="34" cy="52.5" r="9.15" className="pl" />
        <circle cx="34" cy="52.5" r="0.3" className="pl filled" />

        {/* Top penalty area */}
        <rect x="13" y="1.5" width="42" height="16.5" className="pl" />
        <rect x="22" y="1.5" width="24" height="5.5" className="pl" />
        {/* Penalty spot & arc (top) */}
        <circle cx="34" cy="12" r="0.3" className="pl filled" />
        <path d="M 25 18 A 9.15 9.15 0 0 1 43 18" className="pl" />

        {/* Bottom penalty area */}
        <rect x="13" y="105-16.5-1.5" width="42" height="16.5" className="pl" />
        <rect x="22" y="105-5.5-1.5" width="24" height="5.5" className="pl" />
        {/* Penalty spot & arc (bottom) */}
        <circle cx="34" cy="93" r="0.3" className="pl filled" />
        <path d="M 25 87 A 9.15 9.15 0 0 0 43 87" className="pl" />

        {/* Corner arcs */}
        <path d="M1.5,5 A3.5,3.5 0 0 1 5,1.5" className="pl" />
        <path d="M66.5,5 A3.5,3.5 0 0 0 63,1.5" className="pl" />
        <path d="M1.5,100 A3.5,3.5 0 0 0 5,103.5" className="pl" />
        <path d="M66.5,100 A3.5,3.5 0 0 1 63,103.5" className="pl" />
      </svg>

      {/* Content overlay with safe padding (so coords aren’t under the lines) */}
      <div className="pitch-content">{children}</div>
    </div>
  );
}
