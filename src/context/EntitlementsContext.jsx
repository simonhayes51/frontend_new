// src/context/EntitlementsContext.jsx
import React, { createContext, useContext, useEffect, useState, useMemo } from "react";

const EntitlementsContext = createContext(null);

export function EntitlementsProvider({ children }) {
  const API = import.meta.env.VITE_API_URL || "";
  const [state, setState] = useState({
    loading: true,
    isPremium: false,
    features: [],
    limits: { watchlist_max: 3, trending: { timeframes: ["24h"], limit: 5, smart: false } },
    roles: [],
  });

  useEffect(() => {
    let abort = false;
    (async () => {
      try {
        const res = await fetch(`${API}/api/entitlements`, { credentials: "include" });
        const data = await res.json();
        if (!abort) {
          setState({
            loading: false,
            isPremium: Boolean(data?.is_premium),
            features: Array.isArray(data?.features) ? data.features : [],
            limits: data?.limits || { watchlist_max: 3, trending: { timeframes: ["24h"], limit: 5, smart: false } },
            roles: Array.isArray(data?.roles) ? data.roles : [],
          });
        }
      } catch {
        if (!abort) setState(s => ({ ...s, loading: false }));
      }
    })();
    return () => { abort = true; };
  }, [API]);

  const value = useMemo(() => state, [state]);
  return <EntitlementsContext.Provider value={value}>{children}</EntitlementsContext.Provider>;
}

export function useEntitlements() {
  const ctx = useContext(EntitlementsContext);
  if (!ctx) throw new Error("useEntitlements must be used within EntitlementsProvider");
  return ctx;
}
