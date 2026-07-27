// src/v2/hooks/useDashboard.js
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export function useDashboardStats() {
  return useQuery({
    queryKey: ["v2", "dashboard", "stats"],
    queryFn: async () => {
      const res = await api.get("/api/dashboard/stats");
      return res.data;
    },
    staleTime: 60_000,
  });
}

export function useDashboardActivity() {
  return useQuery({
    queryKey: ["v2", "dashboard", "activity"],
    queryFn: async () => {
      const res = await api.get("/api/dashboard/activity");
      return res.data;
    },
    staleTime: 60_000,
  });
}
