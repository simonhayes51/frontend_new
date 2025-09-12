import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { apiFetch } from '../api/http';
import { 
  Download, 
  Upload, 
  Trash2, 
  Settings as SettingsIcon,
  Save,
  RefreshCw,
  AlertTriangle,
  Eye,
  Moon,
  Sun,
  Calendar,
  DollarSign,
  Tag,
  BarChart3,
  Shield,
  Smartphone,
  FileText,
  CreditCard
} from 'lucide-react';

const Settings = () => {
  const [settings, setSettings] = useState({
    default_platform: 'Console',
    custom_tags: [],
    currency_format: 'coins',
    theme: 'dark',
    timezone: 'UTC',
    date_format: 'US',
    include_tax_in_profit: true,
    default_chart_range: '30d',
    visible_widgets: ['profit', 'tax', 'balance', 'trades']
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [activeTab, setActiveTab] = useState('general');
  const [hasChanges, setHasChanges] = useState(false);
  const [originalSettings, setOriginalSettings] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (settings.theme && typeof document !== 'undefined') {
      const root = document.documentElement;
      switch (settings.theme) {
        case 'dark':
          root.classList.add('dark');
          break;
        case 'light':
          root.classList.remove('dark');
          break;
        case 'system':
          if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            root.classList.add('dark');
          } else {
            root.classList.remove('dark');
          }
          break;
        default:
          break;
      }
    }
  }, [settings.theme]);

  useEffect(() => {
    if (originalSettings) {
      setHasChanges(JSON.stringify(settings) !== JSON.stringify(originalSettings));
    }
  }, [settings, originalSettings]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/api/settings');
      setSettings(data);
      setOriginalSettings(data);
    } catch (error) {
      toast.error('Failed to load settings');
      console.error('Load settings error:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      await apiFetch('/api/settings', {
        method: 'POST',
        body: settings
      });
      setOriginalSettings(settings);
      toast.success('Settings saved successfully!');
    } catch (error) {
      toast.error('Failed to save settings');
      console.error('Save settings error:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const addCustomTag = () => {
    if (newTag.trim() && !settings.custom_tags.includes(newTag.trim())) {
      setSettings(prev => ({
        ...prev,
        custom_tags: [...prev.custom_tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeCustomTag = (tagToRemove) => {
    setSettings(prev => ({
      ...prev,
      custom_tags: prev.custom_tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const toggleWidget = (widget) => {
    setSettings(prev => ({
      ...prev,
      visible_widgets: prev.visible_widgets.includes(widget)
        ? prev.visible_widgets.filter(w => w !== widget)
        : [...prev.visible_widgets, widget]
    }));
  };

  const exportData = async (format = 'json') => {
    try {
      setLoading(true);
      const response = await fetch(`/api/export/trades?format=${format}`, {
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fut-trades-export.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success(`Data exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Export failed');
    } finally {
      setLoading(false);
    }
  };

  const importData = async (file) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', file);
      
      const result = await apiFetch('/api/import/trades', {
        method: 'POST',
        body: formData
      });
      
      toast.success(`${result.imported_count} trades imported!`);
      if (result.errors?.length > 0) {
        toast.error(`${result.errors.length} errors occurred`);
      }
    } catch (error) {
      toast.error('Import failed');
    } finally {
      setLoading(false);
    }
  };

  const deleteAllData = async () => {
    if (deleteConfirm !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }

    try {
      setLoading(true);
      const result = await apiFetch('/api/data/delete-all', {
        method: 'DELETE',
        query: { confirm: true }
      });
      
      toast.success(`All data deleted (${result.details?.trades_deleted || 0} trades removed)`);
      setShowDeleteModal(false);
      setDeleteConfirm('');
    } catch (error) {
      toast.error('Failed to delete data');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'trading', label: 'Trading', icon: BarChart3 },
    { id: 'display', label: 'Display', icon: Eye },
    { id: 'data', label: 'Data', icon: Shield }
  ];

  if (loading && !settings.default_platform) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="animate-spin h-8 w-8 text-blue-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">Customize your FUT Dashboard experience</p>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        {activeTab === 'general' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">General Settings</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Default Platform</label>
                <select
                  value={settings.default_platform}
                  onChange={(e) => updateSetting('default_platform', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="Console">PlayStation/Console</option>
                  <option value="Xbox">Xbox</option>
                  <option value="PC">PC/Origin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Currency Display</label>
                <select
                  value={settings.currency_format}
                  onChange={(e) => updateSetting('currency_format', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="coins">Coins (150,000)</option>
                  <option value="abbreviated">Abbreviated (150K)</option>
                  <option value="decimal">Decimal (150.0K)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Theme</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'dark', label: 'Dark', icon: Moon },
                    { value: 'light', label: 'Light', icon: Sun },
                    { value: 'system', label: 'System', icon: Smartphone }
                  ].map((theme) => (
                    <button
                      key={theme.value}
                      onClick={() => updateSetting('theme', theme.value)}
                      className={`p-3 border rounded-lg flex flex-col items-center space-y-2 ${
                        settings.theme === theme.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700'
                      }`}
                    >
                      <theme.icon className="h-5 w-5" />
                      <span className="text-sm">{theme.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date Format</label>
                <select
                  value={settings.date_format}
                  onChange={(e) => updateSetting('date_format', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="US">US (MM/DD/YYYY)</option>
                  <option value="EU">EU (DD/MM/YYYY)</option>
                  <option value="ISO">ISO (YYYY-MM-DD)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'trading' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Trading Settings</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">Include EA Tax in Profit Calculations</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Automatically deduct 5% EA tax from profit calculations</p>
                </div>
                <button
                  onClick={() => updateSetting('include_tax_in_profit', !settings.include_tax_in_profit)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.include_tax_in_profit ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.include_tax_in_profit ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Custom Tags</label>
                <div className="flex space-x-2 mb-3">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addCustomTag()}
                    placeholder="Add a new tag..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  <button
                    onClick={addCustomTag}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <Tag className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {settings.custom_tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                    >
                      {tag}
                      <button
                        onClick={() => removeCustomTag(tag)}
                        className="ml-1.5 h-3 w-3 hover:text-blue-600"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Default Chart Range</label>
                <select
                  value={settings.default_chart_range}
                  onChange={(e) => updateSetting('default_chart_range', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="7d">7 Days</option>
                  <option value="30d">30 Days</option>
                  <option value="90d">90 Days</option>
                  <option value="1y">1 Year</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'display' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Display Settings</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Dashboard Widgets</label>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Choose which widgets to display on your dashboard</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'profit', label: 'Net Profit', icon: DollarSign },
                    { id: 'tax', label: 'EA Tax', icon: FileText },
                    { id: 'balance', label: 'Balance', icon: CreditCard },
                    { id: 'trades', label: 'Recent Trades', icon: BarChart3 }
                  ].map((widget) => (
                    <label
                      key={widget.id}
                      className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600"
                    >
                      <input
                        type="checkbox"
                        checked={settings.visible_widgets.includes(widget.id)}
                        onChange={() => toggleWidget(widget.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <widget.icon className="h-5 w-5 ml-3 mr-2 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {widget.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'data' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Data Management</h3>
            <div className="space-y-6">
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Export Data</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Download all your trading data in JSON or CSV format</p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => exportData('json')}
                    disabled={loading}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600 disabled:opacity-50"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export JSON
                  </button>
                  <button
                    onClick={() => exportData('csv')}
                    disabled={loading}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600 disabled:opacity-50"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </button>
                </div>
              </div>

              <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Import Data</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Upload a JSON or CSV file to import trading data</p>
                <input
                  type="file"
                  accept=".json,.csv"
                  onChange={(e) => e.target.files[0] && importData(e.target.files[0])}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/20 dark:file:text-blue-400"
                />
              </div>

              <div className="border border-red-200 dark:border-red-800 rounded-lg p-4 bg-red-50 dark:bg-red-900/10">
                <h4 className="text-sm font-medium text-red-900 dark:text-red-400 mb-2">Danger Zone</h4>
                <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                  Permanently delete all your trading data. This action cannot be undone.
                </p>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="inline-flex items-center px-3 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/30"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete All Data
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={loadSettings}
                disabled={loading}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-400 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Reset Changes
              </button>
              {hasChanges && (
                <span className="text-sm text-amber-600 dark:text-amber-400">
                  You have unsaved changes
                </span>
              )}
            </div>
            <button
              onClick={saveSettings}
              disabled={saving || loading || !hasChanges}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {saving ? (
                <RefreshCw className="animate-spin h-4 w-4 mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {hasChanges ? 'Save Settings' : 'No Changes'}
            </button>
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-500 mr-3" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Delete All Data</h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              This will permanently delete all your trades, goals, and settings. This action cannot be undone.
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
              Type <span className="font-mono font-bold">DELETE</span> to confirm:
            </p>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white mb-4"
              placeholder="Type DELETE"
            />
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirm('');
                }}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={deleteAllData}
                disabled={loading || deleteConfirm !== 'DELETE'}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="animate-spin h-4 w-4 mx-auto" />
                ) : (
                  'Delete All Data'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
