// src/context/SettingsContext.jsx
import { createContext, useContext, useReducer, useEffect } from 'react';
import api from '../utils/axios';

const SettingsContext = createContext();

const settingsReducer = (state, action) => {
  switch (action.type) {
    case 'SET_SETTINGS':
      return {
        ...state,
        ...action.payload,
        isLoading: false
      };
    case 'UPDATE_SETTING':
      return {
        ...state,
        [action.key]: action.value
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };
    default:
      return state;
  }
};

const defaultSettings = {
  default_platform: "Console",
  custom_tags: [],
  currency_format: "coins",
  theme: "dark",
  timezone: "UTC",
  date_format: "US",
  include_tax_in_profit: true,
  default_chart_range: "30d",
  visible_widgets: ["profit", "tax", "balance", "trades"],
  isLoading: true
};

export const SettingsProvider = ({ children }) => {
  const [settings, dispatch] = useReducer(settingsReducer, defaultSettings);

  // Load settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await api.get('/api/settings');
      dispatch({ type: 'SET_SETTINGS', payload: response.data });
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updateSetting = async (key, value) => {
    try {
      // Optimistic update
      dispatch({ type: 'UPDATE_SETTING', key, value });
      
      // Persist to server
      const newSettings = { ...settings, [key]: value };
      await api.post('/api/settings', newSettings);
    } catch (error) {
      console.error('Failed to update setting:', error);
      // Revert optimistic update on error
      fetchSettings();
    }
  };

  // Currency formatting helper
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return 'N/A';
    
    const num = Number(amount);
    
    switch (settings.currency_format) {
      case 'k':
        if (num >= 1000) {
          return `${(num / 1000).toFixed(1)}K`;
        }
        return num.toLocaleString();
      case 'm':
        if (num >= 1000000) {
          return `${(num / 1000000).toFixed(1)}M`;
        } else if (num >= 1000) {
          return `${(num / 1000).toFixed(1)}K`;
        }
        return num.toLocaleString();
      default:
        return num.toLocaleString();
    }
  };

  // Date formatting helper
  const formatDate = (date) => {
    if (!date) return 'N/A';
    
    try {
      const d = new Date(date);
      const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: settings.timezone
      };

      if (settings.date_format === 'EU') {
        return d.toLocaleString('en-GB', options);
      } else {
        return d.toLocaleString('en-US', options);
      }
    } catch (error) {
      return 'N/A';
    }
  };

  // Profit calculation helper
  const calculateProfit = (buy, sell, quantity, ea_tax = 0) => {
    const baseProfit = (sell - buy) * quantity;
    
    if (settings.include_tax_in_profit) {
      return baseProfit - ea_tax;
    }
    
    return baseProfit;
  };

  const value = {
    ...settings,
    updateSetting,
    formatCurrency,
    formatDate,
    calculateProfit,
    fetchSettings
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
