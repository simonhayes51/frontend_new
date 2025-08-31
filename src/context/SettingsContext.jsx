// src/context/SettingsContext.jsx
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

/**
 * Server-driven settings with legacy compatibility for Overview widgets.
 * - Normalises backend usersettings into: { general, portfolio }
 * - Exposes legacy fields: visible_widgets, widget_order, recent_trades_limit
 * - saveSettings(partial) fans out to:
 *     • POST /api/portfolio/balance (startingCoins)
 *     • POST /api/settings          (timezone/date_format + visible_widgets)
 */

const SettingsContext = createContext(null);

// ----- API helpers (use VITE_API_BASE + cookies) -----
const API_BASE = import.meta?.env?.VITE_API_BASE || "";
const apiUrl = (p) => `${API_BASE}${p}`;

async function apiGet(path) {
  const res = await fetch(apiUrl(path), { credentials: "include" });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { /* not JSON */ }
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} – ${text.slice(0, 200)}`);
  if (!data) throw new Error(`Non-JSON response: ${text.slice(0, 120)}`);
  return data;
}

async function apiPostJson(path, body) {
  const res = await fetch(apiUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body ?? {}),
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { /* ok for empty */ }
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} – ${text.slice(0, 200)}`);
  return data ?? {};
}

// ===== Defaults =====
const DEFAULT_GENERAL = {
  dateFormat: "DD/MM/YYYY", // maps to server date_format: EU|US|ISO
  timeFormat: "24h",
  timezone: "Europe/London",
  coinFormat: "short_m",
  compactThreshold: 100000,
  compactDecimals: 1,
};

const DEFAULT_PORTFOLIO = { startingCoins: 0 };

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
const DEFAULT_RECENT_TRADES_LIMIT = 5;

