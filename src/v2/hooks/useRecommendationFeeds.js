// src/v2/hooks/useRecommendationFeeds.js
//
// __skipAuthRedirect: these feeds sit on the public-first Home
// Dashboard (opportunity_feed is now gated - Phase 4), so a 401 for a
// logged-out visitor is an expected, handled response (renders a
// PremiumGate upsell), not a reason for axios's global interceptor to
// hijack the whole page to /login - same reasoning/pattern as
// useWatchlist.js.
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export function useOpportunities({ limit = 10 } = {}) {
  return useQuery({
    queryKey: ["v2", "recommendations", "opportunities", limit],
    queryFn: async () =>
      (await api.get("/api/v2/recommendations/opportunities", { params: { limit }, __skipAuthRedirect: true })).data,
    staleTime: 60_000,
  });
}

export function useHighConfidence({ limit = 10, minConfidence = 70 } = {}) {
  return useQuery({
    queryKey: ["v2", "recommendations", "highConfidence", limit, minConfidence],
    queryFn: async () =>
      (
        await api.get("/api/v2/recommendations/high-confidence", {
          params: { limit, min_confidence: minConfidence },
          __skipAuthRedirect: true,
        })
      ).data,
    staleTime: 60_000,
  });
}

export function useCardsToAvoid({ limit = 10 } = {}) {
  return useQuery({
    queryKey: ["v2", "recommendations", "avoid", limit],
    queryFn: async () =>
      (await api.get("/api/v2/recommendations/avoid", { params: { limit }, __skipAuthRedirect: true })).data,
    staleTime: 60_000,
  });
}

// Recommendation Engine V1.2 (backend app/routers/v2/recommendations.py)
// evaluates every strategy independently against its own thresholds -
// there is no single global "opportunities" score a card either meets
// or doesn't, so the Home Dashboard needs one feed per strategy rather
// than one merged board. `strategy` must be one of the backend's
// STRATEGY_ORDER keys (quick_flip/swing_trade/low_risk/long_hold/
// lazy_buyer/sbc); an unknown value 404s server-side rather than
// silently returning an unfiltered feed.
export function useStrategyRecommendations(strategy, { limit = 8 } = {}) {
  return useQuery({
    queryKey: ["v2", "recommendations", "strategy", strategy, limit],
    queryFn: async () =>
      (
        await api.get(`/api/v2/recommendations/strategy/${strategy}`, {
          params: { limit },
          __skipAuthRedirect: true,
        })
      ).data,
    enabled: !!strategy,
    staleTime: 60_000,
  });
}
