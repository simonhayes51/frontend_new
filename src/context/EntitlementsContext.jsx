// src/context/EntitlementsContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const EntitlementsContext = createContext({
  isPremium: false,
  limits: { watchlist_max: 5 },
  loading: true,
  error: null,
});

export function EntitlementsProvider({ children }) {
  const API = import.meta.env.VITE_API_URL || "";
  const res = await fetch(`${API}/api/entitlements`, { credentials: "include" });
  const [state, setState] = useState({
    isPremium: false,
    limits: { watchlist_max: 5 },
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Prefer a dedicated entitlements endpoint if you have one.
        // Fallback to /api/auth/me (expected to include { is_premium, limits }).
        const res = await fetch(`${API}/api/auth/me`, { credentials: "include" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const js = await res.json();
        const isPremium = !!js?.is_premium;
        const limits = js?.limits || (isPremium ? { watchlist_max: 100 } : { watchlist_max: 5 });

        if (!cancelled) {
          setState({ isPremium, limits, loading: false, error: null });
        }
      } catch (e) {
        if (!cancelled) setState(s => ({ ...s, loading: false, error: String(e?.message || e) }));
      }
    })();
    return () => { cancelled = true; };
  }, [API]);

  const value = useMemo(() => state, [state]);
  return <EntitlementsContext.Provider value={value}>{children}</EntitlementsContext.Provider>;
}

export function useEntitlements() {
  return useContext(EntitlementsContext);
}