export const SettingsProvider = ({ children }) => {
  const [general, setGeneral] = useState(DEFAULT_GENERAL);
  const [portfolio, setPortfolio] = useState(DEFAULT_PORTFOLIO);

  // Legacy/overview-critical fields
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
      const num = Number(n) || 0;
      const cfg = {
        coinFormat: g?.coinFormat ?? "short_m",
        compactThreshold: g?.compactThreshold ?? 100000,
        compactDecimals: g?.compactDecimals ?? 1,
      };
      const toFull = (x) => x.toLocaleString("en-GB");

      if (cfg.coinFormat === "short_m" && num >= cfg.compactThreshold) {
        if (num >= 1_000_000) return (num / 1_000_000).toFixed(cfg.compactDecimals).replace(/\.0+$/, "") + "M";
        if (num >= 1_000) return (num / 1_000).toFixed(cfg.compactDecimals).replace(/\.0+$/, "") + "k";
      }
      if (cfg.coinFormat === "european_kk" && num >= cfg.compactThreshold) {
        return (num / 1_000_000).toFixed(cfg.compactDecimals).replace(/\.0+$/, "") + "kk";
      }
      if (cfg.coinFormat === "dot_thousands") return toFull(num).replaceAll(",", ".");
      if (cfg.coinFormat === "space_thousands") return toFull(num).replaceAll(",", " ");
      if (cfg.coinFormat === "full_commas") return toFull(num);
      return toFull(num);
    },
    [general]
  );

  // ---------- Load from backend + merge any legacy localStorage ----------
  useEffect(() => {
    (async () => {
      try {
        // Hydrate legacy prefs early to avoid empty Overview on first paint
        try {
          const raw = localStorage.getItem("user_settings");
          if (raw) {
            const ls = JSON.parse(raw);
            if (Array.isArray(ls.visible_widgets)) setVisibleWidgets(ls.visible_widgets);
            if (Array.isArray(ls.widget_order)) setWidgetOrder(ls.widget_order);
            if (Number.isFinite(ls.recent_trades_limit)) setRecentTradesLimit(ls.recent_trades_limit);
          }
        } catch {}

        // Load server settings/profile
        const [s, p] = await Promise.all([apiGet("/api/settings"), apiGet("/api/profile")]);

        // Map server -> general
        const mappedGeneral = {
          ...DEFAULT_GENERAL,
          timezone: s.timezone || DEFAULT_GENERAL.timezone,
          dateFormat:
            s.date_format === "US" ? "MM/DD/YYYY" : s.date_format === "ISO" ? "YYYY-MM-DD" : "DD/MM/YYYY",
          // coin prefs are client-only until persisted server-side
          coinFormat: s.coinFormat ?? DEFAULT_GENERAL.coinFormat,
          compactThreshold: s.compactThreshold ?? DEFAULT_GENERAL.compactThreshold,
          compactDecimals: s.compactDecimals ?? DEFAULT_GENERAL.compactDecimals,
          timeFormat: "24h",
        };
        setGeneral(mappedGeneral);

        // Portfolio (starting balance comes from /api/profile fetch_dashboard_data)
        setPortfolio({ startingCoins: p?.startingBalance ?? DEFAULT_PORTFOLIO.startingCoins });

        // Widgets from server column (usersettings.visible_widgets)
        const serverVisible =
          Array.isArray(s.visible_widgets) && s.visible_widgets.length ? s.visible_widgets : DEFAULT_VISIBLE;
        setVisibleWidgets(serverVisible);

        // If you add an order column later, map here; for now keep existing/default
        setWidgetOrder((prev) => (prev && prev.length ? prev : DEFAULT_WIDGET_ORDER));

        // Persist compact legacy snapshot for any older code still reading localStorage
        try {
          const existing = JSON.parse(localStorage.getItem("user_settings") || "{}");
          localStorage.setItem(
            "user_settings",
            JSON.stringify({
              ...existing,
              visible_widgets: serverVisible,
              widget_order: DEFAULT_WIDGET_ORDER,
              recent_trades_limit: DEFAULT_RECENT_TRADES_LIMIT,
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

  // ---------- Save partial updates ----------
  const saveSettings = async (partial) => {
    // optimistic local merge
    if (partial.general) setGeneral((g) => ({ ...g, ...partial.general }));
    if (partial.portfolio) setPortfolio((p) => ({ ...p, ...partial.portfolio }));
    if (partial.visible_widgets) setVisibleWidgets(partial.visible_widgets);
    if (partial.widget_order) setWidgetOrder(partial.widget_order);
    if (partial.recent_trades_limit !== undefined) setRecentTradesLimit(partial.recent_trades_limit);

    // Update legacy localStorage snapshot (so older code keeps working)
    try {
      const ls = JSON.parse(localStorage.getItem("user_settings") || "{}");
      localStorage.setItem(
        "user_settings",
        JSON.stringify({
          ...ls,
          ...(partial.visible_widgets ? { visible_widgets: partial.visible_widgets } : {}),
          ...(partial.widget_order ? { widget_order: partial.widget_order } : {}),
          ...(partial.recent_trades_limit !== undefined
            ? { recent_trades_limit: partial.recent_trades_limit }
            : {}),
        })
      );
    } catch {}

    // Server: starting balance
    if (partial.portfolio?.startingCoins !== undefined) {
      try {
        await apiPostJson("/api/portfolio/balance", {
          starting_balance: partial.portfolio.startingCoins,
        });
      } catch (e) {
        setError(e);
      }
    }

    // Server: general (timezone, date_format) + also persist visible_widgets
    if (partial.general || partial.visible_widgets) {
      const g = { ...general, ...(partial.general || {}) };
      const mapped = {
        timezone: g.timezone,
        date_format: g.dateFormat === "MM/DD/YYYY" ? "US" : g.dateFormat === "YYYY-MM-DD" ? "ISO" : "EU",
        // required columns to satisfy your UPSERT
        default_platform: "Console",
        custom_tags: [],
        currency_format: "coins",
        theme: "dark",
        include_tax_in_profit: true,
        default_chart_range: "30d",
        visible_widgets: partial.visible_widgets || visible_widgets,
      };
      try {
        await apiPostJson("/api/settings", mapped);
      } catch (e) {
        setError(e);
      }
    }
  };

  // Expose both legacy and new shapes
  const settings = { general, portfolio, visible_widgets, widget_order, recent_trades_limit };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        general,
        portfolio,
        visible_widgets,
        widget_order,
        recent_trades_limit,
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
