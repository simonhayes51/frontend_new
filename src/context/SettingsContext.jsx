import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

const SettingsContext = createContext(null);

// ===== Defaults (including widgets) =====
const DEFAULT_GENERAL = {
  dateFormat: "DD/MM/YYYY",
  timeFormat: "24h",
  timezone: "Europe/London",
  coinFormat: "short_m",
  compactThreshold: 100000,
  compactDecimals: 1,
};

// New widgets are included up-front so new users see them immediately
const DEFAULT_WIDGET_ORDER = [
  "promo",        // 📅 Next Promo
  "trending",     // 📈 Trending
  "alerts",       // 🔔 Watchlist Alerts
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
const DEFAULT_RECENT_TRADES_LIMIT = 5;

export const SettingsProvider = ({ children }) => {
  const [general, setGeneral] = useState(DEFAULT_GENERAL);
  const [include_tax_in_profit, setIncludeTaxInProfit] = useState(true);

  // Portfolio (server-backed)
  const [portfolio, setPortfolio] = useState({ startingCoins: 0 });

  // Overview/legacy fields
  const [visible_widgets, setVisibleWidgets] = useState(DEFAULT_VISIBLE);
  const [widget_order, setWidgetOrder] = useState(DEFAULT_WIDGET_ORDER);
  const [recent_trades_limit, setRecentTradesLimit] = useState(DEFAULT_RECENT_TRADES_LIMIT);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // ---------- Formatters ----------
  const formatCurrency = useCallback((n) => {
    const v = Number.isFinite(n) ? n : 0;
    return v.toLocaleString("en-GB");
  }, []);

  const formatDate = useCallback(
    (d) => {
      const dt = d instanceof Date ? d : new Date(d);
      const opts = {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: (general.timeFormat ?? "24h") === "12h",
        timeZone: general.timezone || "Europe/London",
      };
      return new Intl.DateTimeFormat("en-GB", opts).format(dt);
    },
    [general]
  );

  const formatCoins = useCallback(
    (n, g = general) => {
      const cfg = {
        coinFormat: g?.coinFormat ?? "short_m",
        compactThreshold: g?.compactThreshold ?? 100000,
        compactDecimals: g?.compactDecimals ?? 1,
      };
      const toFull = (x) => x.toLocaleString("en-GB");

      if (cfg.coinFormat === "short_m" && n >= cfg.compactThreshold) {
        if (n >= 1_000_000) return (n / 1_000_000).toFixed(cfg.compactDecimals).replace(/\.0+$/, "") + "M";
        if (n >= 1_000) return (n / 1_000).toFixed(cfg.compactDecimals).replace(/\.0+$/, "") + "k";
      }
      if (cfg.coinFormat === "european_kk" && n >= cfg.compactThreshold) {
        return (n / 1_000_000).toFixed(cfg.compactDecimals).replace(/\.0+$/, "") + "kk";
      }
      if (cfg.coinFormat === "dot_thousands") return toFull(n).replaceAll(",", ".");
      if (cfg.coinFormat === "space_thousands") return toFull(n).replaceAll(",", " ");
      if (cfg.coinFormat === "full_commas") return toFull(n);
      return toFull(n);
    },
    [general]
  );

  // ---------- Load from backend + merge legacy localStorage ----------
  useEffect(() => {
    (async () => {
      try {
        // 1) Hydrate legacy first (so UI doesn’t flash)
        try {
          const raw = localStorage.getItem("user_settings");
          if (raw) {
            const ls = JSON.parse(raw);
            if (Array.isArray(ls.visible_widgets)) setVisibleWidgets(ls.visible_widgets);
            if (Array.isArray(ls.widget_order)) setWidgetOrder(ls.widget_order);
            if (Number.isFinite(ls.recent_trades_limit)) setRecentTradesLimit(ls.recent_trades_limit);
            if (typeof ls.include_tax_in_profit === "boolean") setIncludeTaxInProfit(ls.include_tax_in_profit);
          }
        } catch {}

        // 2) Fetch server
        const [sRes, pRes] = await Promise.all([fetch("/api/settings"), fetch("/api/profile")]);
        const s = await sRes.json();
        const p = await pRes.json();

        // General mapping
        const mappedGeneral = {
          ...DEFAULT_GENERAL,
          timezone: s.timezone || DEFAULT_GENERAL.timezone,
          dateFormat: s.date_format === "US" ? "MM/DD/YYYY" : s.date_format === "ISO" ? "YYYY-MM-DD" : "DD/MM/YYYY",
          coinFormat: s.coinFormat ?? DEFAULT_GENERAL.coinFormat,
          compactThreshold: s.compactThreshold ?? DEFAULT_GENERAL.compactThreshold,
          compactDecimals: s.compactDecimals ?? DEFAULT_GENERAL.compactDecimals,
          timeFormat: "24h",
        };
        setGeneral(mappedGeneral);
        setIncludeTaxInProfit(typeof s.include_tax_in_profit === "boolean" ? s.include_tax_in_profit : true);

        // Portfolio
        setPortfolio({ startingCoins: p?.startingBalance ?? 0 });

        // Widgets: take server visible list, but UNION with defaults so new widgets appear for existing users
        const serverVisible = Array.isArray(s.visible_widgets) ? s.visible_widgets : [];
        const mergedVisible = Array.from(new Set([...(serverVisible.length ? serverVisible : DEFAULT_VISIBLE), ...DEFAULT_VISIBLE]));
        setVisibleWidgets(mergedVisible);

        // Order: prefer any existing order, otherwise defaults (already includes new widgets)
        setWidgetOrder((prev) => (prev && prev.length ? prev : DEFAULT_WIDGET_ORDER));

        // Persist a compact legacy snapshot
        try {
          const existing = JSON.parse(localStorage.getItem("user_settings") || "{}");
          localStorage.setItem(
            "user_settings",
            JSON.stringify({
              ...existing,
              visible_widgets: mergedVisible,
              widget_order: DEFAULT_WIDGET_ORDER,
              recent_trades_limit: DEFAULT_RECENT_TRADES_LIMIT,
              include_tax_in_profit: typeof s.include_tax_in_profit === "boolean" ? s.include_tax_in_profit : true,
            })
          );
        } catch {}
      } catch (e) {
        console.error("Settings load failed:", e);
        setError(e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // ---------- Save partial updates (also persist to server when relevant) ----------
  const saveSettings = async (partial) => {
    // optimistic local
    if (partial.general) setGeneral((g) => ({ ...g, ...partial.general }));
    if (partial.portfolio) setPortfolio((p) => ({ ...p, ...partial.portfolio }));
    if (partial.visible_widgets) setVisibleWidgets(partial.visible_widgets);
    if (partial.widget_order) setWidgetOrder(partial.widget_order);
    if (partial.recent_trades_limit !== undefined) setRecentTradesLimit(partial.recent_trades_limit);
    if (typeof partial.include_tax_in_profit === "boolean") setIncludeTaxInProfit(partial.include_tax_in_profit);

    // legacy snapshot (for any old code reading localStorage)
    try {
      const ls = JSON.parse(localStorage.getItem("user_settings") || "{}");
      localStorage.setItem(
        "user_settings",
        JSON.stringify({
          ...ls,
          ...(partial.visible_widgets ? { visible_widgets: partial.visible_widgets } : {}),
          ...(partial.widget_order ? { widget_order: partial.widget_order } : {}),
          ...(partial.recent_trades_limit !== undefined ? { recent_trades_limit: partial.recent_trades_limit } : {}),
          ...(typeof partial.include_tax_in_profit === "boolean" ? { include_tax_in_profit: partial.include_tax_in_profit } : {}),
        })
      );
    } catch {}

    // server: portfolio starting balance
    if (partial.portfolio?.startingCoins !== undefined) {
      try {
        await fetch("/api/portfolio/balance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ starting_balance: partial.portfolio.startingCoins }),
        });
      } catch (e) {
        setError(e);
      }
    }

    // server: persist settings whenever general OR visible_widgets OR include_tax_in_profit changes
    if (partial.general || partial.visible_widgets || typeof partial.include_tax_in_profit === "boolean") {
      const g = { ...general, ...(partial.general || {}) };
      const nextVisible = partial.visible_widgets || visible_widgets;
      const mapped = {
        timezone: g.timezone,
        date_format: g.dateFormat === "MM/DD/YYYY" ? "US" : g.dateFormat === "YYYY-MM-DD" ? "ISO" : "EU",
        default_platform: "Console",
        custom_tags: [],
        currency_format: "coins",
        theme: "dark",
        include_tax_in_profit: typeof partial.include_tax_in_profit === "boolean" ? partial.include_tax_in_profit : include_tax_in_profit,
        default_chart_range: "30d",
        visible_widgets: nextVisible,
      };
      try {
        await fetch("/api/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(mapped),
        });
      } catch (e) {
        setError(e);
      }
    }
  };

  const settings = { general, portfolio, visible_widgets, widget_order, recent_trades_limit };

  return (
    <SettingsContext.Provider
      value={{
        // new
        settings,
        general,
        portfolio,
        include_tax_in_profit,

        // legacy shortcuts used across app
        visible_widgets,
        widget_order,
        recent_trades_limit,

        // utils
        isLoading,
        error,
        saveSettings,
        formatCurrency,
        formatDate,
        formatCoins,

        // old callers sometimes use these:
        default_platform: "Console",
        default_quantity: 1,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
export default SettingsContext;
