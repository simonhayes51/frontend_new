// src/pages/Settings.jsx
import React, { useMemo, useState } from "react";
import { CheckCircle2, Info, Settings as SettingsIcon, Shield, Zap } from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import SettingsTrading from "./SettingsTrading.jsx"; // keep extension for case-sensitive builds

const ACCENT = "#91db32";

export default function Settings() {
  // Pull anything global you want to show in General tab
  const {
    default_platform = "Console",
    default_quantity = 1,
    // saveSettings // (not needed here; General is read-only summary)
  } = useSettings();

  const [tab, setTab] = useState("general"); // "general" | "trading" | "integrations"

  const tabs = useMemo(
    () => [
      { key: "general", label: "General", icon: <SettingsIcon size={16} /> },
      { key: "trading", label: "Trading", icon: <Zap size={16} /> },
      { key: "integrations", label: "Integrations", icon: <Shield size={16} /> },
    ],
    []
  );

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-sm text-gray-400">
            Configure your dashboard preferences. Trading settings update instantly.
          </p>
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
          <section className="bg-gray-900/70 border border-gray-800 rounded-2xl p-4">
            <h2 className="text-lg font-semibold mb-4">General</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <KV label="Default Platform" value={default_platform} />
              <KV label="Default Quantity" value={String(default_quantity)} />
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
              <CheckCircle2 size={14} style={{ color: ACCENT }} />
              Changes to Trading settings are saved automatically.
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
              Connect external services (Discord bot, Chrome extension, etc.). You can add fields
              here later—this panel is a placeholder so the tab doesn’t 404 during builds.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}

/** Small helpers */
function KV({ label, value }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-3">
      <div className="text-xs text-gray-400">{label}</div>
      <div className="text-sm text-gray-100">{value}</div>
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
      <span>Need help? See the top-right help in Settings.</span>
    </div>
  );
}
