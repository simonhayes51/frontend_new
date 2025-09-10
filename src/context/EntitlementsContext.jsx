// src/context/EntitlementsContext.jsx
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const EntitlementsContext = createContext({
  isPremium: false,
  features: [],
  limits: { watchlist_max: 3, trending: { timeframes: ["24h"], limit: 5, smart: false } },
  roles: [],
  plan: null,
  loading: true,
  error: null,
  hasFeature: () => false,
  refreshEntitlements: () => {},
});

export function EntitlementsProvider({ children }) {
  const API = import.meta.env.VITE_API_URL || "";

  const [state, setState] = useState({
    isPremium: false,
    features: [],
    limits: { watchlist_max: 3, trending: { timeframes: ["24h"], limit: 5, smart: false } },
    roles: [],
    plan: null,
    loading: true,
    error: null,
  });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await fetch(`${API}/api/entitlements`, { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const js = await res.json();
      setState({
        isPremium: Boolean(js.is_premium),
        features: Array.isArray(js.features) ? js.features : [],
        limits: js.limits || { watchlist_max: 3, trending: { timeframes: ["24h"], limit: 5, smart: false } },
        roles: Array.isArray(js.roles) ? js.roles : [],
        plan: js.plan || null,
        loading: false,
        error: null,
      });
    } catch (e) {
      setState((s) => ({ ...s, loading: false, error: e?.message || "Failed to load entitlements" }));
    }
  }, [API]);

  useEffect(() => {
    load();
  }, [load]);

  const value = useMemo(
    () => ({
      ...state,
      hasFeature: (key) => state.isPremium || (state.features || []).includes(key),
      refreshEntitlements: load,
    }),
    [state, load]
  );

  return <EntitlementsContext.Provider value={value}>{children}</EntitlementsContext.Provider>;
}

export function useEntitlements() {
  return useContext(EntitlementsContext);
}
