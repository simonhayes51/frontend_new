import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Upload,
  X,
  Image as ImageIcon,
  Video,
  Link as LinkIcon,
  DollarSign,
  Clock,
  Users,
  Star,
  Award,
  Activity,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { createPost, getFeed, getTraderProfile } from "../api/social";
import toast from "react-hot-toast";
import FeedPanel from "../components/social/FeedPanel";

const POST_TYPES = [
  { value: "quick_flip", label: "Quick Flip", icon: "⚡", color: "text-yellow-400" },
  { value: "prediction", label: "Market Prediction", icon: "🔮", color: "text-purple-400" },
  { value: "tip", label: "Trading Tip", icon: "💡", color: "text-blue-400" },
  { value: "analysis", label: "Deep Analysis", icon: "📊", color: "text-green-400" },
];

const TraderStats = ({ stats }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    <StatCard icon={<Users className="w-5 h-5" />} label="Followers" value={stats.followers || 0} />
    <StatCard icon={<Star className="w-5 h-5" />} label="Rating" value={(stats.rating || 0).toFixed(1)} />
    <StatCard icon={<Activity className="w-5 h-5" />} label="Posts" value={stats.posts || 0} />
    <StatCard icon={<Award className="w-5 h-5" />} label="Win Rate" value={`${stats.winRate || 0}%`} />
  </div>
);

const StatCard = ({ icon, label, value }) => (
  <div className="bg-slate-900/60 border border-white/10 rounded-xl p-4">
    <div className="flex items-center gap-2 mb-1 text-slate-400">{icon} <span className="text-xs">{label}</span></div>
    <div className="text-2xl font-bold text-white">{value}</div>
  </div>
);

