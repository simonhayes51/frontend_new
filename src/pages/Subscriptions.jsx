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
      // Always fetch my subscriptions to check status
      const { data: mySubsData } = await getMySubscriptions().catch(() => ({ data: [] }));
      const mySubsItems = Array.isArray(mySubsData)
        ? mySubsData
        : mySubsData?.subscriptions || mySubsData?.items || mySubsData?.results || [];
      
      const subscribedIds = new Set(mySubsItems.map(sub => 
        sub.trader_id || sub.trader?.user_id || sub.trader?.id || sub.trader?.trader_id
      ));

      if (filter === 'subscribed') {
        const mapped = mySubsItems.map((sub) => {
          const trader = sub.trader || {};
          return {
            user_id: sub.trader_id || trader.user_id || trader.id || trader.trader_id,
            username: sub.trader_username || trader.username,
            avatar_url: sub.trader_avatar || trader.avatar_url,
            verified: sub.verified ?? trader.verified,
            bio: trader.bio,
            total_followers: trader.total_followers,
            total_posts: trader.total_posts,
            avg_rating: sub.avg_rating ?? trader.avg_rating,
            total_ratings: sub.total_ratings ?? trader.total_ratings,
            specialties: trader.specialties || [],
            is_subscribed: true,
          };
        });
        setTraders(mapped);
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
          
        // Map items to include is_subscribed from the Set
        const mapped = items.map(trader => ({
          ...trader,
          is_subscribed: subscribedIds.has(trader.user_id || trader.id || trader.trader_id)
        }));

        setTraders(mapped);
      }
    } catch (error) {
      console.error('Failed to load traders:', error);
      toast.error('Failed to load traders');
    } finally {
      setLoading(false);
    }
  };

  const getTraderId = (trader) => {
    return trader.user_id || trader.id || trader.trader_id;
  };

  const handleSubscribe = async (traderId, isSubscribed) => {
    try {
      if (isSubscribed) {
        await unsubscribeFromTrader(traderId);
        toast.success('Unsubscribed!');
      } else {
        if (!traderId || traderId === 'undefined' || traderId === 'null') {
          throw new Error('Missing trader id');
        }
        try {
          await subscribeToTrader(traderId);
          toast.success('Following!');
        } catch (err) {
          if (err.response?.status === 400 && err.response?.data?.detail?.includes('Already following')) {
             // Treat as success if already following
             toast.success('Already following!');
          } else {
             throw err;
          }
        }
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
        {traders.map((trader) => {
          const tid = getTraderId(trader);
          const fallbackId = trader.user_id || trader.id || trader.trader_id || 'default';

          return (
            <motion.div
              key={tid || fallbackId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
            >
              <div className="h-24 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500" />

              <div className="p-6 -mt-12">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className="relative">
                      <img
                        src={trader.avatar_url || `https://i.pravatar.cc/150?u=${fallbackId}`}
                        alt={trader.username}
                        className="w-20 h-20 rounded-full border-4 border-white shadow-lg cursor-pointer"
                        onClick={() => tid && navigate(`/trader/${tid}`)}
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
                        onClick={() => tid && navigate(`/trader/${tid}`)}
                      >
                        {trader.username}
                      </h3>
                      <p className="text-gray-500 text-sm">
                        {trader.bio || 'Professional FIFA Trader'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => tid && handleSubscribe(tid, trader.is_subscribed)}
                    disabled={!tid}
                    className={`mt-8 px-6 py-2 rounded-full font-semibold transition-all ${
                      !tid ? 'opacity-50 cursor-not-allowed' : ''
                    } ${
                      trader.is_subscribed
                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    {trader.is_subscribed ? 'Unfollow' : 'Follow'}
                  </button>
                </div>

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
                    {(trader.avg_rating ?? 0).toFixed(1)}
                    {trader.total_ratings ? (
                      <span className="text-xs text-gray-500">({trader.total_ratings})</span>
                    ) : null}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Rating</p>
                </div>
                </div>

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

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => tid && navigate(`/trader/${tid}`)}
                    disabled={!tid}
                    className="flex-1 bg-gray-100 text-gray-900 px-4 py-2 rounded-full font-semibold hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    View Profile
                  </button>
                  <button
                    onClick={() => tid && navigate(`/messages/${tid}`)}
                    disabled={!tid}
                    className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
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
