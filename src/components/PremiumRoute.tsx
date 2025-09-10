import React from "react";
import PremiumGate from "./PremiumGate"; // ⬅️ default import (not { PremiumGate })

type Props = {
  requirePremium?: boolean;
  featureKey?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
};

export default function PremiumRoute({
  children,
  requirePremium,
  featureKey,
  fallback,
}: Props) {
  return (
    <PremiumGate
      requirePremium={requirePremium}
      featureKey={featureKey}
      fallback={fallback}
    >
      {children}
    </PremiumGate>
  );
}
