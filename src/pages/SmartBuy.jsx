// src/pages/SmartBuy.jsx
import React, { useState, useEffect, useMemo } from "react";
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Target, 
  Clock, 
  DollarSign,
  Settings,
  RefreshCw,
  Star,
  Eye,
  ShoppingCart,
  BarChart3,
  Zap
} from "lucide-react";
import { 
  fetchSmartBuyData, 
  fetchMarketIntelligence, 
  submitSuggestionFeedback,
  fetchSuggestionStats,
  MARKET_STATES,
  BUY_CATEGORIES 
} from "../api/smartBuy";
import { addWatch } from "../api/watchlist";
import { useSettings } from "../context/SettingsContext";

const ACCENT = "#91db32";

const cardBase = "bg-gray-900/70 rounded-2xl p-4 border border-gray-800 hover:border-gray-700 transition-colors";

function MarketStateIndicator({ state, confidence }) {
  const stateConfig = {
    [MARKET_STATES.NORMAL]: { 
      color: "text-blue-400", 
      bg: "bg-blue-400/10", 
      label: "Normal Trading",
      icon: <BarChart3 size={16} />
    },
    [MARKET_STATES.PRE_CRASH]: { 
      color: "text-yellow-400", 
      bg: "bg-yellow-400/10", 
      label: "Pre-Crash Window",
      icon: <AlertTriangle size={16} />
    },
    [MARKET_STATES.CRASH_ACTIVE]: { 
      color: "text-red-400", 
      bg: "bg-red-400/10", 
      label: "Market Crash Active",
      icon: <TrendingDown size={16} />
    },
    [MARKET_STATES.RECOVERY]: { 
      color: "text-green-400", 
      bg: "bg-green-400/10", 
      label: "Recovery Phase",
      icon: <TrendingUp size={16} />
    },
    [MARKET_STATES.PROMO_HYPE]: { 
      color: "text-purple-400", 
      bg: "bg-purple-400/10", 
      label: "Promo Hype",
      icon: <Zap size={16} />
    }
  };

  const config = stateConfig[state] || stateConfig[MARKET_STATES.NORMAL];

  return (
    <div className={`${cardBase} ${config.bg} border-opacity-50`}>
      <div className="flex items-center gap-3">
        <div className={`${config.color}`}>
          {config.icon}
        </div>
        <div>
          <div className={`font-semibold ${config.color}`}>{config.label}</div>
          <div className="text-xs text-gray-400">Confidence: {confidence}%</div>
        </div>
      </div>
    </div>
  );
}

