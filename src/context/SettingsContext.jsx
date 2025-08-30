import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

const SettingsContext = createContext(null);

// Default widget order (includes Top Earner)
const DEFAULT_WIDGET_ORDER = [
  "profit",
  "trades",
  "roi",
  "winrate",
  "avg_profit",
  "best_trade",
  "volume",
  "profit_trend",
  "tax",
  "balance",
  "latest_trade",
  "top_earner",
];
const DEFAULT_VISIBLE = [...DEFAULT_WIDGET_ORDER];

// Any extra preferences can live here as well (used by Trading tab)
const DEFAULTS = {
  include_tax_in_profit: true,
  visible_widgets: DEFAULT_VISIBLE,
  widget_order: DEFAULT_WIDGET_ORDER,
  recent_trades_limit: 5,
  // “Trading” page example prefs (optional)
  default_platform: "Console",
  default_quantity: 1,
};

export const SettingsProvider = ({ children }) => {
  const [state, setState] = useState({
    ...DEFAULTS,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helpers
  const formatCurrency = useCallback((n) => {
    const v = Number.isFinite(n) ? n : 0;
    return v.toLocaleString("en-GB");
  }, []);

  const formatDate = useCallback((d) => {
    const dt = d instanceof Date ? d : new Date(d);
    return dt.toLocaleString("en-GB", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  // Load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("user_settings");
      if (raw) {
        const parsed = JSON.parse(raw);
        setState((s) => ({ ...s, ...parsed }));
      }
    } catch (e) {
      console.error("Failed to load settings from localStorage", e);
      setError(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save any partial update
  const saveSettings = (partial) => {
    setState((prev) => {
      const merged = { ...prev, ...partial };
      try {
        localStorage.setItem("user_settings", JSON.stringify(merged));
      } catch (e) {
        console.error("Failed to save settings to localStorage", e);
        setError(e);
      }
      return merged;
    });
  };

  const value = {
    ...state,
    isLoading,
    error,
    saveSettings,
    formatCurrency,
    formatDate,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = () => useContext(SettingsContext);