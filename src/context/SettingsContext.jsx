import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

const SettingsContext = createContext(null);

// ===== Defaults =====
const DEFAULT_GENERAL = {
  dateFormat: "DD/MM/YYYY",
  timeFormat: "24h",
  timezone: "Europe/London",
  coinFormat: "short_m",
  compactThreshold: 100000,
  compactDecimals: 1,
};

const DEFAULT_WIDGET_ORDER = [
  "profit",
  "tax",
  "trades",
  "profit_trend",
  "winrate",
  "avg_profit",
  "best_trade",
  "volume",
  "latest_trade",
  "top_earner",
  "balance",

  // new widgets (you can reorder later)
  "promo",
  "trending",
  "alerts",
];
const DEFAULT_VISIBLE = [...DEFAULT_WIDGET_ORDER];
const DEFAULT_RECENT_TRADES_LIMIT = 5;

// Watchlist alert settings (client-side for now)
const DEFAULT_ALERTS = {
  enabled: false,
  thresholdPct: 5,   // alert when |Δ%| >= threshold
  cooldownMin: 30,   // per card cool-down (UI only right now)
  delivery: "inapp", // "inapp" | "discord"
};

export const SettingsProvider = ({ children }) => {
  const [general, setGeneral] = useState(DEFAULT_GENERAL);
  const [portfolio, setPortfolio] = useState({ startingCoins: 0 });
  const [include_tax_in_profit, setIncludeTaxInProfit] = useState(true);

  // overview/legacy
  const [visible_widgets, setVisibleWidgets] = useState(DEFAULT_VISIBLE);
  const [widget_order, setWidgetOrder] = useState(DEFAULT_WIDGET_ORDER);
  const [recent_trades_limit, setRecentTradesLimit] = useState(DEFAULT_RECENT_TRADES_LIMIT);

  // alerts
  const [alerts, setAlerts] = useState(DEFAULT_ALERTS);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // ---------- Formatters ----------
  const formatCurrency = useCallback((n) => (Number(n) || 0).toLocaleString("en-GB"), []);
  const formatDate = useCallback((d) => {
    const dt = d instanceof Date ? d : new Date(d);
    return new Intl.DateTimeFormat("en-GB", {
      year: "numeric", month: "short", day: "2-digit",
      hour: "2-digit", minute: "2-digit",
      hour12: (general.timeFormat ?? "24h") === "12h",
      timeZone: general.timezone || "Europe/London",
    }).format(dt);
  }, [general]);
  const formatCoins = useCallback((n, g = general) => {
    const toFull = (x) => (Number(x) || 0).toLocaleString("en-GB");
    const cfg = { coinFormat: g.coinFormat, compactThreshold: g.compactThreshold, compactDecimals: g.compactDecimals };
    if (cfg.coinFormat === "short_m" && n >= cfg.compactThreshold) {
      if (n >= 1_000_000) return (n/1_000_000).toFixed(cfg.compactDecimals).replace(/\.0+$/,"")+"M";
      if (n >= 1_000)     return (n/1_000).toFixed(cfg.compactDecimals).replace(/\.0+$/,"")+"k";
    }
    return toFull(n);
  }, [general]);

  // ---------- Load settings ----------
  useEffect(() => {
    (async () => {
      try {
        // hydrate from localStorage first (prevents flicker)
        try {
          const raw = localStorage.getItem("user_settings");
          if (raw) {
            const ls = JSON.parse(raw);
            if (Array.isArray(ls.visible_widgets)) setVisibleWidgets(ls.visible_widgets);
            if (Array.isArray(ls.widget_order)) setWidgetOrder(ls.widget_order);
            if (Number.isFinite(ls.recent_trades_limit)) setRecentTradesLimit(ls.recent_trades_limit);
            if (typeof ls.include_tax_in_profit === "boolean") setIncludeTaxInProfit(ls.include_tax_in_profit);
          }
          const rawAlerts = localStorage.getItem("alerts_settings");
          if (rawAlerts) setAlerts({ ...DEFAULT_ALERTS, ...JSON.parse(rawAlerts) });
        } catch {}

        // fetch server
        const [sRes, pRes] = await Promise.all([fetch("/api/settings"), fetch("/api/profile")]);
        const s = await sRes.json();
        const p = await pRes.json();

        setGeneral((g) => ({
          ...g,
          timezone: s.timezone || g.timezone,
          dateFormat: s.date_format === "US" ? "MM/DD/YYYY" : s.date_format === "ISO" ? "YYYY-MM-DD" : g.dateFormat,
        }));
        setIncludeTaxInProfit(typeof s.include_tax_in_profit === "boolean" ? s.include_tax_in_profit : true);
        setPortfolio({ startingCoins: p?.startingBalance ?? 0 });

        // merge server-visible with defaults so new widgets appear for existing users (but still removable)
        const serverVisible = Array.isArray(s.visible_widgets) ? s.visible_widgets : [];
        const mergedVisible = Array.from(new Set([...(serverVisible.length ? serverVisible : DEFAULT_VISIBLE), ...DEFAULT_VISIBLE]));
        setVisibleWidgets(mergedVisible);

        if (!widget_order?.length) setWidgetOrder(DEFAULT_WIDGET_ORDER);

        // persist compact legacy snapshot
        localStorage.setItem("user_settings", JSON.stringify({
          visible_widgets: mergedVisible,
          widget_order: DEFAULT_WIDGET_ORDER,
          recent_trades_limit: DEFAULT_RECENT_TRADES_LIMIT,
          include_tax_in_profit: typeof s.include_tax_in_profit === "boolean" ? s.include_tax_in_profit : true,
        }));
        if (!localStorage.getItem("alerts_settings")) {
          localStorage.setItem("alerts_settings", JSON.stringify(DEFAULT_ALERTS));
        }
      } catch (e) {
        console.error("Settings load failed:", e);
        setError(e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []); // eslint-disable-line

  // ---------- Save partial updates ----------
  const saveSettings = async (partial) => {
    if (partial.general) setGeneral((g) => ({ ...g, ...partial.general }));
    if (partial.portfolio) setPortfolio((p) => ({ ...p, ...partial.portfolio }));
    if (partial.visible_widgets) setVisibleWidgets(partial.visible_widgets);
    if (partial.widget_order) setWidgetOrder(partial.widget_order);
    if (partial.recent_trades_limit !== undefined) setRecentTradesLimit(partial.recent_trades_limit);
    if (typeof partial.include_tax_in_profit === "boolean") setIncludeTaxInProfit(partial.include_tax_in_profit);
    if (partial.alerts) {
      setAlerts((a) => {
        const next = { ...a, ...partial.alerts };
        localStorage.setItem("alerts_settings", JSON.stringify(next));
        return next;
      });
    }

    // persist legacy snapshot
    const ls = JSON.parse(localStorage.getItem("user_settings") || "{}");
    localStorage.setItem("user_settings", JSON.stringify({
      ...ls,
      ...(partial.visible_widgets ? { visible_widgets: partial.visible_widgets } : {}),
      ...(partial.widget_order ? { widget_order: partial.widget_order } : {}),
      ...(partial.recent_trades_limit !== undefined ? { recent_trades_limit: partial.recent_trades_limit } : {}),
      ...(typeof partial.include_tax_in_profit === "boolean" ? { include_tax_in_profit: partial.include_tax_in_profit } : {}),
    }));

    // server: portfolio + general + visible_widgets + include_tax_in_profit
    if (partial.portfolio?.startingCoins !== undefined) {
      try {
        await fetch("/api/portfolio/balance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ starting_balance: partial.portfolio.startingCoins }),
        });
      } catch (e) { setError(e); }
    }
    if (partial.general || partial.visible_widgets || typeof partial.include_tax_in_profit === "boolean") {
      const g = { ...general, ...(partial.general || {}) };
      const mapped = {
        timezone: g.timezone,
        date_format: g.dateFormat === "MM/DD/YYYY" ? "US" : g.dateFormat === "YYYY-MM-DD" ? "ISO" : "EU",
        default_platform: "Console",
        custom_tags: [],
        currency_format: "coins",
        theme: "dark",
        include_tax_in_profit: typeof partial.include_tax_in_profit === "boolean" ? partial.include_tax_in_profit : include_tax_in_profit,
        default_chart_range: "30d",
        visible_widgets: partial.visible_widgets || visible_widgets,
      };
      try {
        await fetch("/api/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(mapped),
        });
      } catch (e) { setError(e); }
    }
  };

  const settings = { general, portfolio, visible_widgets, widget_order, recent_trades_limit, alerts };

  return (
    <SettingsContext.Provider value={{
      settings,
      general, portfolio,
      visible_widgets, widget_order, recent_trades_limit,
      alerts, include_tax_in_profit,
      isLoading, error,
      saveSettings, formatCurrency, formatDate, formatCoins,
      default_platform: "Console", default_quantity: 1,
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
export default SettingsContext;
