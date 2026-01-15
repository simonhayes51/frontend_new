import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Star,
  Users,
  TrendingUp,
  Lock,
  Unlock,
  MessageCircle,
  DollarSign,
  Heart,
  Bookmark,
  Send,
  Check,
  Crown,
  Zap,
  Award,
  Calendar,
  MapPin,
  Globe,
  Twitter,
  Youtube,
  Twitch,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../axios';
import { getTraderProfile } from '../api/traders';
import { createCheckoutSession } from '../api/billing';
import UserHoverCard from '../components/UserHoverCard';

/**
 * Transfer Traders - OnlyFans Style Trader Profile
 * Complete redesign with cover photo, subscription tiers, earnings
 */
export default function TraderProfileNew() {
  const { traderId } = useParams();
  const navigate = useNavigate();
  const [trader, setTrader] = useState(null);
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [activeTab, setActiveTab] = useState('posts'); // posts, about, media
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);

  const normalizeUrl = (value) => {
    if (!value) return '';
    if (value.startsWith('http://') || value.startsWith('https://')) return value;
    return `https://${value}`;
  };

  const socialLinks = [
    {
      label: 'Website',
      value: trader?.website_url,
      icon: Globe,
    },
    {
      label: 'Twitter',
      value: trader?.twitter_url,
      icon: Twitter,
    },
    {
      label: 'YouTube',
      value: trader?.youtube_url,
      icon: Youtube,
    },
    {
      label: 'Twitch',
      value: trader?.twitch_url,
      icon: Twitch,
    },
  ].filter((item) => item.value);

  useEffect(() => {
    if (!traderId || traderId === 'undefined' || traderId === 'null') return;
    loadTraderProfile();
  }, [traderId]);

  const loadTraderProfile = async () => {
    setLoading(true);
    try {
      const profileRes = await getTraderProfile(traderId);
      setTrader(profileRes.data);
      setIsSubscribed(profileRes.data.is_subscribed || false);

      const postsRes = await api.get(`/api/feed?trader_id=${traderId}`);
      setPosts(postsRes.data.posts || []);
    } catch (error) {
      console.error('Failed to load trader:', error);
      toast.error('Failed to load trader profile');
    }

    try {
      const statsRes = await api.get(`/api/subscriptions/trader/${traderId}/subscription-stats`);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Failed to load subscription stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = (tier = 'free') => {
    if (tier === 'free') {
      subscribeToTrader('free');
    } else {
      setShowSubscribeModal(true);
    }
  };

  const subscribeToTrader = async (tier) => {
    try {
      if (tier === 'free') {
        if (!traderId || traderId === 'undefined' || traderId === 'null') {
          throw new Error('Missing trader id');
        }
        await api.post('/api/subscriptions/subscribe', { trader_id: traderId, tier: 'free' });
        toast.success(`Followed successfully!`);
        setIsSubscribed(true);
        setShowSubscribeModal(false);
        loadTraderProfile();
      } else {
        const res = await createCheckoutSession({
          traderId: traderId,
          tier: tier,
          billingCycle: 'month'
        });
        
        if (res.data?.url) {
          window.location.href = res.data.url;
        } else {
          toast.error("Failed to initiate checkout");
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to subscribe');
    }
  };

  const handleMessage = () => {
    if (!traderId || traderId === 'undefined' || traderId === 'null') return;
    navigate(`/messages/${traderId}`);
  };

  const handleTip = () => {
    // TODO: Open tip modal
    toast.success('Tip feature coming soon!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-cyan/30 border-t-brand-cyan rounded-full animate-spin" />
      </div>
    );
  }

  if (!trader) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Trader Not Found</h2>
          <p className="text-gray-400 mb-6">This trader profile doesn't exist</p>
          <button
            onClick={() => navigate('/feed')}
            className="bg-gradient-brand text-white px-6 py-3 rounded-xl font-semibold"
          >
            Back to Feed
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Cover Photo */}
      <div className="relative h-64 md:h-80 bg-gradient-brand overflow-hidden">
        {trader.header_image_url && (
          <img
            src={trader.header_image_url}
            alt={`${trader.username} header`}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black/40" />
        
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 bg-black/50 hover:bg-black/70 text-white px-4 py-2 rounded-xl backdrop-blur-sm transition-all"
        >
          ← Back
        </button>

        {/* Verified Badge */}
        {trader.verified && (
          <div className="absolute top-4 right-4 bg-brand-cyan text-dark-bg px-4 py-2 rounded-full font-semibold flex items-center gap-2 shadow-glow-cyan">
            <Check className="w-5 h-5" />
            Verified Trader
          </div>
        )}
      </div>

      {/* Profile Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="relative -mt-20 md:-mt-24">
          <div className="bg-dark-card border border-white/10 rounded-3xl shadow-card p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <img
                  src={trader.avatar_url || '/server-logo.png'}
                  alt={trader.username}
                  className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-dark-bg shadow-glow-cyan"
                />
              </div>

              {/* Info */}
              <div className="flex-1">
                {/* Name & Username */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                      {trader.username}
                    </h1>
                    {trader.bio && (
                      <p className="text-gray-400 max-w-2xl">{trader.bio}</p>
                    )}
                    {(trader.location || trader.website_url) && (
                      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-400">
                        {trader.location && (
                          <span className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-brand-cyan" />
                            {trader.location}
                          </span>
                        )}
                        {trader.website_url && (
                          <a
                            href={normalizeUrl(trader.website_url)}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 text-brand-cyan hover:text-brand-cyan/80 transition-colors"
                          >
                            <Globe className="w-4 h-4" />
                            {trader.website_url}
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div>
                    <div className="text-2xl font-bold bg-gradient-brand bg-clip-text text-transparent">
                      {stats?.total || 0}
                    </div>
                    <div className="text-sm text-gray-500">Subscribers</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">
                      {trader.total_posts || 0}
                    </div>
                    <div className="text-sm text-gray-500">Posts</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white flex items-center gap-1">
                      <Star className="w-5 h-5 text-brand-cyan fill-brand-cyan" />
                      {trader.avg_rating ? trader.avg_rating.toFixed(1) : '0.0'}
                    </div>
                    <div className="text-sm text-gray-500">Rating</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-tier-elite">
                      {stats?.founding_count || 0}
                    </div>
                    <div className="text-sm text-gray-500">Founding</div>
                  </div>
                </div>

                {/* Specialties */}
                {trader.specialties && trader.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {trader.specialties.map((specialty, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-white/5 hover:bg-white/10 text-gray-300 rounded-full text-sm transition-all"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  {isSubscribed ? (
                    <>
                      <button
                        onClick={handleMessage}
                        className="flex-1 md:flex-none bg-gradient-brand text-white px-8 py-3 rounded-xl font-semibold hover:shadow-glow-cyan transition-all flex items-center justify-center gap-2"
                      >
                        <MessageCircle className="w-5 h-5" />
                        Message
                      </button>
                      <button
                        onClick={handleTip}
                        className="flex-1 md:flex-none bg-gradient-purple text-white px-8 py-3 rounded-xl font-semibold hover:shadow-glow-purple transition-all flex items-center justify-center gap-2"
                      >
                        <DollarSign className="w-5 h-5" />
                        Tip
                      </button>
                      <button className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all">
                        <Check className="w-5 h-5" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleSubscribe('free')}
                      className="flex-1 md:flex-none bg-gradient-brand text-white px-8 py-3 rounded-xl font-semibold hover:shadow-glow-cyan transition-all flex items-center justify-center gap-2"
                    >
                      <Users className="w-5 h-5" />
                      Subscribe Free
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Tiers (if not subscribed) */}
        {!isSubscribed && (
          <div className="mt-8 grid md:grid-cols-3 gap-6">
            <TierCard
              name="Basic"
              price="$4.99"
              color="basic"
              features={[
                'Access to all posts',
                'Comment on content',
                'Exclusive trading tips',
              ]}
              onClick={() => subscribeToTrader('basic')}
            />
            <TierCard
              name="Premium"
              price="$9.99"
              color="premium"
              popular
              features={[
                'Everything in Basic',
                'Priority DM responses',
                'Weekly market analysis',
                'Request custom content',
              ]}
              onClick={() => subscribeToTrader('premium')}
            />
            <TierCard
              name="Elite"
              price="$19.99"
              color="elite"
              features={[
                'Everything in Premium',
                '1-on-1 trading sessions',
                'Early access to trades',
                'Personal Discord channel',
              ]}
              onClick={() => subscribeToTrader('elite')}
            />
          </div>
        )}

        {/* Tabs */}
        <div className="mt-8 border-b border-white/10">
          <div className="flex gap-6">
            {['posts', 'about', 'media'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 px-2 font-semibold capitalize transition-all relative ${
                  activeTab === tab
                    ? 'text-brand-cyan'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-brand"
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="mt-8 pb-12">
          {activeTab === 'posts' && (
            <div className="space-y-6">
              {posts.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No posts yet
                </div>
              ) : (
                posts.map((post) => (
                  <PostCard key={post.id} post={post} trader={trader} />
                ))
              )}
            </div>
          )}

          {activeTab === 'about' && (
            <div className="bg-dark-card border border-white/10 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">About</h3>
              <p className="text-gray-400 mb-6">
                {trader.bio || 'No bio available'}
              </p>

              {socialLinks.length > 0 && (
                <>
                  <h4 className="text-lg font-bold text-white mb-3">Social Links</h4>
                  <div className="grid gap-3 md:grid-cols-2">
                    {socialLinks.map((link) => {
                      const Icon = link.icon;
                      return (
                        <a
                          key={link.label}
                          href={normalizeUrl(link.value)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-gray-300 hover:bg-white/10 transition-all"
                        >
                          <Icon className="w-5 h-5 text-brand-cyan" />
                          <div>
                            <div className="text-sm font-semibold text-white">{link.label}</div>
                            <div className="text-xs text-gray-400 break-all">{link.value}</div>
                          </div>
                        </a>
                      );
                    })}
                  </div>
                </>
              )}
              
              {trader.specialties && trader.specialties.length > 0 && (
                <>
                  <h4 className="text-lg font-bold text-white mb-3">Specialties</h4>
                  <div className="flex flex-wrap gap-2">
                    {trader.specialties.map((specialty, idx) => (
                      <span
                        key={idx}
                        className="px-4 py-2 bg-white/5 text-gray-300 rounded-xl"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'media' && (
            <div className="grid md:grid-cols-3 gap-4">
              {/* Media grid - placeholder */}
              <div className="text-center py-12 text-gray-500 md:col-span-3">
                No media available
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Tier Card Component
function TierCard({ name, price, color, features, popular, onClick }) {
  const colorClasses = {
    basic: 'from-tier-basic to-tier-basic/50',
    premium: 'from-tier-premium to-tier-premium/50',
    elite: 'from-tier-elite to-tier-elite/50',
  };

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      className={`relative bg-dark-card border ${
        popular ? 'border-tier-premium shadow-glow-purple' : 'border-white/10'
      } rounded-2xl p-6 cursor-pointer transition-all`}
      onClick={onClick}
    >
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-purple text-white px-4 py-1 rounded-full text-sm font-semibold">
          Most Popular
        </div>
      )}

      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center mb-4`}>
        <Crown className="w-6 h-6 text-white" />
      </div>

      <h3 className="text-2xl font-bold text-white mb-2">{name}</h3>
      <div className="text-3xl font-bold bg-gradient-brand bg-clip-text text-transparent mb-6">
        {price}<span className="text-sm text-gray-500">/month</span>
      </div>

      <ul className="space-y-3 mb-6">
        {features.map((feature, idx) => (
          <li key={idx} className="flex items-start gap-2 text-gray-400">
            <Check className="w-5 h-5 text-brand-cyan flex-shrink-0 mt-0.5" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <button className="w-full bg-gradient-brand text-white py-3 rounded-xl font-semibold hover:shadow-glow-cyan transition-all">
        Subscribe
      </button>
    </motion.div>
  );
}

// Post Card Component
function PostCard({ post, trader }) {
  return (
    <div className="bg-dark-card border border-white/10 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <UserHoverCard userId={trader.user_id} username={trader.username}>
          <img
            src={trader.avatar_url || '/server-logo.png'}
            alt={trader.username}
            className="w-10 h-10 rounded-full cursor-pointer"
          />
        </UserHoverCard>
        <div className="flex-1">
          <UserHoverCard userId={trader.user_id} username={trader.username}>
            <h4 className="font-semibold text-white cursor-pointer hover:text-brand-cyan transition-colors">
              {trader.username}
            </h4>
          </UserHoverCard>
          <p className="text-sm text-gray-500">
            {new Date(post.created_at).toLocaleDateString()}
          </p>
        </div>
        {post.is_premium && (
          <div className="bg-tier-premium/20 text-tier-premium px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
            <Lock className="w-3 h-3" />
            Premium
          </div>
        )}
      </div>

      <p className="text-gray-300 mb-4 whitespace-pre-wrap">{post.content}</p>

      {post.player_name && (
        <div className="bg-white/5 rounded-xl p-4 mb-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-gray-500 mb-1">Player</p>
              <p className="font-semibold text-white">{post.player_name}</p>
            </div>
            {post.buy_range_min && (
              <div>
                <p className="text-gray-500 mb-1">Buy Range</p>
                <p className="font-semibold text-green-400">
                  {post.buy_range_min}
                  {post.buy_range_max && ` - ${post.buy_range_max}`}
                </p>
              </div>
            )}
            {post.sell_target && (
              <div>
                <p className="text-gray-500 mb-1">Sell Target</p>
                <p className="font-semibold text-blue-400">{post.sell_target}</p>
              </div>
            )}
            {post.confidence_level && (
              <div>
                <p className="text-gray-500 mb-1">Confidence</p>
                <p className="font-semibold text-white">{post.confidence_level}%</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 text-gray-500">
        <button className="flex items-center gap-2 hover:text-red-400 transition-colors">
          <Heart className="w-5 h-5" />
          <span>{post.likes_count || 0}</span>
        </button>
        <button className="flex items-center gap-2 hover:text-brand-cyan transition-colors">
          <MessageCircle className="w-5 h-5" />
          <span>{post.comments_count || 0}</span>
        </button>
        <button className="flex items-center gap-2 hover:text-brand-purple transition-colors">
          <Bookmark className="w-5 h-5" />
        </button>
        <div className="flex-1" />
        <button className="flex items-center gap-2 hover:text-tier-elite transition-colors">
          <DollarSign className="w-5 h-5" />
          Tip
        </button>
      </div>
    </div>
  );
}
