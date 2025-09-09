// src/components/PremiumGate.jsx
import React from "react";
import { Lock } from "lucide-react";
import { useEntitlements } from "@/context/EntitlementsContext";
import { Link } from "react-router-dom";

export default function PremiumGate({ feature, children, variant = "card", title }) {
  const me = useEntitlements();
  const allowed = me?.is_premium || me?.features?.has?.(feature);

  if (me.loading) {
    return variant === "inline" ? (
      <div className="h-10 animate-pulse bg-slate-800/40 rounded-xl" />
    ) : (
      <div className="h-48 animate-pulse bg-slate-800/40 rounded-2xl" />
    );
  }
  if (allowed) return children;

  // locked view
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      {title && <h3 className="text-base font-semibold mb-1">{title}</h3>}
      <div className="absolute inset-0 backdrop-blur-[2px] opacity-60 pointer-events-none" />
      <div className="relative flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800">
          <Lock className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-slate-200">
            This is a <span className="text-lime-400 font-medium">Premium</span> feature.
          </p>
          <p className="text-xs text-slate-400">
            Upgrade to unlock Smart Buy, Trade Finder, Deal Confidence & Backtesting.
          </p>
        </div>
        <Link
          to="/billing"
          className="rounded-xl bg-lime-500/90 hover:bg-lime-400 text-black text-sm font-semibold px-3 py-1.5"
        >
          Upgrade £3/mo
        </Link>
      </div>
    </div>
  );
}
