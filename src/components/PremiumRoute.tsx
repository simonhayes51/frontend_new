// src/components/PremiumRoute.tsx
import React from "react";
import { Outlet } from "react-router-dom";

type Props = {
  /** Premium feature requirement - "any" means any premium; or pass a specific backend feature key */
  feature?: "smart_buy" | "trade_finder" | "deal_confidence" | "backtest" | "smart_trending" | "any";
  /** Human-readable name for the feature (e.g. "Smart Buy AI", "Advanced Market Trends") */
  featureName?: string;
  /** Child components to render if access is granted */
  children?: React.ReactNode;
};

export default function PremiumRoute({ 
  feature = "any", 
  featureName,
  children 
}: Props) {
  void feature;
  void featureName;
  return <>{children ?? <Outlet />}</>;
}
