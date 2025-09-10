// src/context/EntitlementsContext.jsx - Enhanced version keeping your structure
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
    lastCheck: null,
  });

  // Check every 5 minutes for premium status
  const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

  const refreshEntitlements = async () => {
    try {
      const res = await fetch(`${API}/api/entitlements`, { credentials: "include" });
      const data = await res.json();
      
      const newState = {
        loading: false,
        isPremium: Boolean(data?.is_premium),
        features: Array.isArray(data?.features) ? data.features : [],
        limits: data?.limits || { watchlist_max: 3, trending: { timeframes: ["24h"], limit: 5, smart: false } },
        roles: Array.isArray(data?.roles) ? data.roles : [],
        lastCheck: new Date(),
      };

      // Check if premium status changed
      if (!state.loading && state.isPremium !== newState.isPremium) {
        console.log(`Premium status changed: ${state.isPremium} → ${newState.isPremium}`);
        
        // If user lost premium, force refresh the page to clear cached data
        if (state.isPremium && !newState.isPremium) {
          alert("Your premium subscription has expired. The page will refresh to update your access.");
          window.location.reload();
          return;
        }
      }

      setState(newState);
    } catch (error) {
      console.error("Failed to refresh entitlements:", error);
      setState(s => ({ ...s, loading: false }));
    }
  };

  // Initial load
  useEffect(() => {
    refreshEntitlements();
  }, [API]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(refreshEntitlements, CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  // Refresh on window focus (user comes back to tab)
  useEffect(() => {
    const handleFocus = () => {
      const timeSinceLastCheck = state.lastCheck ? Date.now() - state.lastCheck.getTime() : Infinity;
      
      // If it's been more than 2 minutes since last check, refresh immediately
      if (timeSinceLastCheck > 2 * 60 * 1000) {
        refreshEntitlements();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [state.lastCheck]);

  // Refresh on page visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshEntitlements();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const value = useMemo(() => ({ 
    ...state, 
    refreshEntitlements 
  }), [state]);

  return <EntitlementsContext.Provider value={value}>{children}</EntitlementsContext.Provider>;
}

export function useEntitlements() {
  const ctx = useContext(EntitlementsContext);
  if (!ctx) throw new Error("useEntitlements must be used within EntitlementsProvider");
  return ctx;
}
