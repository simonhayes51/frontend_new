// src/v2/hooks/useSbcEventImpact.js
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export function useSbcEventImpact(eventId) {
  return useQuery({
    queryKey: ["v2", "sbc", "eventImpact", eventId],
    queryFn: async () => (await api.get(`/api/v2/sbc/events/${eventId}/impact`)).data,
    enabled: !!eventId,
    staleTime: 60_000,
  });
}
