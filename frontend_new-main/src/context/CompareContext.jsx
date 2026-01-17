import React, { createContext, useContext, useState, useCallback } from "react";
import { fetchCompare, normalizePlatform } from "../api/compare";

const CompareCtx = createContext(null);
export const useCompare = () => useContext(CompareCtx);

export function CompareProvider({ children, defaultPlatform = "ps" }) {
  const [selected, setSelected] = useState([]); // up to 2 card ids (string or number)
  const [platform, setPlatform] = useState(normalizePlatform(defaultPlatform));
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggle = useCallback((id) => {
    const pid = String(id);
    setSelected((prev) => {
      const exists = prev.includes(pid);
      if (exists) return prev.filter((x) => x !== pid);
      if (prev.length >= 2) return [prev[1], pid];
      return [...prev, pid];
    });
  }, []);

  const clear = useCallback(() => setSelected([]), []);

  const openModal = useCallback(async () => {
    if (!selected.length) return;
    setLoading(true);
    setError("");
    try {
      const { players } = await fetchCompare({ ids: selected.join(","), platform, includePC: true, includeSales: true });
      setData(players);
      setOpen(true);
    } catch (e) {
      setError(e?.message || "Failed to load compare data");
    } finally {
      setLoading(false);
    }
  }, [selected, platform]);

  const value = { selected, toggle, clear, platform, setPlatform, openModal, open, setOpen, data, loading, error };
  return <CompareCtx.Provider value={value}>{children}</CompareCtx.Provider>;
}
