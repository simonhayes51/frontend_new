import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function MobileNavigation() {
  const { pathname } = useLocation();

  const Item = ({ to, label, icon }) => (
    <Link
      to={to}
      className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 ${
        pathname === to ? "text-white" : "text-gray-400 hover:text-gray-200"
      }`}
    >
      <span className="w-6 h-6">{icon}</span>
      <span className="text-[11px]">{label}</span>
    </Link>
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900/90 backdrop-blur border-t border-gray-800 flex">
      <Item
        to="/"
        label="Dashboard"
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-9 9 9" />
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 21V9h6v12" />
          </svg>
        }
      />
      <Item
        to="/add-trade"
        label="Add Trade"
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        }
      />
      <Item
        to="/trades"
        label="Trades"
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6" />
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 0 0 2-2V7l-6-4H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2z" />
          </svg>
        }
      />
      <Item
        to="/analytics"
        label="Analytics"
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18" />
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M7 15l4-4 3 3 5-7" />
          </svg>
        }
      />
    </nav>
  );
}
