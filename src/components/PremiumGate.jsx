import React from "react";
import UpsellCard from "./UpsellCard";
import { useLocation, Navigate } from "react-router-dom";
import { useEntitlements } from "../hooks/useEntitlements";

type Props = {
  /** Set true to require any premium; otherwise supply a specific feature key */
  requirePremium?: boolean;
  requiredFeature?: string;
  /** If used inside a route and you prefer redirect over inline upsell */
  mode?: "widget" | "route";
  /** Shown while loading */
  loadingFallback?: React.ReactNode;
  /** What to render if blocked (widget mode). Defaults to UpsellCard. */
  fallback?: React.ReactNode;
  children: React.ReactNode;
};

export const PremiumGate: React.FC<Props> = ({
  requirePremium = false,
  requiredFeature,
  mode = "widget",
  loadingFallback = (
    <div className="animate-pulse h-24 rounded-2xl bg-black/5 dark:bg-white/10" />
  ),
  fallback,
  children,
}) => {
  const { status, ...rest } = useEntitlements();
  const location = useLocation();

  if (status === "loading" || status === "idle") {
    return <>{loadingFallback}</>;
  }
  if (status === "error") {
    // Fail-closed for safety: block premium features if we can't verify
    return mode === "route"
      ? <Navigate to={`/billing?from=${encodeURIComponent(location.pathname + location.search)}`} replace />
      : (fallback ?? <UpsellCard from={location.pathname + location.search} />);
  }

  const data = (rest as any).data;
  const isAuthed = data?.authenticated !== false; // treat undefined as authed (some endpoints omit)
  const isPremium = !!data?.is_premium;
  const features: Record<string, boolean> | undefined = data?.features;

  // decide requirement
  const requiresPremium = requirePremium || !!requiredFeature;
  const hasFeature = requiredFeature
    ? (features ? !!features[requiredFeature] : isPremium) // if features unknown, premium implies
    : isPremium;

  const allowed = !requiresPremium || (isAuthed && hasFeature);

  if (allowed) return <>{children}</>;

  // Not allowed
  if (!isAuthed) {
    return (
      <Navigate
        to={`/auth/login?from=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    );
  }

  if (mode === "route") {
    return (
      <Navigate
        to={`/billing?from=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    );
  }

  // widget mode: inline upsell
  return <>{fallback ?? <UpsellCard from={location.pathname + location.search} />}</>;
};
