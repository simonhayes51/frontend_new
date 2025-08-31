import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/axios";

const Settings = () => {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  
  // Settings state
  const [settings, setSettings] = useState({
    default_platform: "Console",
    custom_tags: [],
    currency_format: "coins",
    theme: "dark",
    timezone: "UTC",
    date_format: "US",
    include_tax_in_profit: true,
    default_chart_range: "30d",
    visible_widgets: ["profit", "tax", "balance", "trades"]
  });

  // Form states
  const [startingBalance, setStartingBalance] = useState("");
  const [newTag, setNewTag] = useState("");
  const [importFile, setImportFile] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get("/api/settings");
      console.log("Full response:", response);
      console.log("Response data:", response.data);
      setSettings(response.data);
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    }
  };

  const updateSetting = async (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);  // Updates local state
    
    try {
      await api.post("/api/settings", newSettings);  // Saves to backend (working)
      setMessage("Settings updated successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage("Failed to update settings");
      console.error(error);
    }
  };

  const handleSaveBalance = async () => {
    if (!startingBalance || isNaN(startingBalance)) {
      setMessage("Please enter a valid number");
      return;
    }

    setLoading(true);
    try {
      await api.post("/api/portfolio/balance", { 
        starting_balance: parseInt(startingBalance) 
      });
      setMessage("Starting balance updated successfully!");
      setStartingBalance("");
    } catch (err) {
      setMessage("Failed to update starting balance");
    } finally {
      setLoading(false);
    }
  };

  const addCustomTag = () => {
    if (newTag && !settings.custom_tags.includes(newTag)) {
      updateSetting("custom_tags", [...settings.custom_tags, newTag]);
      setNewTag("");
    }
  };

  const removeCustomTag = (tagToRemove) => {
    updateSetting("custom_tags", settings.custom_tags.filter(tag => tag !== tagToRemove));
  };

  const handleExport = async (format) => {
    try {
      const response = await api.get(`/api/export/trades?format=${format}`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `trades_export.${format}`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      setMessage(`Data exported as ${format.toUpperCase()} successfully!`);
    } catch (error) {
      setMessage("Failed to export data");
      console.error(error);
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      setMessage("Please select a file to import");
      return;
    }

    const formData = new FormData();
    formData.append('file', importFile);

    setLoading(true);
    try {
      const response = await api.post("/api/import/trades", formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setMessage(`${response.data.message}`);
      setImportFile(null);
    } catch (error) {
      setMessage("Failed to import data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAllData = async () => {
    if (deleteConfirm !== "DELETE ALL") {
      setMessage("Please type 'DELETE ALL' to confirm");
      return;
    }

    setLoading(true);
    try {
      await api.delete("/api/data/delete-all?confirm=true");
      setMessage("All data deleted successfully!");
      setDeleteConfirm("");
    } catch (error) {
      setMessage("Failed to delete data");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "general", label: "General", icon: "⚙️" },
    { id: "trading", label: "Trading", icon: "📈" },
    { id: "display", label: "Display", icon: "🎨" },
    { id: "data", label: "Data", icon: "💾" },
    { id: "account", label: "Account", icon: "👤" }
  ];

  return (
    <div className="bg-zinc-900 p-6 rounded-xl shadow-lg text-white max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Settings</h2>
      
      {message && (
        <div className={`mb-4 p-3 rounded ${message.includes('success') ? 'bg-green-800' : 'bg-red-800'}`}>
          {message}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === tab.id 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* General Tab */}
      {activeTab === "general" && (
        <div className="space-y-6">
          <div>
            <label className="block mb-2 font-semibold">Starting Balance</label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Enter Starting Balance"
                value={startingBalance}
                onChange={(e) => setStartingBalance(e.target.value)}
                className="flex-1 p-3 rounded bg-zinc-800 text-white"
              />
              <button 
                onClick={handleSaveBalance} 
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>

          <div>
            <label className="block mb-2 font-semibold">Theme</label>
            <select
              value={settings.theme}
              onChange={(e) => updateSetting("theme", e.target.value)}
              className="w-full p-3 rounded bg-zinc-800 text-white"
            >
              <option value="dark">Dark Theme</option>
              <option value="light">Light Theme</option>
            </select>
          </div>

          <div>
            <label className="block mb-2 font-semibold">Timezone</label>
            <select
              value={settings.timezone}
              onChange={(e) => updateSetting("timezone", e.target.value)}
              className="w-full p-3 rounded bg-zinc-800 text-white"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
              <option value="Europe/London">London</option>
              <option value="Europe/Berlin">Berlin</option>
            </select>
          </div>
        </div>
      )}

      {/* Trading Tab */}
      {activeTab === "trading" && (
        <div className="space-y-6">
          <div>
            <label className="block mb-2 font-semibold">Default Platform</label>
            <select
              value={settings.default_platform}
              onChange={(e) => updateSetting("default_platform", e.target.value)}
              className="w-full p-3 rounded bg-zinc-800 text-white"
            >
              <option value="Console">Console</option>
              <option value="PC">PC</option>
            </select>
          </div>

          <div>
            <label className="block mb-2 font-semibold">Custom Tags</label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder="Add new tag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addCustomTag()}
                className="flex-1 p-3 rounded bg-zinc-800 text-white"
              />
              <button 
                onClick={addCustomTag}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(settings.custom_tags || []).map((tag, index) => (
                <span
                  key={index}
                  className="bg-gray-700 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                >
                  {tag}
                  <button
                    onClick={() => removeCustomTag(tag)}
                    className="text-red-400 hover:text-red-300"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.include_tax_in_profit}
                onChange={(e) => updateSetting("include_tax_in_profit", e.target.checked)}
                className="w-4 h-4"
              />
              <span>Include EA tax in profit calculations</span>
            </label>
          </div>
        </div>
      )}

      {/* Display Tab */}
      {activeTab === "display" && (
        <div className="space-y-6">
          <div>
            <label className="block mb-2 font-semibold">Currency Format</label>
            <select
              value={settings.currency_format}
              onChange={(e) => updateSetting("currency_format", e.target.value)}
              className="w-full p-3 rounded bg-zinc-800 text-white"
            >
              <option value="coins">Full Numbers (1,000,000)</option>
              <option value="k">Thousands (1,000K)</option>
              <option value="m">Millions (1.0M)</option>
            </select>
          </div>

          <div>
            <label className="block mb-2 font-semibold">Date Format</label>
            <select
              value={settings.date_format}
              onChange={(e) => updateSetting("date_format", e.target.value)}
              className="w-full p-3 rounded bg-zinc-800 text-white"
            >
              <option value="US">US Format (MM/DD/YYYY)</option>
              <option value="EU">EU Format (DD/MM/YYYY)</option>
            </select>
          </div>

          <div>
            <label className="block mb-2 font-semibold">Default Chart Range</label>
            <select
              value={settings.default_chart_range}
              onChange={(e) => updateSetting("default_chart_range", e.target.value)}
              className="w-full p-3 rounded bg-zinc-800 text-white"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>
      )}

      {/* Data Tab */}
      {activeTab === "data" && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Export Data</h3>
            <div className="flex gap-3">
              <button
                onClick={() => handleExport("csv")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                Export as CSV
              </button>
              <button
                onClick={() => handleExport("json")}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              >
                Export as JSON
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Import Data</h3>
            <div className="space-y-3">
              <input
                type="file"
                accept=".csv,.json"
                onChange={(e) => setImportFile(e.target.files[0])}
                className="w-full p-3 rounded bg-zinc-800 text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-gray-600 file:text-white"
              />
              <button
                onClick={handleImport}
                disabled={loading || !importFile}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:opacity-50"
              >
                {loading ? "Importing..." : "Import Data"}
              </button>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-6">
            <h3 className="text-lg font-semibold mb-3 text-red-400">Danger Zone</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Type 'DELETE ALL' to confirm"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                className="w-full p-3 rounded bg-zinc-800 text-white"
              />
              <button
                onClick={handleDeleteAllData}
                disabled={loading || deleteConfirm !== "DELETE ALL"}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded disabled:opacity-50"
              >
                {loading ? "Deleting..." : "Delete All Data"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Tab */}
      {activeTab === "account" && (
        <div className="space-y-6">
          <div className="pt-4 border-t border-gray-700">
            <button 
              onClick={logout} 
              className="bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-lg w-full"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
