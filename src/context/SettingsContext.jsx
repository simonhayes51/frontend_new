// src/context/SettingsContext.jsx
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

const SettingsContext = createContext(null);

const DEFAULT_GENERAL = {
  dateFormat: "DD/MM/YYYY",     // maps to usersettings.date_format
  timeFormat: "24h",
  timezone: "Europe/London",
  coinFormat: "short_m",        // custom client pref (local only for now)
  compactThreshold: 100000,
  compactDecimals: 1,
};
const DEFAULT_PORTFOLIO = {
  startingCoins: 0,
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({ general: DEFAULT_GENERAL, portfolio: DEFAULT_PORTFOLIO });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- formatters exposed to UI
  const formatCurrency = useCallback((n) => {
    const v = Number.isFinite(n) ? n : 0;
    return v.toLocaleString("en-GB");
  }, []);

  const formatDate = useCallback((d) => {
    const dt = d instanceof Date ? d : new Date(d);
    const opts = {
      year: "numeric", month: "short", day: "2-digit",
      hour: "2-digit", minute: "2-digit",
      hour12: (settings.general?.timeFormat ?? "24h") === "12h",
      timeZone: settings.general?.timezone || "Europe/London",
    };
    return new Intl.DateTimeFormat("en-GB", opts).format(dt);
  }, [settings.general]);

  // --- coin formatter (used by Settings.jsx preview)
  const formatCoins = useCallback((n, g = settings.general) => {
    const cfg = {
      coinFormat: g?.coinFormat ?? "short_m",
      compactThreshold: g?.compactThreshold ?? 100000,
      compactDecimals: g?.compactDecimals ?? 1,
    };
    const toFull = (x) => x.toLocaleString("en-GB"); // 1,234,567

    if (cfg.coinFormat === "short_m" && n >= cfg.compactThreshold) {
      if (n >= 1_000_000) return (n/1_000_000).toFixed(cfg.compactDecimals).replace(/\.0+$/,"") + "M";
      if (n >= 1_000)    return (n/1_000).toFixed(cfg.compactDecimals).replace(/\.0+$/,"") + "k";
    }
    if (cfg.coinFormat === "european_kk" && n >= cfg.compactThreshold) {
      return (n/1_000_000).toFixed(cfg.compactDecimals).replace(/\.0+$/,"") + "kk";
    }
    if (cfg.coinFormat === "dot_thousands")   return toFull(n).replaceAll(",", ".");
    if (cfg.coinFormat === "space_thousands") return toFull(n).replaceAll(",", " ");
    if (cfg.coinFormat === "full_commas")     return toFull(n);
    return toFull(n);
  }, [settings.general]);

  // --- load from backend
  useEffect(() => {
    (async () => {
      try {
        const [sRes, meRes] = await Promise.all([fetch("/api/settings"), fetch("/api/profile")]);
        const s = await sRes.json();
        const p = await meRes.json();

        // map flat usersettings -> nested general
        const general = {
          ...DEFAULT_GENERAL,
          timezone: s.timezone || DEFAULT_GENERAL.timezone,
          dateFormat: (s.date_format === "US" ? "MM/DD/YYYY" : s.date_format === "ISO" ? "YYYY-MM-DD" : "DD/MM/YYYY"),
          timeFormat: "24h", // your API stores only date_format/timezone; keep timeFormat client-side
          // keep coin format prefs client-side
          coinFormat: (s.coinFormat ?? DEFAULT_GENERAL.coinFormat),
          compactThreshold: (s.compactThreshold ?? DEFAULT_GENERAL.compactThreshold),
          compactDecimals: (s.compactDecimals ?? DEFAULT_GENERAL.compactDecimals),
        };

        const portfolio = {
          startingCoins: p?.startingBalance ?? DEFAULT_PORTFOLIO.startingCoins,
        };

        setSettings({ general, portfolio });
      } catch (e) {
        console.error(e);
        setError(e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // --- save partial updates
  const saveSettings = async (partial) => {
    // merge locally first (optimistic)
    setSettings((prev) => ({ ...prev, ...partial }));

    // fan-out: if portfolio.startingCoins changed -> dedicated endpoint
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

    // map nested general -> flat payload for /api/settings
    if (partial.general) {
      const g = { ...settings.general, ...partial.general };
      const mapped = {
        // only fields your API knows about:
        timezone: g.timezone,
        date_format: g.dateFormat === "MM/DD/YYYY" ? "US" : g.dateFormat === "YYYY-MM-DD" ? "ISO" : "EU",
        // keep other server fields as-is (we’re not overwriting them here)
        default_platform: "Console",
        custom_tags: [],
        currency_format: "coins",
        theme: "dark",
        include_tax_in_profit: true,
        default_chart_range: "30d",
        visible_widgets: ["profit", "tax", "balance", "trades"],
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

    return true;
  };

  return (
    <SettingsContext.Provider value={{
      settings, saveSettings, isLoading, error,
      general: settings.general, portfolio: settings.portfolio,
      default_platform: "Console",
      default_quantity: 1,
      formatCurrency, formatDate, formatCoins,
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
export default SettingsContext;
