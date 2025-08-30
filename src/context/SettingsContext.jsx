import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

const SettingsContext = createContext(null);

// Include "top_earner" in defaults
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

export const SettingsProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [include_tax_in_profit, setIncludeTaxInProfit] = useState(true);
  const [visible_widgets, setVisibleWidgets] = useState(DEFAULT_VISIBLE);
  const [widget_order, setWidgetOrder] = useState(DEFAULT_WIDGET_ORDER);
  const [recent_trades_limit, setRecentTradesLimit] = useState(5);

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

  useEffect(() => {
    try {
      const saved = localStorage.getItem("user_settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.include_tax_in_profit !== undefined) {
          setIncludeTaxInProfit(parsed.include_tax_in_profit);
        }
        if (Array.isArray(parsed.visible_widgets)) {
          setVisibleWidgets(parsed.visible_widgets);
        }
        if (Array.isArray(parsed.widget_order)) {
          setWidgetOrder(parsed.widget_order);
        }
        if (Number.isFinite(parsed.recent_trades_limit)) {
          setRecentTradesLimit(parsed.recent_trades_limit);
        }
      }
    } catch (e) {
      console.error("Failed to load settings from localStorage", e);
      setError(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveSettings = (partial) => {
    const merged = {
      include_tax_in_profit,
      visible_widgets,
      widget_order,
      recent_trades_limit,
      ...partial,
    };

    if (partial.include_tax_in_profit !== undefined) {
      setIncludeTaxInProfit(partial.include_tax_in_profit);
    }
    if (partial.visible_widgets) {
      setVisibleWidgets([...partial.visible_widgets]);
    }
    if (partial.widget_order) {
      setWidgetOrder([...partial.widget_order]);
    }
    if (partial.recent_trades_limit !== undefined) {
      setRecentTradesLimit(partial.recent_trades_limit);
    }

    try {
      localStorage.setItem("user_settings", JSON.stringify(merged));
    } catch (e) {
      console.error("Failed to save settings to localStorage", e);
      setError(e);
    }
  };

  const value = {
    isLoading,
    error,
    include_tax_in_profit,
    visible_widgets,
    widget_order,
    recent_trades_limit,
    setVisibleWidgets,
    setWidgetOrder,
    setRecentTradesLimit,
    saveSettings,
    formatCurrency,
    formatDate,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = () => useContext(SettingsContext);
