// src/components/PremiumRoute.tsx
import React from "react";
import { Outlet } from "react-router-dom";
import { useEntitlements } from "../context/EntitlementsContext";
import PremiumGate from "./PremiumGate";

type Props = {
  /** "any" means any premium; or pass a specific backend feature key */
  feature?: "smart_buy" | "trade_finder" | "deal_confidence" | "backtest" | "smart_trending" | "any";
  children?: React.ReactNode;
};

export default function PremiumRoute({ feature = "any", children }: Props) {
  const { loading, isPremium, features } = useEntitlements();

  if (loading) return null;

  const ok = feature === "any" ? isPremium : features.includes(feature as any);

  if (!ok) {
    return <PremiumGate requirePremium={feature === "any"} feature={feature !== "any" ? (feature as any) : undefined} />;
  }

  return <>{children ?? <Outlet />}</>;
}
