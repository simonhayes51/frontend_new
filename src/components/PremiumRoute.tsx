import React from "react";
import { PremiumGate } from "./PremiumGate";

type Props = {
  requirePremium?: boolean;
  requiredFeature?: string;
  children: React.ReactNode;
};

const PremiumRoute: React.FC<Props> = ({ requirePremium, requiredFeature, children }) => {
  return (
    <PremiumGate
      mode="route"
      requirePremium={requirePremium}
      requiredFeature={requiredFeature}
      // Optional: custom route loading skeleton
      loadingFallback={<div className="p-6">Checking your plan…</div>}
    >
      {children}
    </PremiumGate>
  );
};

export default PremiumRoute;
