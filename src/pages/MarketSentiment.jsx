import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, TrendingUp, TrendingDown, MessageCircle, Twitter, Users, AlertCircle } from 'lucide-react';
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

  const getSentimentLabel = (score) => {
    if (score >= 70) return 'Very Bullish';
    if (score >= 50) return 'Bullish';
    if (score >= 30) return 'Bearish';
    return 'Very Bearish';
  };

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
            Real-time sentiment analysis from social media, Discord, and community signals
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
                <p className="text-sm text-slate-400 mb-2">Overall Market Sentiment</p>
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
                      strokeDashoffset={`${2 * Math.PI * 80 * (1 - sentimentData.overallScore / 100)}`}
                      className={`${getSentimentColor(sentimentData.overallScore).split(' ')[0]} transition-all duration-1000`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-black">{sentimentData.overallScore}</span>
                    <span className="text-sm text-slate-400">/ 100</span>
                  </div>
                </div>
                <h2 className={`text-3xl font-black ${getSentimentColor(sentimentData.overallScore).split(' ')[0]}`}>
                  {getSentimentLabel(sentimentData.overallScore)}
                </h2>
                <p className="text-slate-400 mt-2">{sentimentData.summary}</p>
              </div>
            </motion.div>

            {/* Sentiment Sources */}
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-slate-900/50 rounded-2xl p-6 border border-white/10"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-[#1DA1F2]/20 rounded-xl flex items-center justify-center">
                    <Twitter className="w-6 h-6 text-[#1DA1F2]" />
                  </div>
                  <div>
                    <h3 className="font-bold">Twitter</h3>
                    <p className="text-sm text-slate-400">
                      {sentimentData.sources?.twitter?.mentions || 0} mentions
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black">
                    {sentimentData.sources?.twitter?.score || 0}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                    getSentimentColor(sentimentData.sources?.twitter?.score || 0)
                  }`}>
                    {getSentimentLabel(sentimentData.sources?.twitter?.score || 0)}
                  </span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-slate-900/50 rounded-2xl p-6 border border-white/10"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-[#5865F2]/20 rounded-xl flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-[#5865F2]" />
                  </div>
                  <div>
                    <h3 className="font-bold">Discord</h3>
                    <p className="text-sm text-slate-400">
                      {sentimentData.sources?.discord?.messages || 0} messages
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black">
                    {sentimentData.sources?.discord?.score || 0}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                    getSentimentColor(sentimentData.sources?.discord?.score || 0)
                  }`}>
                    {getSentimentLabel(sentimentData.sources?.discord?.score || 0)}
                  </span>
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
                    <h3 className="font-bold">Community</h3>
                    <p className="text-sm text-slate-400">
                      {sentimentData.sources?.community?.traders || 0} traders
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black">
                    {sentimentData.sources?.community?.score || 0}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                    getSentimentColor(sentimentData.sources?.community?.score || 0)
                  }`}>
                    {getSentimentLabel(sentimentData.sources?.community?.score || 0)}
                  </span>
                </div>
              </motion.div>
            </div>

            {/* Trending Topics */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-slate-900/50 rounded-2xl p-6 border border-white/10 mb-6"
            >
              <h2 className="text-xl font-bold mb-4">Trending Topics</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {sentimentData.trendingTopics?.map((topic, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl border border-white/5"
                  >
                    <div className="flex items-center gap-3">
                      {topic.trend === 'up' ? (
                        <TrendingUp className="w-5 h-5 text-green-400" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-red-400" />
                      )}
                      <div>
                        <p className="font-bold">#{topic.hashtag}</p>
                        <p className="text-sm text-slate-400">{topic.mentions} mentions</p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                      topic.sentiment === 'positive' ? 'bg-green-400/10 text-green-400' :
                      topic.sentiment === 'negative' ? 'bg-red-400/10 text-red-400' :
                      'bg-yellow-400/10 text-yellow-400'
                    }`}>
                      {topic.sentiment}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Player Buzz */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-slate-900/50 rounded-2xl border border-white/10 overflow-hidden"
            >
              <div className="p-6 border-b border-white/10">
                <h2 className="text-xl font-bold">Most Talked About Players</h2>
              </div>
              <div className="divide-y divide-white/5">
                {sentimentData.topPlayers?.map((player, idx) => (
                  <div key={idx} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-black text-slate-600">#{idx + 1}</span>
                      <div>
                        <p className="font-bold">{player.name}</p>
                        <p className="text-sm text-slate-400">
                          {player.mentions} mentions • {player.changePercent >= 0 ? '+' : ''}
                          {player.changePercent}% price change
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                        getSentimentColor(player.sentimentScore)
                      }`}>
                        {getSentimentLabel(player.sentimentScore)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* AI Insights */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-6 bg-blue-900/20 border border-blue-500/30 rounded-xl p-6"
            >
              <div className="flex gap-3">
                <AlertCircle className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-blue-400 mb-2">AI Market Insight</h3>
                  <p className="text-slate-300">{sentimentData.aiInsight}</p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
};

export default MarketSentiment;