function SuggestionCard({ suggestion, onBuy, onWatchlist, onIgnore }) {
  const { formatCurrency } = useSettings();
  const [loading, setLoading] = useState(false);

  const handleAction = async (action) => {
    setLoading(true);
    try {
      if (action === "buy") {
        await onBuy(suggestion);
      } else if (action === "watchlist") {
        await onWatchlist(suggestion);
      } else if (action === "ignore") {
        await onIgnore(suggestion);
      }
      
      // Submit feedback to improve suggestions
      await submitSuggestionFeedback(suggestion.card_id, action);
    } catch (error) {
      console.error(`Action ${action} failed:`, error);
    } finally {
      setLoading(false);
    }
  };

  const profitColor = suggestion.expected_profit >= 0 ? "text-green-400" : "text-red-400";
  const riskColor = suggestion.risk_level === "low" ? "text-green-400" : 
                   suggestion.risk_level === "medium" ? "text-yellow-400" : "text-red-400";

  return (
    <div className={cardBase}>
      <div className="flex items-start gap-4">
        {/* Player Image */}
        <div className="relative">
          <img
            src={suggestion.image_url || "/img/card-placeholder.png"}
            alt={suggestion.name}
            className="w-20 h-28 object-contain rounded-lg bg-gray-800/50"
            onError={(e) => {
              e.currentTarget.src = "/img/card-placeholder.png";
            }}
          />
          <div className="absolute -top-1 -right-1">
            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center text-xs font-bold text-black">
              {suggestion.priority_score}
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-semibold text-white text-lg">{suggestion.name}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span>{suggestion.rating}</span>
                <span>•</span>
                <span>{suggestion.position}</span>
                <span>•</span>
                <span>{suggestion.version || "Base"}</span>
              </div>
            </div>
            <div className={`px-2 py-1 rounded-full text-xs font-semibold ${riskColor} bg-black/20`}>
              {suggestion.risk_level?.toUpperCase()} RISK
            </div>
          </div>

          {/* Price Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="text-xs text-gray-400">Current Price</div>
              <div className="font-semibold text-white">{formatCurrency(suggestion.current_price)}</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="text-xs text-gray-400">Target Sell</div>
              <div className="font-semibold text-white">{formatCurrency(suggestion.target_price)}</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="text-xs text-gray-400">Expected Profit</div>
              <div className={`font-semibold ${profitColor}`}>
                {suggestion.expected_profit >= 0 ? "+" : ""}{formatCurrency(suggestion.expected_profit)}
              </div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="text-xs text-gray-400">Time to Profit</div>
              <div className="font-semibold text-white">{suggestion.time_to_profit}</div>
            </div>
          </div>

          {/* Reason */}
          <div className="mb-4">
            <div className="text-sm text-gray-300 leading-relaxed">
              <strong>Why this card:</strong> {suggestion.reason}
            </div>
            {suggestion.category && (
              <div className="mt-2">
                <span className="px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {suggestion.category.replace(/_/g, " ").toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleAction("buy")}
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-green-500/90 hover:bg-green-500 text-black font-semibold flex items-center gap-2 disabled:opacity-50"
            >
              <ShoppingCart size={16} />
              Mark as Bought
            </button>
            <button
              onClick={() => handleAction("watchlist")}
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 flex items-center gap-2 disabled:opacity-50"
            >
              <Eye size={16} />
              Add to Watchlist
            </button>
            <button
              onClick={() => handleAction("ignore")}
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 flex items-center gap-2 disabled:opacity-50"
            >
              Not Interested
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterPanel({ filters, onChange, onReset }) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className={cardBase}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Settings size={18} />
          Suggestion Filters
        </h3>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-blue-400 hover:text-blue-300"
        >
          {showAdvanced ? "Simple" : "Advanced"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm text-gray-300 mb-1">Budget</label>
          <input
            type="number"
            min="1000"
            step="1000"
            value={filters.budget}
            onChange={(e) => onChange({ ...filters, budget: Number(e.target.value) })}
            className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">Risk Tolerance</label>
          <select
            value={filters.risk_tolerance}
            onChange={(e) => onChange({ ...filters, risk_tolerance: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
          >
            <option value="conservative">Conservative</option>
            <option value="moderate">Moderate</option>
            <option value="aggressive">Aggressive</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">Time Horizon</label>
          <select
            value={filters.time_horizon}
            onChange={(e) => onChange({ ...filters, time_horizon: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
          >
            <option value="quick_flip">Quick Flip (1-6h)</option>
            <option value="short">Short Term (6-48h)</option>
            <option value="long_term">Long Term (2-14d)</option>
          </select>
        </div>
      </div>

      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Preferred Categories</label>
            <div className="space-y-2">
              {Object.values(BUY_CATEGORIES).map((category) => (
                <label key={category} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.categories?.includes(category)}
                    onChange={(e) => {
                      const categories = filters.categories || [];
                      if (e.target.checked) {
                        onChange({ ...filters, categories: [...categories, category] });
                      } else {
                        onChange({ ...filters, categories: categories.filter(c => c !== category) });
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-300">
                    {category.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Rating Range</label>
            <div className="flex gap-2">
              <input
                type="number"
                min="40"
                max="99"
                value={filters.min_rating}
                onChange={(e) => onChange({ ...filters, min_rating: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
                placeholder="Min"
              />
              <input
                type="number"
                min="40"
                max="99"
                value={filters.max_rating}
                onChange={(e) => onChange({ ...filters, max_rating: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
                placeholder="Max"
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end mt-4">
        <button
          onClick={onReset}
          className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm"
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
}

export default function SmartBuy() {
  const [suggestions, setSuggestions] = useState([]);
  const [marketState, setMarketState] = useState(MARKET_STATES.NORMAL);
  const [marketIntelligence, setMarketIntelligence] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    budget: 100000,
    risk_tolerance: "moderate",
    time_horizon: "short",
    platform: "ps",
    categories: [],
    min_rating: 75,
    max_rating: 95
  });

  const loadData = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const [suggestionsData, intelligence, userStats] = await Promise.all([
        fetchSmartBuyData(filters),
        fetchMarketIntelligence(),
        fetchSuggestionStats()
      ]);

      setSuggestions(suggestionsData.suggestions);
      setMarketState(suggestionsData.market_state);
      setMarketIntelligence(intelligence);
      setStats(userStats);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [JSON.stringify(filters)]);

  const handleBuyAction = async (suggestion) => {
    // In a real app, this might open a trade logging modal or redirect to add-trade
    console.log("User wants to buy:", suggestion);
    alert(`Great choice! Remember to buy ${suggestion.name} around ${suggestion.current_price} coins.`);
  };

  const handleWatchlistAction = async (suggestion) => {
    try {
      await addWatch({
        player_name: suggestion.name,
        card_id: suggestion.card_id,
        version: suggestion.version || null,
        platform: filters.platform.toUpperCase(),
        notes: `Smart Buy suggestion: Target ${suggestion.target_price} coins`
      });
      alert(`${suggestion.name} added to your watchlist!`);
    } catch (error) {
      alert(`Failed to add to watchlist: ${error.message}`);
    }
  };

  const handleIgnoreAction = async (suggestion) => {
    setSuggestions(prev => prev.filter(s => s.card_id !== suggestion.card_id));
  };

  const resetFilters = () => {
    setFilters({
      budget: 100000,
      risk_tolerance: "moderate", 
      time_horizon: "short",
      platform: "ps",
      categories: [],
      min_rating: 75,
      max_rating: 95
    });
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-800 rounded w-64" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 bg-gray-800 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Brain size={32} style={{ color: ACCENT }} />
            Smart Buy Suggestions
          </h1>
          <p className="text-gray-400 mt-1">
            AI-powered trading opportunities based on market analysis
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Market State & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MarketStateIndicator 
          state={marketState} 
          confidence={marketIntelligence?.current_state_confidence || 0} 
        />
        
        {stats && (
          <>
            <div className={`${cardBase} bg-green-400/10`}>
              <div className="flex items-center gap-3">
                <Star className="text-green-400" size={16} />
                <div>
                  <div className="font-semibold text-green-400">{stats.success_rate}%</div>
                  <div className="text-xs text-gray-400">Success Rate</div>
                </div>
              </div>
            </div>
            
            <div className={`${cardBase} bg-blue-400/10`}>
              <div className="flex items-center gap-3">
                <DollarSign className="text-blue-400" size={16} />
                <div>
                  <div className="font-semibold text-blue-400">{stats.avg_profit.toLocaleString()}</div>
                  <div className="text-xs text-gray-400">Avg Profit</div>
                </div>
              </div>
            </div>
            
            <div className={`${cardBase} bg-purple-400/10`}>
              <div className="flex items-center gap-3">
                <Target className="text-purple-400" size={16} />
                <div>
                  <div className="font-semibold text-purple-400">{stats.suggestions_taken}/{stats.total_suggestions}</div>
                  <div className="text-xs text-gray-400">Taken</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Filters */}
      <FilterPanel 
        filters={filters} 
        onChange={setFilters}
        onReset={resetFilters}
      />

      {/* Error */}
      {error && (
        <div className="p-4 rounded-lg bg-red-900/20 border border-red-500/30 text-red-300">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} />
            {error}
          </div>
        </div>
      )}

      {/* Suggestions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">
            Buy Recommendations ({suggestions.length})
          </h2>
          {suggestions.length > 0 && (
            <div className="text-sm text-gray-400">
              Sorted by priority score
            </div>
          )}
        </div>

        {suggestions.length === 0 ? (
          <div className={`${cardBase} text-center py-12`}>
            <Brain size={48} className="mx-auto mb-4 text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-400 mb-2">No suggestions available</h3>
            <p className="text-gray-500">
              Try adjusting your filters or check back later for new opportunities.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {suggestions.map((suggestion) => (
              <SuggestionCard
                key={suggestion.card_id}
                suggestion={suggestion}
                onBuy={handleBuyAction}
                onWatchlist={handleWatchlistAction}
                onIgnore={handleIgnoreAction}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
