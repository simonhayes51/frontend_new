import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Bookmark,
  Search,
  Filter,
  Trash2,
  ExternalLink,
  Heart,
  MessageCircle,
  TrendingUp,
  Lock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { getSavedPosts, unsavePost } from "../api/social";

const POST_STYLES = [
  { id: "flipping", label: "Flipping", icon: "⚡", color: "text-yellow-400" },
  { id: "sbc", label: "SBC Investment", icon: "🎯", color: "text-blue-400" },
  { id: "promo", label: "Promo Trading", icon: "🔥", color: "text-red-400" },
  { id: "mass_bidding", label: "Mass Bidding", icon: "💰", color: "text-green-400" },
  { id: "long_term", label: "Long-term Hold", icon: "📈", color: "text-purple-400" },
];

export default function SavedPosts() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTrader, setFilterTrader] = useState("");
  const [traders, setTraders] = useState([]);

  useEffect(() => {
    loadSavedPosts();
  }, []);

  const loadSavedPosts = async () => {
    setLoading(true);
    try {
      const { data } = await getSavedPosts();
      setPosts(data.posts || []);
      
      // Extract unique traders
      const uniqueTraders = [...new Set(data.posts?.map(p => ({
        id: p.user_id,
        username: p.author_username,
      })) || [])];
      setTraders(uniqueTraders);
    } catch (error) {
      console.error("Failed to load saved posts:", error);
      toast.error("Failed to load saved posts");
    } finally {
      setLoading(false);
    }
  };

  const handleUnsave = async (postId) => {
    if (!confirm("Remove this post from your library?")) return;

    try {
      await unsavePost(postId);
      setPosts(prev => prev.filter(p => p.id !== postId));
      toast.success("Post removed from library");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to remove post");
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = !searchQuery || 
      post.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.author_username?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTrader = !filterTrader || post.user_id === filterTrader;
    
    return matchesSearch && matchesTrader;
  });

  return (
    <div className="min-h-screen bg-[#0e1320] text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <Bookmark className="w-8 h-8 text-purple-400" />
            <h1 className="text-4xl font-black">Saved Posts</h1>
          </div>
          <p className="text-slate-400">Your personal library of saved trading insights</p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 space-y-4"
        >
          <div className="grid md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-white/10 rounded-xl text-sm focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
              />
            </div>

            {/* Trader Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <select
                value={filterTrader}
                onChange={(e) => setFilterTrader(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-white/10 rounded-xl text-sm focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all appearance-none"
              >
                <option value="">All Traders</option>
                {traders.map((trader) => (
                  <option key={trader.id} value={trader.id}>
                    {trader.username}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-purple-400" />
              <span className="text-slate-400">
                Total: <span className="font-bold text-white">{posts.length}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-purple-400" />
              <span className="text-slate-400">
                Filtered: <span className="font-bold text-white">{filteredPosts.length}</span>
              </span>
            </div>
          </div>
        </motion.div>

        {/* Posts Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-purple-600/30 border-t-purple-600 rounded-full animate-spin" />
          </div>
        ) : filteredPosts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Bookmark className="w-20 h-20 text-slate-700 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">
              {posts.length === 0 ? "No saved posts yet" : "No posts match your filters"}
            </h3>
            <p className="text-slate-400 mb-6">
              {posts.length === 0
                ? "Save posts from your favorite traders to build your personal library"
                : "Try adjusting your search or filters"}
            </p>
            {posts.length === 0 && (
              <button
                onClick={() => navigate("/community")}
                className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white px-6 py-3 rounded-xl font-semibold transition-all"
              >
                Explore Traders
              </button>
            )}
          </motion.div>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map((post, index) => (
              <SavedPostCard
                key={post.id}
                post={post}
                index={index}
                onUnsave={handleUnsave}
                onViewTrader={() => navigate(`/trader/${post.user_id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SavedPostCard({ post, index, onUnsave, onViewTrader }) {
  const styleData = POST_STYLES.find(s => s.id === post.style);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 hover:border-purple-500/30 transition-all group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <img
            src={post.author_avatar || "/server-logo.png"}
            alt={post.author_username}
            className="w-10 h-10 rounded-full border-2 border-purple-500/30"
          />
          <div>
            <div className="flex items-center gap-2">
              <button
                onClick={onViewTrader}
                className="font-bold hover:text-purple-400 transition-colors"
              >
                {post.author_username}
              </button>
              {post.is_premium && (
                <Lock className="w-3 h-3 text-yellow-400" />
              )}
            </div>
            <p className="text-xs text-slate-500">
              Saved {new Date(post.saved_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        <button
          onClick={() => onUnsave(post.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-500/10"
          title="Remove from library"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* Post Style Badge */}
      {styleData && (
        <div className="mb-3">
          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-slate-800/60 ${styleData.color}`}>
            <span>{styleData.icon}</span>
            {styleData.label}
          </span>
        </div>
      )}

      {/* Content */}
      {post.title && (
        <h3 className="text-lg font-bold mb-2">{post.title}</h3>
      )}
      
      <p className="text-slate-300 mb-4 line-clamp-3 whitespace-pre-wrap">
        {post.content}
      </p>

      {/* Metadata */}
      {post.player_name && (
        <div className="mb-4 p-3 bg-slate-950/60 rounded-xl border border-white/5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-xs text-slate-500 mb-1">Player</p>
              <p className="font-semibold">{post.player_name}</p>
            </div>
            {post.buy_range_min && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Buy Range</p>
                <p className="font-semibold text-green-400">
                  {post.buy_range_min}
                  {post.buy_range_max && ` - ${post.buy_range_max}`}
                </p>
              </div>
            )}
            {post.sell_target && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Sell Target</p>
                <p className="font-semibold text-blue-400">{post.sell_target}</p>
              </div>
            )}
            {post.confidence_level && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Confidence</p>
                <p className="font-semibold">{post.confidence_level}%</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-white/5">
        <div className="flex items-center gap-4 text-sm text-slate-400">
          <div className="flex items-center gap-1">
            <Heart className="w-4 h-4" />
            {post.likes_count || 0}
          </div>
          <div className="flex items-center gap-1">
            <MessageCircle className="w-4 h-4" />
            {post.comments_count || 0}
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            {post.tips_total ? `$${post.tips_total}` : "$0"}
          </div>
        </div>

        <button
          onClick={onViewTrader}
          className="flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300 font-semibold transition-colors"
        >
          View Trader
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
