import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

const SettingsContext = createContext(null);

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
];

const DEFAULT_VISIBLE = [
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
];

export const SettingsProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Core settings
  const [include_tax_in_profit, setIncludeTaxInProfit] = useState(true);
  const [visible_widgets, setVisibleWidgets] = useState(DEFAULT_VISIBLE);
  const [widget_order, setWidgetOrder] = useState(DEFAULT_WIDGET_ORDER);

  // Formatters your Dashboard already uses
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

  // You can swap these endpoints to match your backend
  async function fetchSettings() {
    try {
      setIsLoading(true);
      setError(null);
      const r = await fetch("/api/settings", { credentials: "include" });
      if (!r.ok) throw new Error(`Failed to load settings (${r.status})`);
      const data = await r.json();

      setIncludeTaxInProfit(Boolean(data?.include_tax_in_profit ?? true));

      // Ensure arrays with sensible fallbacks
      setVisibleWidgets(
        Array.isArray(data?.visible_widgets) && data.visible_widgets.length
          ? data.visible_widgets
          : DEFAULT_VISIBLE
      );

      setWidgetOrder(
        Array.isArray(data?.widget_order) && data.widget_order.length
          ? data.widget_order
          : DEFAULT_WIDGET_ORDER
      );
    } catch (e) {
      setError(e);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist
  async function saveSettings(partial) {
    // Optimistic update
    if (partial?.include_tax_in_profit !== undefined) {
      setIncludeTaxInProfit(Boolean(partial.include_tax_in_profit));
    }
    if (partial?.visible_widgets) {
      setVisibleWidgets([...partial.visible_widgets]);
    }
    if (partial?.widget_order) {
      setWidgetOrder([...partial.widget_order]);
    }

    try {
      const r = await fetch("/api/settings", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          include_tax_in_profit,
          visible_widgets,
          widget_order,
          ...partial,
        }),
      });
      if (!r.ok) throw new Error(`Failed to save settings (${r.status})`);
    } catch (e) {
      console.error("Settings save failed:", e);
      setError(e);
      // (Optional) refetch to re-sync
      fetchSettings();
    }
  }

  const value = {
    isLoading,
    error,
    include_tax_in_profit,
    visible_widgets,
    widget_order,
    setVisibleWidgets,
    setWidgetOrder,
    saveSettings,
    // formatters already used in your app
    formatCurrency,
    formatDate,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = () => useContext(SettingsContext);
