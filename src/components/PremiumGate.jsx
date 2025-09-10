import React from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { useEntitlements } from "../hooks/useEntitlements";

/**
 * Small default note shown when access is blocked.
 * You can also import and use <GateNote /> directly in cards/widgets.
 */
export function GateNote({
  title = "Premium feature",
  message = "Upgrade to unlock this feature.",
  ctaText = "See plans",
  to = "/billing",
}) {
  return (
    <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-4">
      <div className="flex items-center gap-2 text-gray-200">
        <Lock size={14} />
        <span className="text-sm font-semibold">{title}</span>
      </div>
      <p className="text-xs text-gray-400 mt-1">{message}</p>
      <Link
        to={to}
        className="inline-flex items-center text-xs mt-2 px-3 py-1 rounded-lg bg-gray-800 border border-gray-700 hover:border-gray-600"
      >
        {ctaText} →
      </Link>
    </div>
  );
}

GateNote.propTypes = {
  title: PropTypes.string,
  message: PropTypes.string,
  ctaText: PropTypes.string,
  to: PropTypes.string,
};

/**
 * PremiumGate — wraps routes, pages, or widgets.
 * If `requirePremium` is true, any premium is enough.
 * Otherwise, provide a specific `featureKey` to check.
 */
export default function PremiumGate({
  children,
  requirePremium = false,
  featureKey,
  fallback,
}) {
  const { isLoading, isPremium, hasFeature } = useEntitlements();

  if (isLoading) {
    return fallback || (
      <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-4 animate-pulse h-[120px]" />
    );
  }

  const allowed = requirePremium
    ? !!isPremium
    : featureKey
    ? !!hasFeature?.(featureKey)
    : !!isPremium;

  if (allowed) return children;

  return (
    fallback || (
      <GateNote
        title="Premium required"
        message={
          featureKey
            ? "This feature is available on Pro."
            : "Upgrade to unlock premium features."
        }
      />
    )
  );
}

PremiumGate.propTypes = {
  children: PropTypes.node,
  requirePremium: PropTypes.bool,
  featureKey: PropTypes.string, // e.g. "smart_buy" or "smart_trending"
  fallback: PropTypes.node,
};
