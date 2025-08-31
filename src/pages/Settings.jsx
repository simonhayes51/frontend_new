import React, { useMemo, useState } from "react";
import {
  CheckCircle2,
  Info,
  Settings as SettingsIcon,
  Shield,
  Zap,
  Upload,
  Download,
  Coins,
  Trash2,
  Globe,
} from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import SettingsTrading from "./SettingsTrading.jsx"; // keep extension for case-sensitive builds

const ACCENT = "#91db32";

export default function Settings() {
  // pull from our updated context
  const { settings = {}, general, portfolio, saveSettings, formatCoins } = useSettings();
  const [tab, setTab] = useState("general");

  const tabs = useMemo(
    () => [
      { key: "general", label: "General", icon: <SettingsIcon size={16} /> },
      { key: "trading", label: "Trading", icon: <Zap size={16} /> },
      { key: "integrations", label: "Integrations", icon: <Shield size={16} /> },
    ],
    []
  );

  // prefer 'general' and 'portfolio' directly, but keep 'settings.*' to not break your current JSX
  const g = settings.general ?? general ?? {};
  const pf = settings.portfolio ?? portfolio ?? {};

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-sm text-gray-400">Configure your dashboard preferences. Trading settings update instantly.</p>
        </div>
        <HelpBadge />
      </div>

      {/* Tabs */}
      <div className="inline-flex rounded-xl border border-gray-800 overflow-hidden">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-2 text-sm inline-flex items-center gap-2 ${
              tab === t.key ? "bg-gray-900 text-white" : "bg-gray-900/40 text-gray-300"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Panels */}
      <div className="space-y-4">
        {tab === "general" && (
          <section className="bg-gray-900/70 border border-gray-800 rounded-2xl p-4 space-y-6">
            <h2 className="text-lg font-semibold">General</h2>

            {/* Date/Time/Timezone */}
            <div className="grid md:grid-cols-3 gap-4">
              <Select
                label="Date format"
                value={g?.dateFormat ?? "DD/MM/YYYY"}
                onChange={(e) => saveSettings({ general: { ...(g || {}), dateFormat: e.target.value } })}
                options={[
                  ["DD/MM/YYYY", "DD/MM/YYYY"],
                  ["MM/DD/YYYY", "MM/DD/YYYY"],
                  ["YYYY-MM-DD", "YYYY-MM-DD"],
                ]}
              />
              <Select
                label="Time format"
                value={g?.timeFormat ?? "24h"}
                onChange={(e) => saveSettings({ general: { ...(g || {}), timeFormat: e.target.value } })}
                options={[
                  ["24h", "24-hour"],
                  ["12h", "12-hour"],
                ]}
              />
              <LabeledInput
                label="Timezone (IANA)"
                placeholder="Europe/London"
                icon={<Globe size={14} />}
                value={g?.timezone ?? "Europe/London"}
                onChange={(e) => saveSettings({ general: { ...(g || {}), timezone: e.target.value } })}
              />
            </div>

            {/* Coin formatting */}
            <div className="grid md:grid-cols-3 gap-4">
              <Select
                label="Coin display format"
                value={g?.coinFormat ?? "short_m"}
                onChange={(e) => saveSettings({ general: { ...(g || {}), coinFormat: e.target.value } })}
                options={[
                  ["short_m", "1.2M"],
                  ["european_kk", "1.2kk"],
                  ["full_commas", "1,200,000"],
                  ["dot_thousands", "1.200.000"],
                  ["space_thousands", "1 200 000"],
                ]}
              />
              <Select
                label="Compact threshold"
                value={String(g?.compactThreshold ?? 100000)}
                onChange={(e) =>
                  saveSettings({ general: { ...(g || {}), compactThreshold: Number(e.target.value) } })
                }
                options={[
                  ["1000", "≥ 1,000"],
                  ["10000", "≥ 10,000"],
                  ["100000", "≥ 100,000"],
                ]}
              />
              <Select
                label="Decimals when compact"
                value={String(g?.compactDecimals ?? 1)}
                onChange={(e) =>
                  saveSettings({ general: { ...(g || {}), compactDecimals: Number(e.target.value) } })
                }
                options={[
                  ["0", "0"],
                  ["1", "1"],
                  ["2", "2"],
                ]}
              />
            </div>

            <CoinPreview value={1234567} formatCoins={formatCoins} general={g} />

            <hr className="border-gray-800" />

            {/* Starting balance + Import/Export/Reset */}
            <div className="grid md:grid-cols-2 gap-4">
              <LabeledInput
                label="Starting balance"
                type="number"
                icon={<Coins size={14} />}
                value={pf?.startingCoins ?? 0}
                onChange={(e) =>
                  saveSettings({
                    portfolio: { ...(pf || {}), startingCoins: Number(e.target.value || 0) },
                  })
                }
              />

              <div className="flex items-end gap-2">
                <button
                  className="px-3 py-2 rounded-lg border border-gray-800 bg-gray-900 text-gray-200 inline-flex items-center gap-2"
                  onClick={() =>
                    fetch("/api/export/trades?format=csv")
                      .then((r) => r.blob())
                      .then((b) => {
                        const url = URL.createObjectURL(b);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = "trades-export.csv";
                        a.click();
                        URL.revokeObjectURL(url);
                      })
                  }
                >
                  <Download size={16} /> Export CSV
                </button>

                <label className="px-3 py-2 rounded-lg border border-gray-800 bg-gray-900 text-gray-200 inline-flex items-center gap-2 cursor-pointer">
                  <Upload size={16} /> Import CSV
                  <input
                    type="file"
                    accept=".csv,.json"
                    hidden
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const fd = new FormData();
                      fd.append("file", f);
                      fetch("/api/import/trades", { method: "POST", body: fd })
                        .then((r) => r.json())
                        .then((j) => alert(`Import complete: ${j.imported_count} imported`))
                        .catch(() => alert("Import failed"));
                    }}
                  />
                </label>

                <button
                  className="ml-auto px-3 py-2 rounded-lg text-white bg-red-600/80 hover:bg-red-600 inline-flex items-center gap-2"
                  onClick={() => {
                    if (!confirm("Reset ALL data (trades + starting balance)? This cannot be undone.")) return;
                    fetch("/api/data/delete-all?confirm=true", { method: "DELETE" }).then(() => location.reload());
                  }}
                >
                  <Trash2 size={16} /> Reset data
                </button>
              </div>
            </div>

            <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
              <CheckCircle2 size={14} style={{ color: ACCENT }} />
              Changes save instantly.
            </div>
          </section>
        )}

        {tab === "trading" && (
          <section className="space-y-4">
            <SettingsTrading />
          </section>
        )}

        {tab === "integrations" && (
          <section className="bg-gray-900/70 border border-gray-800 rounded-2xl p-4">
            <h2 className="text-lg font-semibold mb-4">Integrations</h2>
            <p className="text-gray-400 text-sm">
              Connect Discord and the Chrome extension (configure later).
            </p>
          </section>
        )}
      </div>
    </div>
  );
}

/** Helpers */
function LabeledInput({ label, icon, ...props }) {
  return (
    <label className="block">
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className="flex items-center bg-gray-900 border border-gray-800 rounded-xl px-3">
        {icon && <span className="text-gray-500 mr-2">{icon}</span>}
        <input className="w-full bg-transparent py-2 outline-none text-gray-100" {...props} />
      </div>
    </label>
  );
}

function Select({ label, options, ...props }) {
  return (
    <label className="block">
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <select
        className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-gray-100"
        {...props}
      >
        {options.map(([v, t]) => (
          <option key={v} value={v}>
            {t}
          </option>
        ))}
      </select>
    </label>
  );
}

function CoinPreview({ value, formatCoins, general }) {
  const demo = formatCoins(value, general);
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-3">
      <div className="text-xs text-gray-400 mb-1">Coin format preview</div>
      <div className="text-sm text-gray-100">{demo}</div>
    </div>
  );
}

function HelpBadge() {
  return (
    <div
      className="hidden sm:flex items-center gap-2 text-xs px-3 py-1.5 rounded-xl border border-gray-800 bg-gray-900/50 text-gray-300"
      title="Help & tips"
    >
      <Info size={14} />
      <span>Need help? Top-right tips in Settings.</span>
    </div>
  );
}