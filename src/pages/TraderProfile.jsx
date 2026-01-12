import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Star,
  Users,
  TrendingUp,
  Shield,
  Calendar,
  DollarSign,
  Lock,
  Unlock,
  Clock,
  CheckCircle,
  AlertCircle,
  Heart,
  MessageCircle,
  Bookmark,
  BarChart,
  Award,
  Zap,
  Crown,
  Activity,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import {
  getTraderProfile,
  checkSubscriptionStatus,
  getTraderSubscriptionStats,
  subscribeToTier,
  unsubscribeFromTrader,
  tipPost,
  savePost,
  unsavePost,
  getFeed,
} from "../api/social";
import ContentRequestSystem from "../components/ContentRequestSystem";

const SUBSCRIPTION_TIERS = [
  { id: "basic", name: "Basic Access", price: 4.99, color: "from-blue-600 to-blue-500" },
  { id: "premium", name: "Premium", price: 9.99, color: "from-purple-600 to-purple-500" },
  { id: "elite", name: "Elite VIP", price: 19.99, color: "from-yellow-600 to-orange-500" },
];

const POST_STYLES = [
  { id: "flipping", label: "Flipping", icon: "⚡", color: "text-yellow-400" },
  { id: "sbc", label: "SBC Investment", icon: "🎯", color: "text-blue-400" },
  { id: "promo", label: "Promo Trading", icon: "🔥", color: "text-red-400" },
  { id: "mass_bidding", label: "Mass Bidding", icon: "💰", color: "text-green-400" },
  { id: "long_term", label: "Long-term Hold", icon: "📈", color: "text-purple-400" },
];

const CONVICTION_LEVELS = [
  { value: "low", label: "Low", color: "bg-slate-600", icon: "○" },
  { value: "medium", label: "Medium", color: "bg-yellow-600", icon: "◐" },
  { value: "high", label: "High", color: "bg-green-600", icon: "●" },
];

