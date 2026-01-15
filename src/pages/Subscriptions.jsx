import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Crown, Users, TrendingUp, Star, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../axios';
import { getTraders, subscribeToTrader, unsubscribeFromTrader, getMySubscriptions } from '../api/social';

/**
 * Subscriptions Page - Browse and manage trader subscriptions
 */
export default function Subscriptions() {
  const [traders, setTraders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    loadTraders();
  }, [filter]);

  const loadTraders = async () => {
    setLoading(true);
    try {
      if (filter === 'subscribed') {
        const { data } = await getMySubscriptions();
        // Handle if API returns { subscriptions: [...] } or just [...]
        setTraders(data?.subscriptions?.map(sub => sub.trader || sub) || data || []);
      } else {
        // Only send verified param if we are filtering by verified
        // Otherwise sending verified: false might filter for unverified traders only
        const params = {};
        if (filter === 'verified') {
          params.verified = true;
        }
        
        const { data } = await getTraders(params);
        const items = Array.isArray(data)
          ? data
          : data?.traders || data?.items || data?.results || [];
        setTraders(items);
      }
    } catch (error) {
      console.error('Failed to load traders:', error);
      toast.error('Failed to load traders');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (traderId, isSubscribed) => {
    try {
      if (isSubscribed) {
        await unsubscribeFromTrader(traderId);
        toast.success('Unsubscribed!');
      } else {
        await api.post('/api/subscriptions/subscribe', { trader_id: traderId, tier: 'free' });
        toast.success('Following!');
      }
      loadTraders();
    } catch (error) {
      console.error('Subscribe failed:', error);
      toast.error('Action failed');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-3xl shadow-lg p-6 animate-pulse">
            <div className="flex gap-4">
              <div className="w-20 h-20 bg-gray-200 rounded-full" />
              <div className="flex-1">
                <div className="h-5 bg-gray-200 rounded w-40 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-60" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
            <p className="text-gray-500 mt-1">Follow top traders and get exclusive insights</p>
          </div>
          <div className="flex gap-3">
            {[
              { value: 'all', label: 'All Traders' },
              { value: 'subscribed', label: 'Following' },
              { value: 'verified', label: 'Verified' },
            ].map(f => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-4 py-2 rounded-full font-medium transition-all ${
                  filter === f.value
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Traders Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {traders.map((trader) => (
          <motion.div
            key={trader.user_id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
          >
            {/* Cover */}
            <div className="h-24 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500" />
            
            {/* Profile */}
            <div className="p-6 -mt-12">
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div className="relative">
                    <img
                      src={trader.avatar_url || `https://i.pravatar.cc/150?u=${trader.user_id}`}
                      alt={trader.username}
                      className="w-20 h-20 rounded-full border-4 border-white shadow-lg cursor-pointer"
                      onClick={() => navigate(`/trader/${trader.user_id}`)}
                    />
                    {trader.verified && (
                      <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
                        <Crown className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="mt-8">
                    <h3 
                      className="font-bold text-gray-900 text-lg cursor-pointer hover:underline"
                      onClick={() => navigate(`/trader/${trader.user_id}`)}
                    >
                      {trader.username}
                    </h3>
                    <p className="text-gray-500 text-sm">{trader.bio || 'Professional FIFA Trader'}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleSubscribe(trader.user_id, trader.is_subscribed)}
                  className={`mt-8 px-6 py-2 rounded-full font-semibold transition-all ${
                    trader.is_subscribed
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {trader.is_subscribed ? 'Following' : 'Follow'}
                </button>
              </div>

              {/* Stats */}
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-gray-900 font-bold">
                    <Users className="w-4 h-4" />
                    {trader.total_followers || 0}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Followers</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-gray-900 font-bold">
                    <TrendingUp className="w-4 h-4" />
                    {trader.total_posts || 0}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Posts</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-gray-900 font-bold">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    {trader.avg_rating?.toFixed(1) || '0.0'}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Rating</p>
                </div>
              </div>

              {/* Specialties */}
              {trader.specialties && trader.specialties.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {trader.specialties.slice(0, 3).map((spec, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => navigate(`/trader/${trader.user_id}`)}
                  className="flex-1 bg-gray-100 text-gray-900 px-4 py-2 rounded-full font-semibold hover:bg-gray-200 transition-all"
                >
                  View Profile
                </button>
                <button
                  onClick={() => navigate(`/messages/${trader.user_id}`)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-all"
                >
                  <MessageCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {traders.length === 0 && !loading && (
        <div className="bg-white rounded-3xl shadow-lg p-12 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No traders found</h3>
          <p className="text-gray-500">Try changing your filter or check back later</p>
        </div>
      )}
    </div>
  );
}
