// src/v2/hooks/useRecommendationFeeds.js
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export function useOpportunities({ limit = 10 } = {}) {
  return useQuery({
    queryKey: ["v2", "recommendations", "opportunities", limit],
    queryFn: async () => (await api.get("/api/v2/recommendations/opportunities", { params: { limit } })).data,
    staleTime: 60_000,
  });
}

export function useHighConfidence({ limit = 10, minConfidence = 70 } = {}) {
  return useQuery({
    queryKey: ["v2", "recommendations", "highConfidence", limit, minConfidence],
    queryFn: async () =>
      (await api.get("/api/v2/recommendations/high-confidence", { params: { limit, min_confidence: minConfidence } })).data,
    staleTime: 60_000,
  });
}

export function useCardsToAvoid({ limit = 10 } = {}) {
  return useQuery({
    queryKey: ["v2", "recommendations", "avoid", limit],
    queryFn: async () => (await api.get("/api/v2/recommendations/avoid", { params: { limit } })).data,
    staleTime: 60_000,
  });
}
