// src/context/SettingsContext.jsx
import { createContext, useContext, useEffect, useReducer } from "react";

/**
 * Minimal, LOCAL-ONLY settings.
 * - No network calls (prevents the '<!doctype' JSON parse error).
 * - Persists to localStorage.
 */

const SettingsContext = createContext(null);

const DEFAULTS = {
  // General
  date_format: "DD/MM/YYYY",
  time_format: "24h",
  timezone: "Europe/London",
  coin_format: "full_commas",      // "short_m" | "european_kk" | "full_commas" | "dot_thousands" | "space_thousands"
  compact_threshold: 100000,
  compact_decimals: 1,

  // Trading defaults
  default_platform: "Console",
  default_quantity: 1,
  include_tax_in_profit: true,

  // Widgets
  visible_widgets: [
    "profit","trades","roi","winrate","avg_profit","best_trade",
    "volume","profit_trend","tax","balance","latest_trade","top_earner"
  ],
};

const initialState = {
  ...DEFAULTS,
  isLoading: true,
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_ALL":
      return { ...state, ...action.payload, isLoading: false };
    case "UPDATE":
      return { ...state, [action.key]: action.value };
    case "DONE_LOADING":
      return { ...state, isLoading: false };
    default:
      return state;
  }
}

export const SettingsProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Load from localStorage once
  useEffect(() => {
    try {
      const raw = localStorage.getItem("user_settings");
      if (raw) {
        const parsed = JSON.parse(raw);
        dispatch({ type: "SET_ALL", payload: { ...DEFAULTS, ...parsed } });
        return;
      }
    } catch (e) {
      console.warn("Settings load failed (using defaults):", e);
    }
    dispatch({ type: "SET_ALL", payload: { ...DEFAULTS } });
  }, []);

  // Save helper
  const saveSettings = (partial) => {
    dispatch({ type: "SET_ALL", payload: { ...state, ...partial } });
    try {
      localStorage.setItem("user_settings", JSON.stringify({ ...state, ...partial }));
    } catch (e) {
      console.warn("Settings save failed:", e);
    }
  };

  // Convenience getters used in UI
  const default_platform = state.default_platform;
  const custom_tags = state.custom_tags || [];

  const value = {
    ...state,
    saveSettings,
    default_platform,
    custom_tags,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within a SettingsProvider");
  return ctx;
};