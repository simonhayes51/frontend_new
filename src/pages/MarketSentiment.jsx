import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, TrendingUp, Users, BarChart3, Lightbulb } from 'lucide-react';
import api from '../axios';
import toast from 'react-hot-toast';

const MarketSentiment = () => {
  const [sentimentData, setSentimentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('24h');

  useEffect(() => {
    fetchSentiment();
  }, [timeframe]);

  const fetchSentiment = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/api/market/sentiment?timeframe=${timeframe}`);
      setSentimentData(data);
    } catch (error) {
      toast.error(error.userMessage || 'Failed to fetch sentiment data');
    } finally {
      setLoading(false);
    }
  };

  const getSentimentColor = (score) => {
    if (score >= 70) return 'text-green-400 bg-green-400/10';
    if (score >= 50) return 'text-emerald-400 bg-emerald-400/10';
    if (score >= 30) return 'text-yellow-400 bg-yellow-400/10';
    return 'text-red-400 bg-red-400/10';
  };

  // sentiment.score/label come straight from the backend (derived from this
  // community's own logged trades) - no external social data involved.
  const score = sentimentData?.sentiment?.score ?? 0;
  const label = sentimentData?.sentiment?.label || 'Neutral';
  const marketStats = sentimentData?.market_stats || null;
  const trendingPlayers = sentimentData?.trending_players || [];
  const insights = sentimentData?.insights || [];

  return (
    <div className="min-h-screen bg-[#0e1320] text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-8 h-8 text-purple-400" />
            <h1 className="text-4xl font-black">Market Sentiment</h1>
          </div>
          <p className="text-slate-400">
            Community trade sentiment — derived entirely from this app's own users' recent buy/sell
            activity, not external social media or Discord signals.
          </p>
        </motion.div>

        {/* Timeframe Selector */}
        <div className="flex gap-2 mb-6">
          {['1h', '6h', '24h', '7d'].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-4 py-2 rounded-lg font-bold transition-all ${
                timeframe === tf
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800/50 text-slate-400 hover:text-white'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-purple-600/30 border-t-purple-600 rounded-full animate-spin" />
          </div>
        ) : sentimentData && (
          <>
            {/* Overall Sentiment */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 rounded-2xl p-8 mb-6 border border-white/10"
            >
              <div className="text-center">
                <p className="text-sm text-slate-400 mb-2">Community Trade Sentiment</p>
                <div className="relative w-48 h-48 mx-auto mb-4">
                  <svg className="w-48 h-48 transform -rotate-90">
                    <circle
                      cx="96"
                      cy="96"
                      r="80"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="none"
                      className="text-slate-700"
                    />
                    <circle
                      cx="96"
                      cy="96"
                      r="80"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 80}`}
                      strokeDashoffset={`${2 * Math.PI * 80 * (1 - score / 100)}`}
                      className={`${getSentimentColor(score).split(' ')[0]} transition-all duration-1000`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-black">{score}</span>
                    <span className="text-sm text-slate-400">/ 100</span>
                  </div>
                </div>
                <h2 className={`text-3xl font-black ${getSentimentColor(score).split(' ')[0]}`}>
                  {label}
                </h2>
                <p className="text-slate-400 mt-2">
                  {marketStats
                    ? `Based on ${marketStats.total_trades.toLocaleString()} trades logged by our users in the last ${timeframe} (${marketStats.win_rate}% profitable).`
                    : "Not enough trade activity in this window to compute a score."}
                </p>
              </div>
            </motion.div>

            {/* Underlying trade stats */}
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-slate-900/50 rounded-2xl p-6 border border-white/10"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-bold">Trades Logged</h3>
                    <p className="text-sm text-slate-400">in this timeframe</p>
                  </div>
                </div>
                <div className="text-2xl font-black">
                  {marketStats ? marketStats.total_trades.toLocaleString() : '—'}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-slate-900/50 rounded-2xl p-6 border border-white/10"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-bold">Profitable Trades</h3>
                    <p className="text-sm text-slate-400">of trades logged</p>
                  </div>
                </div>
                <div className="text-2xl font-black">
                  {marketStats ? marketStats.profitable_trades.toLocaleString() : '—'}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-slate-900/50 rounded-2xl p-6 border border-white/10"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-purple-600/20 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-bold">Win Rate</h3>
                    <p className="text-sm text-slate-400">across logged trades</p>
                  </div>
                </div>
                <div className="text-2xl font-black">
                  {marketStats ? `${marketStats.win_rate}%` : '—'}
                </div>
              </motion.div>
            </div>

            {/* Most Traded Players (real backend data: trending_players) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-slate-900/50 rounded-2xl border border-white/10 overflow-hidden mb-6"
            >
              <div className="p-6 border-b border-white/10">
                <h2 className="text-xl font-bold">Most Traded Players</h2>
                <p className="text-sm text-slate-400 mt-1">
                  Players our community traded most often in this timeframe
                </p>
              </div>
              {trendingPlayers.length === 0 ? (
                <div className="p-6 text-slate-500 text-sm">
                  Not enough trade activity in this window to show trending players.
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {trendingPlayers.map((player) => (
                    <div key={player.rank} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-2xl font-black text-slate-600">#{player.rank}</span>
                        <div>
                          <p className="font-bold">{player.player}</p>
                          <p className="text-sm text-slate-400">
                            {player.trade_count} trades • avg profit {player.avg_profit.toLocaleString()} coins
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`px-3 py-1 rounded-full text-sm font-bold ${getSentimentColor(player.win_rate)}`}>
                          {player.win_rate}% win rate
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Insights generated from the same trade data above */}
            {insights.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mt-6 bg-blue-900/20 border border-blue-500/30 rounded-xl p-6"
              >
                <div className="flex gap-3">
                  <Lightbulb className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-blue-400 mb-2">Community Trading Insights</h3>
                    <ul className="space-y-1 list-disc list-inside">
                      {insights.map((insight, idx) => (
                        <li key={idx} className="text-slate-300">
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MarketSentiment;