export default function TraderProfile() {
  const { traderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [trader, setTrader] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isFoundingSubscriber, setIsFoundingSubscriber] = useState(false);
  const [selectedTier, setSelectedTier] = useState("basic");
  const [activeTab, setActiveTab] = useState("posts");
  const [loading, setLoading] = useState(true);
  const [subscriberStats, setSubscriberStats] = useState({
    total: 0,
    active_percentage: 0,
    founding_count: 0,
  });

  useEffect(() => {
    loadTraderProfile();
  }, [traderId]);

  const loadTraderProfile = async () => {
    setLoading(true);
    try {
      // Load trader profile
      const { data: traderData } = await getTraderProfile(traderId);
      setTrader(traderData);

      // Check subscription status
      const { data: subStatus } = await checkSubscriptionStatus(traderId);
      setIsSubscribed(subStatus.is_subscribed);
      setIsFoundingSubscriber(subStatus.is_founding_subscriber || false);
      if (subStatus.tier) {
        setSelectedTier(subStatus.tier);
      }

      // Load subscription stats
      const { data: stats } = await getTraderSubscriptionStats(traderId);
      setSubscriberStats(stats);

      // Load trader's posts
      const { data: feedData } = await getFeed({ trader_id: traderId, limit: 20 });
      setPosts(feedData.items || []);
      
    } catch (error) {
      console.error("Failed to load trader profile:", error);
      toast.error("Failed to load trader profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    
    try {
      const { data } = await subscribeToTier(traderId, selectedTier);
      toast.success(data.message || `Subscribed to ${selectedTier} tier!`);
      setIsSubscribed(true);
      setIsFoundingSubscriber(data.is_founding_subscriber);
      loadTraderProfile(); // Reload to get updated stats
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to subscribe");
    }
  };

  const handleUnsubscribe = async () => {
    const savedPostCount = posts.filter(p => p.is_premium && p.saved).length;
    if (savedPostCount > 0) {
      const confirmed = window.confirm(
        `You have ${savedPostCount} saved premium posts from this trader. Unsubscribing will remove access to subscriber-only content. Continue?`
      );
      if (!confirmed) return;
    }
    
    try {
      await unsubscribeFromTrader(traderId);
      toast.success("Unsubscribed successfully");
      setIsSubscribed(false);
      setIsFoundingSubscriber(false);
      loadTraderProfile();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to unsubscribe");
    }
  };

  const handleTipPost = async (postId, amount = 5) => {
    if (!user) {
      navigate("/login");
      return;
    }
    
    try {
      const { data } = await tipPost(postId, amount);
      toast.success(`Tipped $${amount}! 🎉`);
      // Update post tips in local state
      setPosts(prev => prev.map(p => 
        p.id === postId ? { ...p, tips_total: data.total_tips } : p
      ));
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to send tip");
    }
  };

  const handleSavePost = async (postId) => {
    if (!user) {
      navigate("/login");
      return;
    }
    
    try {
      const post = posts.find(p => p.id === postId);
      if (post?.saved) {
        await unsavePost(postId);
        toast.success("Post removed from library");
        setPosts(prev => prev.map(p => 
          p.id === postId ? { ...p, saved: false } : p
        ));
      } else {
        await savePost(postId);
        toast.success("Post saved to your library");
        setPosts(prev => prev.map(p => 
          p.id === postId ? { ...p, saved: true } : p
        ));
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to save post");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0e1320] text-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-600/30 border-t-purple-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!trader) {
    return (
      <div className="min-h-screen bg-[#0e1320] text-white p-6">
        <div className="max-w-2xl mx-auto text-center py-20">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Trader Not Found</h2>
          <button
            onClick={() => navigate("/community")}
            className="mt-4 bg-purple-600 hover:bg-purple-500 px-6 py-2 rounded-xl"
          >
            Browse Traders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0e1320] text-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-slate-900/80 to-[#0e1320] border-b border-white/10">
        <div className="max-w-6xl mx-auto p-6">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            {/* Avatar */}
            <div className="relative">
              <img
                src={trader.avatar_url}
                alt={trader.display_name}
                className="w-32 h-32 rounded-2xl border-4 border-purple-500 shadow-2xl"
              />
              {trader.verified && (
                <div className="absolute -bottom-2 -right-2 bg-blue-500 rounded-full p-2">
                  <Shield className="w-6 h-6 text-white" />
                </div>
              )}
              {isFoundingSubscriber && (
                <div className="absolute -top-2 -right-2 bg-yellow-500 rounded-full p-1.5">
                  <Crown className="w-5 h-5 text-white" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-black">{trader.display_name}</h1>
                {trader.verified && (
                  <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-1 rounded-full font-semibold">
                    VERIFIED
                  </span>
                )}
              </div>
              <p className="text-slate-400 mb-4">{trader.bio}</p>

              {/* Status */}
              <div className="flex items-center gap-2 mb-4">
                <div className={`w-2 h-2 rounded-full ${trader.status.active ? "bg-green-400 animate-pulse" : "bg-slate-600"}`} />
                <span className="text-sm text-slate-300">{trader.status.mood}</span>
                <span className="text-xs text-slate-500">• Posted {trader.status.last_post}</span>
              </div>

              {/* Specialties */}
              <div className="flex flex-wrap gap-2 mb-4">
                {trader.specialties.map((spec) => (
                  <span
                    key={spec}
                    className="bg-purple-900/30 text-purple-300 text-xs px-3 py-1 rounded-full border border-purple-500/30"
                  >
                    {spec}
                  </span>
                ))}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <QuickStat icon={<Users className="w-4 h-4" />} label="Subscribers" value={trader.stats.subscribers} />
                <QuickStat icon={<Star className="w-4 h-4 text-yellow-400" />} label="Rating" value={`${trader.stats.avg_rating}/5.0`} />
                <QuickStat icon={<TrendingUp className="w-4 h-4 text-green-400" />} label="Win Rate" value={`${trader.stats.win_rate}%`} />
                <QuickStat icon={<Activity className="w-4 h-4 text-blue-400" />} label="Avg ROI" value={`${trader.stats.avg_roi}%`} />
              </div>
            </div>

            {/* Subscription Card */}
            <div className="w-full md:w-80">
              <div className="bg-gradient-to-br from-purple-900/40 to-indigo-900/20 border border-purple-500/30 rounded-2xl p-6">
                {!isSubscribed ? (
                  <>
                    <div className="text-center mb-4">
                      <p className="text-sm text-slate-400 mb-1">Subscribe for</p>
                      <div className="text-4xl font-black text-white mb-1">
                        ${isFoundingSubscriber ? trader.founding_price_lock : trader.subscription_price}
                        <span className="text-lg text-slate-400">/mo</span>
                      </div>
                      {trader.subscription_cap && (
                        <p className="text-xs text-yellow-400">
                          {trader.subscription_cap - subscriberStats.total} spots left
                        </p>
                      )}
                    </div>

                    <button
                      onClick={handleSubscribe}
                      className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white py-3 rounded-xl font-bold mb-3 transition-all"
                    >
                      Subscribe Now
                    </button>

                    <div className="space-y-2 text-xs text-slate-300">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span>Exclusive subscriber-only posts</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span>Q&A access & content requests</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span>Save posts to personal library</span>
                      </div>
                      {!isFoundingSubscriber && subscriberStats.founding_count < 50 && (
                        <div className="flex items-start gap-2 pt-2 border-t border-white/10">
                          <Crown className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                          <span className="text-yellow-400">
                            Founding subscriber perks available!
                          </span>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-6 h-6 text-green-400" />
                        <span className="font-bold">Subscribed</span>
                      </div>
                      {isFoundingSubscriber && (
                        <Crown className="w-6 h-6 text-yellow-400" />
                      )}
                    </div>

                    <button
                      onClick={handleUnsubscribe}
                      className="w-full bg-slate-800/60 hover:bg-slate-700/60 text-white py-2 rounded-xl text-sm mb-3 transition-all"
                    >
                      Manage Subscription
                    </button>

                    <div className="text-xs text-slate-400 text-center">
                      {isFoundingSubscriber ? (
                        <p className="text-yellow-400 font-semibold">
                          Founding member - ${trader.founding_price_lock}/mo locked
                        </p>
                      ) : (
                        <p>Next billing: {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Activity Indicator */}
              <div className="mt-4 bg-slate-900/40 border border-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400">Activity</span>
                  <Clock className="w-4 h-4 text-slate-500" />
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Posts this week:</span>
                    <span className="text-white font-semibold">{trader.stats.posts_this_week}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Response time:</span>
                    <span className="text-green-400 font-semibold">{trader.stats.response_time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Active subs:</span>
                    <span className="text-purple-400 font-semibold">{subscriberStats.active_percentage}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex gap-2 border-b border-white/10 mb-6">
          {["posts", "requests", "stats", "about"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-semibold capitalize transition-all ${
                activeTab === tab
                  ? "text-purple-400 border-b-2 border-purple-400"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === "posts" && (
          <div className="space-y-6 pb-20">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                isSubscribed={isSubscribed}
                onTip={handleTipPost}
                onSave={handleSavePost}
              />
            ))}
          </div>
        )}

        {activeTab === "requests" && (
          <div className="pb-20">
            <ContentRequestSystem
              traderId={traderId}
              isTrader={trader?.id === user?.id}
              isSubscribed={isSubscribed}
            />
          </div>
        )}

        {activeTab === "stats" && (
          <div className="pb-20">
            <TraderStats trader={trader} />
          </div>
        )}

        {activeTab === "about" && (
          <div className="pb-20">
            <AboutTrader trader={trader} />
          </div>
        )}
      </div>
    </div>
  );
}

function QuickStat({ icon, label, value }) {
  return (
    <div className="bg-slate-900/40 rounded-xl p-3">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs text-slate-400">{label}</span>
      </div>
      <p className="text-lg font-bold text-white">{value}</p>
    </div>
  );
}

function PostCard({ post, isSubscribed, onTip, onSave }) {
  const isLocked = post.subscriber_only && !isSubscribed;
  const convictionData = CONVICTION_LEVELS.find(c => c.value === post.conviction);
  const styleData = POST_STYLES.find(s => s.id === post.style);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-slate-900/60 border border-white/10 rounded-2xl p-6 ${isLocked ? "opacity-75" : ""}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {styleData && (
              <span className={`text-2xl ${styleData.color}`}>{styleData.icon}</span>
            )}
            <h3 className="text-xl font-bold flex items-center gap-2">
              {post.title}
              {isLocked && <Lock className="w-5 h-5 text-yellow-400" />}
            </h3>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span>{post.created_at}</span>
            {convictionData && (
              <span className={`${convictionData.color} text-white px-2 py-0.5 rounded-full flex items-center gap-1`}>
                <span>{convictionData.icon}</span>
                {convictionData.label} Conviction
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {isLocked ? (
        <div className="bg-slate-950/60 border border-yellow-500/30 rounded-xl p-8 text-center">
          <Lock className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
          <p className="text-lg font-semibold mb-2">Subscriber-Only Content</p>
          <p className="text-sm text-slate-400 mb-4">Subscribe to unlock this exclusive trade idea</p>
          <button className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-xl">
            Subscribe Now
          </button>
        </div>
      ) : (
        <>
          <p className="text-slate-200 mb-4 whitespace-pre-wrap">{post.content}</p>

          {/* Trade Details */}
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="bg-slate-950/60 rounded-xl p-4">
              <p className="text-xs text-slate-400 mb-2">Entry Range</p>
              <p className="text-lg font-bold text-green-400">
                {post.entry_range.min.toLocaleString()} - {post.entry_range.max.toLocaleString()} coins
              </p>
            </div>
            <div className="bg-slate-950/60 rounded-xl p-4">
              <p className="text-xs text-slate-400 mb-2">Sell Target</p>
              <p className="text-lg font-bold text-blue-400">
                {post.sell_target.toLocaleString()} coins
              </p>
            </div>
          </div>

          {/* Invalidation */}
          {post.invalidation && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 mb-4">
              <p className="text-xs text-red-400 font-semibold mb-1">❌ Invalidation Signal</p>
              <p className="text-sm text-slate-200">{post.invalidation}</p>
            </div>
          )}

          {/* Outcome */}
          {post.outcome && (
            <div className={`border rounded-xl p-4 mb-4 ${
              post.outcome.result === "win"
                ? "bg-green-900/20 border-green-500/30"
                : "bg-red-900/20 border-red-500/30"
            }`}>
              <p className={`text-xs font-semibold mb-1 ${
                post.outcome.result === "win" ? "text-green-400" : "text-red-400"
              }`}>
                📊 Trade Outcome - {post.outcome.result === "win" ? "WIN" : "LOSS"}
              </p>
              <p className="text-sm text-slate-200 mb-1">
                Profit: <span className="font-bold">{post.outcome.profit.toLocaleString()} coins</span>
              </p>
              <p className="text-xs text-slate-400">{post.outcome.notes}</p>
            </div>
          )}
        </>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 pt-4 border-t border-white/10">
        <button className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
          <Heart className="w-5 h-5" />
          <span>{post.stats.likes}</span>
        </button>
        <button className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
          <MessageCircle className="w-5 h-5" />
          <span>{post.stats.comments}</span>
        </button>
        <button
          onClick={() => onSave(post.id)}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-purple-400 transition-colors"
        >
          <Bookmark className="w-5 h-5" />
          <span>{post.stats.saves}</span>
        </button>
        {!isLocked && (
          <button
            onClick={() => onTip(post.id)}
            className="ml-auto flex items-center gap-2 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
          >
            <Zap className="w-4 h-4" />
            Tip ({post.stats.tips})
          </button>
        )}
      </div>
    </motion.div>
  );
}

function TraderStats({ trader }) {
  return (
    <div className="space-y-6">
      <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6">
        <h3 className="text-xl font-bold mb-4">Performance Metrics</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-slate-950/60 rounded-xl p-4">
            <p className="text-slate-400 text-sm mb-1">Total Posts</p>
            <p className="text-3xl font-bold">{trader.stats.total_posts}</p>
          </div>
          <div className="bg-slate-950/60 rounded-xl p-4">
            <p className="text-slate-400 text-sm mb-1">Win Rate</p>
            <p className="text-3xl font-bold text-green-400">{trader.stats.win_rate}%</p>
          </div>
          <div className="bg-slate-950/60 rounded-xl p-4">
            <p className="text-slate-400 text-sm mb-1">Average ROI</p>
            <p className="text-3xl font-bold text-blue-400">{trader.stats.avg_roi}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AboutTrader({ trader }) {
  return (
    <div className="space-y-6">
      <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6">
        <h3 className="text-xl font-bold mb-4">About</h3>
        <p className="text-slate-300 leading-relaxed">{trader.bio}</p>
      </div>

      <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-2xl p-6">
        <p className="text-xs text-yellow-400 font-semibold mb-2">⚠️ DISCLAIMER</p>
        <p className="text-sm text-slate-300">
          All content is for educational and opinion purposes only. Trading involves risk. 
          Past performance does not guarantee future results. Always do your own research.
        </p>
      </div>
    </div>
  );
}