const ImageUploadZone = ({ images, onAdd, onRemove }) => {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFiles = (files) => {
    Array.from(files).forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          onAdd({ file, preview: e.target.result });
        };
        reader.readAsDataURL(file);
      } else {
        toast.error("Only image files are supported");
      }
    });
  };

  return (
    <div className="space-y-3">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          dragActive
            ? "border-purple-500 bg-purple-500/10"
            : "border-white/20 hover:border-purple-500/50 hover:bg-purple-500/5"
        }`}
      >
        <ImageIcon className="w-10 h-10 mx-auto mb-3 text-slate-400" />
        <p className="text-sm text-slate-300 mb-1">
          <span className="text-purple-400 font-semibold">Click to upload</span> or drag and drop
        </p>
        <p className="text-xs text-slate-500">PNG, JPG, GIF up to 10MB</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {images.map((img, idx) => (
            <div key={idx} className="relative group">
              <img
                src={img.preview}
                alt="Upload preview"
                className="w-full h-24 object-cover rounded-lg border border-white/10"
              />
              <button
                type="button"
                onClick={() => onRemove(idx)}
                className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function TradersArea() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isTrader, setIsTrader] = useState(false);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [stats, setStats] = useState({
    followers: 0,
    rating: 0,
    posts: 0,
    winRate: 0,
  });

  const [post, setPost] = useState({
    title: "",
    content: "",
    post_type: "tip",
    premium: false,
    expires_in_hours: "",
    player_name: "",
    buy_range_min: "",
    buy_range_max: "",
    sell_target: "",
    confidence_level: "",
  });

  const [images, setImages] = useState([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    checkTraderStatus();
  }, [user]);

  const checkTraderStatus = async () => {
    try {
      const trader = user?.account_type === "trader" || user?.role === "trader" || user?.is_trader;
      setIsTrader(trader);
      if (trader) {
        // The Discord-OAuth `user` object never carries follower/rating/post
        // stats - those live in the trader_profiles row on the backend.
        // GET /api/traders/{traderId} (same real endpoint TraderProfile.jsx
        // uses for other traders) returns that row for the current user too.
        const currentUserId = user?.user_id || user?.id;
        if (currentUserId) {
          try {
            const { data } = await getTraderProfile(currentUserId);
            setStats({
              followers: data?.total_followers || 0,
              rating: data?.avg_rating || 0,
              posts: data?.total_posts || 0,
              // Backend doesn't track a win-rate metric yet - show a
              // genuine zero rather than a fake placeholder.
              winRate: data?.win_rate || 0,
            });
          } catch (statsError) {
            console.error("Failed to load trader stats:", statsError);
            setStats({ followers: 0, rating: 0, posts: 0, winRate: 0 });
          }
        } else {
          setStats({ followers: 0, rating: 0, posts: 0, winRate: 0 });
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!post.content.trim()) {
      toast.error("Please add content to your post");
      return;
    }

    setPosting(true);
    try {
      const payload = {
        title: post.title || undefined,
        content: post.content,
        post_type: post.post_type,
        is_premium: post.premium,
        expires_in_hours: post.expires_in_hours ? parseInt(post.expires_in_hours) : undefined,
        player_name: post.player_name || undefined,
        buy_range_min: post.buy_range_min ? parseInt(post.buy_range_min) : undefined,
        buy_range_max: post.buy_range_max ? parseInt(post.buy_range_max) : undefined,
        sell_target: post.sell_target ? parseInt(post.sell_target) : undefined,
        confidence_level: post.confidence_level ? parseInt(post.confidence_level) : undefined,
      };

      await createPost(payload);
      toast.success("Post published successfully!");
      
      setPost({
        title: "",
        content: "",
        post_type: "tip",
        premium: false,
        expires_in_hours: "",
        player_name: "",
        buy_range_min: "",
        buy_range_max: "",
        sell_target: "",
        confidence_level: "",
      });
      setImages([]);
      setShowAdvanced(false);
      
    } catch (error) {
      toast.error(error.userMessage || "Failed to publish post");
    } finally {
      setPosting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0e1320] text-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-600/30 border-t-purple-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isTrader) {
    return (
      <div className="min-h-screen bg-[#0e1320] text-white p-6">
        <div className="max-w-2xl mx-auto pt-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-purple-900/40 to-indigo-900/20 border border-purple-500/30 rounded-2xl p-8 text-center"
          >
            <Award className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-3">Traders Area - Access Required</h2>
            <p className="text-slate-300 mb-6">
              This area is exclusive to verified traders. Upgrade your account to share your trades, predictions, and
              insights with the community.
            </p>
            <button
              onClick={() => navigate("/community")}
              className="bg-gradient-to-r from-purple-600 to-indigo-500 hover:from-purple-500 hover:to-indigo-400 text-white px-6 py-3 rounded-xl font-semibold"
            >
              Request Trader Access
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0e1320] text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-8 h-8 text-purple-400" />
            <h1 className="text-4xl font-black">Traders Area</h1>
            <span className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-xs font-bold px-3 py-1 rounded-full">
              VERIFIED
            </span>
          </div>
          <p className="text-slate-400">Share your trades, tips, and market predictions with your followers</p>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          <TraderStats stats={stats} />
        </motion.div>

        {/* Create Post */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <form
            onSubmit={handleSubmit}
            className="bg-gradient-to-br from-slate-900/80 to-slate-900/40 border border-white/10 rounded-2xl p-6 space-y-5"
          >
            <div>
              <h2 className="text-xl font-bold mb-1">Create New Post</h2>
              <p className="text-sm text-slate-400">Share your latest trade, tip, or market analysis</p>
            </div>

            {/* Post Type */}
            <div className="flex flex-wrap gap-2">
              {POST_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setPost({ ...post, post_type: type.value })}
                  className={`px-4 py-2 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                    post.post_type === type.value
                      ? "bg-gradient-to-r from-purple-600 to-purple-500 text-white"
                      : "bg-slate-800/60 text-slate-300 hover:bg-slate-700/60"
                  }`}
                >
                  <span>{type.icon}</span>
                  <span className="text-sm">{type.label}</span>
                </button>
              ))}
            </div>

            {/* Title */}
            <input
              type="text"
              placeholder="Post title (optional)"
              value={post.title}
              onChange={(e) => setPost({ ...post, title: e.target.value })}
              className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-3 text-sm placeholder:text-slate-500"
            />

            {/* Content */}
            <textarea
              placeholder="Share your trade details, analysis, reasoning, and timing..."
              value={post.content}
              onChange={(e) => setPost({ ...post, content: e.target.value })}
              rows={6}
              className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-3 text-sm placeholder:text-slate-500 resize-none"
              required
            />

            {/* Image Upload */}
            <ImageUploadZone
              images={images}
              onAdd={(img) => setImages([...images, img])}
              onRemove={(idx) => setImages(images.filter((_, i) => i !== idx))}
            />

            {/* Advanced Options */}
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm text-purple-400 hover:text-purple-300 font-semibold"
            >
              {showAdvanced ? "Hide" : "Show"} Advanced Options
            </button>

            {showAdvanced && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-4 pt-4 border-t border-white/10"
              >
                <div className="grid md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Player name"
                    value={post.player_name}
                    onChange={(e) => setPost({ ...post, player_name: e.target.value })}
                    className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2 text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Confidence level (1-100)"
                    value={post.confidence_level}
                    onChange={(e) => setPost({ ...post, confidence_level: e.target.value })}
                    className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2 text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Buy range min"
                    value={post.buy_range_min}
                    onChange={(e) => setPost({ ...post, buy_range_min: e.target.value })}
                    className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2 text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Buy range max"
                    value={post.buy_range_max}
                    onChange={(e) => setPost({ ...post, buy_range_max: e.target.value })}
                    className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2 text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Sell target"
                    value={post.sell_target}
                    onChange={(e) => setPost({ ...post, sell_target: e.target.value })}
                    className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2 text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Expires in (hours)"
                    value={post.expires_in_hours}
                    onChange={(e) => setPost({ ...post, expires_in_hours: e.target.value })}
                    className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2 text-sm"
                  />
                </div>

                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={post.premium}
                    onChange={(e) => setPost({ ...post, premium: e.target.checked })}
                    className="rounded border-white/20 bg-slate-800"
                  />
                  <span>Premium-only content (subscribers only)</span>
                </label>
              </motion.div>
            )}

            {/* Submit */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={posting}
                className="flex-1 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white py-3 px-6 rounded-xl font-semibold transition-all disabled:opacity-50"
              >
                {posting ? "Publishing..." : "Publish Post"}
              </button>
            </div>
          </form>
        </motion.div>

        {/* Feed */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-4">Your Posts</h2>
            <FeedPanel user={user} headline="Post a new trade or tip" />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
