// src/v2/hooks/usePlayerSummary.js
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export function usePlayerSummary(cardId) {
  return useQuery({
    queryKey: ["v2", "player", "summary", cardId],
    queryFn: async () => {
      const res = await api.get(`/api/v2/players/${cardId}/summary`);
      return res.data;
    },
    enabled: !!cardId,
    staleTime: 5 * 60_000, // matches fair_value_mv's own refresh cadence
  });
}
