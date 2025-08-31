import React from "react";
import { Link, useLocation } from "react-router-dom";

const NAV_H = 72;
const LIME = "#91db32";

const Item = ({ to, label, icon, active }) => (
  <Link
    to={to}
    aria-current={active ? "page" : undefined}
    className="
      relative flex-1 h-full grid place-items-center text-xs
      active:scale-[0.98] transition
    "
  >
    <div
      className={`
        flex items-center gap-2 px-3 py-2 rounded-xl
        ${active ? "bg-white/10 ring-1 ring-white/10" : "bg-transparent"}
      `}
      style={{ color: active ? LIME : "rgba(255,255,255,0.7)" }}
    >
      <span className="w-5 h-5">{icon}</span>
      <span className="leading-none">{label}</span>
    </div>
  </Link>
);

export default function MobileNavigation() {
  const { pathname } = useLocation();

  const tabs = [
    {
      to: "/",
      label: "Dashboard",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-9 9 9" />
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 21V9h6v12" />
        </svg>
      ),
    },
    {
      to: "/trades",
      label: "Trades",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6" />
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 0 0 2-2V7l-6-4H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2z" />
        </svg>
      ),
    },
    {
      to: "/analytics",
      label: "Analytics",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18" />
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M7 15l4-4 3 3 5-7" />
        </svg>
      ),
    },
    {
      to: "/player-search",
      label: "Search",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="11" cy="11" r="7" strokeWidth="2" />
          <path d="M20 20l-3.5-3.5" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
    },
  ];

  const isActive = (to) => (to === "/" ? pathname === "/" : pathname.startsWith(to));

  return (
    <>
      {/* Spacer so content never hides behind nav + safe-area */}
      <div style={{ height: `calc(${NAV_H}px + env(safe-area-inset-bottom))` }} />
      <nav
        className="
          fixed bottom-0 left-0 right-0 z-30
          bg-gray-950/80 backdrop-blur-xl border-t border-white/10
        "
        style={{
          height: `calc(${NAV_H}px + env(safe-area-inset-bottom))`,
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {/* Subtle top glow line */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-px left-0 right-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${LIME}, transparent)` }}
        />
        <div className="h-full flex items-center justify-around px-2 gap-1">
          {tabs.map((t) => (
            <Item key={t.to} to={t.to} label={t.label} icon={t.icon} active={isActive(t.to)} />
          ))}
        </div>
      </nav>
    </>
  );
}