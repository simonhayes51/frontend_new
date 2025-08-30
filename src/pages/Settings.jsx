import React, { useState } from "react";
import SettingsWidgets from "./SettingsWidgets";
import SettingsTrading from "./SettingsTrading";

export default function Settings() {
  const [tab, setTab] = useState("widgets"); // 'widgets' | 'trading'

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>

      {/* Simple tabs (no routing) */}
      <div className="inline-flex bg-gray-900/70 border border-gray-800 rounded-lg overflow-hidden mb-6">
        <button
          onClick={() => setTab("widgets")}
          className={`px-4 py-2 text-sm ${tab === "widgets" ? "bg-gray-800 text-white" : "text-gray-300 hover:text-white"}`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setTab("trading")}
          className={`px-4 py-2 text-sm ${tab === "trading" ? "bg-gray-800 text-white" : "text-gray-300 hover:text-white"}`}
        >
          Trading
        </button>
      </div>

      {tab === "widgets" ? <SettingsWidgets /> : <SettingsTrading />}
    </div>
  );
}