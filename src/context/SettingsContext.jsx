import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

/**
 * Settings context normalises your server's flat usersettings row
 * into a nested shape the UI uses: { general: {...}, portfolio: {...} }.
 * It also exposes formatters and a saveSettings(partial) that fans out to:
 * - POST /api/portfolio/balance for startingCoins
 * - POST /api/settings for general (timezone/date_format, etc.)
 */

const SettingsContext = createContext(null);

const DEFAULT_GENERAL = {
  dateFormat: "DD/MM/YYYY",     // maps to API's usersettings.date_format (EU/US/ISO)
  timeFormat: "24h",            // client-side only
  timezone: "Europe/London",
  coinFormat: "short_m",        // client-side only (short_m | european_kk | full_commas | dot_thousands | space_thousands)
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

  // ---------- Formatters ----------
  const formatCurrency = useCallback((n) => {
    const v = Number.isFinite(n) ? n : 0;
    return v.toLocaleString("en-GB");
  }, []);

  const formatDate = useCallback((d) => {
    const dt = d instanceof Date ? d : new Date(d);
    const opts = {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: (settings.general?.timeFormat ?? "24h") === "12h",
      timeZone: settings.general?.timezone || "Europe/London",
    };
    return new Intl.DateTimeFormat("en-GB", opts).format(dt);
  }, [settings.general]);

  const formatCoins = useCallback((n, g = settings.general) => {
    const cfg = {
      coinFormat: g?.coinFormat ?? "short_m",
      compactThreshold: g?.compactThreshold ?? 100000,
      compactDecimals: g?.compactDecimals ?? 1,
    };
    const toFull = (x) => x.toLocaleString("en-GB"); // 1,234,567

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
  }, [settings.general]);

  // ---------- Load from backend ----------
  useEffect(() => {
    (async () => {
      try {
        const [sRes, pRes] = await Promise.all([
          fetch("/api/settings"),
          fetch("/api/profile"), // contains startingBalance per your main.py
        ]);

        const s = await sRes.json();
        const p = await pRes.json();

        // Map flat server fields -> nested general
        const general = {
          ...DEFAULT_GENERAL,
          timezone: s.timezone || DEFAULT_GENERAL.timezone,
          dateFormat:
            s.date_format === "US"
              ? "MM/DD/YYYY"
              : s.date_format === "ISO"
              ? "YYYY-MM-DD"
              : "DD/MM/YYYY",
          // client-only prefs (if you later persist these, hydrate from server instead)
          coinFormat: s.coinFormat ?? DEFAULT_GENERAL.coinFormat,
          compactThreshold: s.compactThreshold ?? DEFAULT_GENERAL.compactThreshold,
          compactDecimals: s.compactDecimals ?? DEFAULT_GENERAL.compactDecimals,
          timeFormat: "24h",
        };

        const portfolio = {
          startingCoins: p?.startingBalance ?? DEFAULT_PORTFOLIO.startingCoins,
        };

        setSettings({ general, portfolio });
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
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      // deep merge for general/portfolio
      if (partial.general) next.general = { ...prev.general, ...partial.general };
      if (partial.portfolio) next.portfolio = { ...prev.portfolio, ...partial.portfolio };
      return next;
    });

    // starting balance -> dedicated endpoint
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

    // general -> /api/settings (flat)
    if (partial.general) {
      const g = { ...settings.general, ...partial.general };
      const mapped = {
        // server-known fields only; others are kept client-side for now
        timezone: g.timezone,
        date_format: g.dateFormat === "MM/DD/YYYY" ? "US" : g.dateFormat === "YYYY-MM-DD" ? "ISO" : "EU",
        // include the rest of required server columns with safe defaults so your UPSERT doesn't null them
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
    <SettingsContext.Provider
      value={{
        settings,
        general: settings.general,
        portfolio: settings.portfolio,
        isLoading,
        error,
        saveSettings,
        formatCurrency,
        formatDate,
        formatCoins,
        // legacy fallbacks used elsewhere in your app:
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
