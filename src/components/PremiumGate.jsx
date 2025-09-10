// src/components/PremiumGate.jsx
import React from "react";
import { useEntitlements } from "../context/EntitlementsContext";
import { Link } from "react-router-dom";

export default function PremiumGate({ feature = null, requirePremium = true, children }) {
  const { loading, isPremium, features } = useEntitlements();

  if (loading) return null;

  const allowed =
    requirePremium ? isPremium : feature ? features.includes(feature) : true;

  if (allowed) return children || null;

  return (
    <div className="bg-gray-900/70 border border-gray-800 rounded-xl p-4">
      <div className="text-sm font-semibold text-gray-200 flex items-center gap-2">
        <span className="inline-block w-5 h-5 rounded-full bg-gray-800 text-center">🔒</span>
        Premium required
      </div>
      <p className="text-xs text-gray-400 mt-1">
        Upgrade to unlock premium features.
      </p>
      <Link
        to="/billing"
        className="inline-block mt-2 text-xs px-3 py-1 rounded-lg bg-gray-800 border border-gray-700 hover:border-gray-600"
      >
        See plans →
      </Link>
    </div>
  );
}
