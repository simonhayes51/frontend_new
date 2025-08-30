// src/components/squad/Pitch.jsx
import React from "react";

export default function Pitch({
  height = "600px",
  children,
  className = "",
}) {
  return (
    <div
      className={`relative rounded-2xl overflow-hidden bg-[#0F3D30] border border-[#1b4d3e] ${className}`}
      style={{ height }}
    >
      {/* SVG Markings (kept simple & standards-compliant) */}
      <svg
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 w-full h-full"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="pitchFade" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#114735" />
            <stop offset="100%" stopColor="#0b2f24" />
          </linearGradient>
        </defs>

        {/* grass */}
        <rect x="0" y="0" width="1200" height="800" fill="url(#pitchFade)" />

        {/* outer border */}
        <rect
          x="30"
          y="30"
          width="1140"
          height="740"
          fill="none"
          stroke="#1f795f"
          strokeWidth="6"
          rx="24"
          ry="24"
        />

        {/* half-way line */}
        <line
          x1="600"
          y1="30"
          x2="600"
          y2="770"
          stroke="#1f795f"
          strokeWidth="4"
        />

        {/* centre circle */}
        <circle cx="600" cy="400" r="90" fill="none" stroke="#1f795f" strokeWidth="4" />
        <circle cx="600" cy="400" r="6" fill="#2bd3a7" />

        {/* penalty boxes */}
        {/* left */}
        <rect x="30" y="200" width="180" height="400" fill="none" stroke="#1f795f" strokeWidth="4" />
        <rect x="30" y="270" width="60" height="260" fill="none" stroke="#1f795f" strokeWidth="4" />
        <circle cx="180" cy="400" r="6" fill="#2bd3a7" />
        <path d="M210 300 A120 120 0 0 0 210 500" fill="none" stroke="#1f795f" strokeWidth="4" />

        {/* right */}
        <rect x="990" y="200" width="180" height="400" fill="none" stroke="#1f795f" strokeWidth="4" />
        <rect x="1110" y="270" width="60" height="260" fill="none" stroke="#1f795f" strokeWidth="4" />
        <circle cx="1020" cy="400" r="6" fill="#2bd3a7" />
        <path d="M990 300 A120 120 0 0 1 990 500" fill="none" stroke="#1f795f" strokeWidth="4" />

        {/* small goal areas */}
        <rect x="30" y="320" width="60" height="160" fill="none" stroke="#1f795f" strokeWidth="4" />
        <rect x="1110" y="320" width="60" height="160" fill="none" stroke="#1f795f" strokeWidth="4" />
      </svg>

      {/* Slot layer for absolutely positioned children */}
      <div className="absolute inset-0">{children}</div>
    </div>
  );
}