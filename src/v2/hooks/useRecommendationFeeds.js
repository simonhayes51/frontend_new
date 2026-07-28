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
