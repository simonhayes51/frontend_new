import { useState, useEffect } from "react";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  Lock,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Eye,
} from "lucide-react";
import { GradientButton } from "../ui/GradientButton";
import { reactToPost, savePost, unsavePost } from "../../api/social";
import toast from "react-hot-toast";

const API_BASE = import.meta.env.VITE_API_URL || "";
const buildProxy = (url) => `${API_BASE}/img?url=${encodeURIComponent(url)}`;
const PLACEHOLDER = "/img/card-placeholder.png";

const normalizeForSearch = (value = "") =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

const searchPlayers = async (query) => {
  if (!query.trim()) return [];
  const qNorm = normalizeForSearch(query);
  try {
    const response = await fetch(
      `${API_BASE}/api/search-players?q=${encodeURIComponent(query)}&q_norm=${encodeURIComponent(qNorm)}`,
      { credentials: "include" }
    );
    if (!response.ok) return [];
    const data = await response.json();
    return data.players || [];
  } catch (error) {
    console.error("Search failed:", error);
    return [];
  }
};

export function PostCard({ post, onUpdate }) {
  const [liked, setLiked] = useState(post.user_has_liked || false);
  const [saved, setSaved] = useState(post.is_saved || false);
  const [likeCount, setLikeCount] = useState(post.likes_count || post.likes || 0);
  const [expanded, setExpanded] = useState(false);
  const [tradeImage, setTradeImage] = useState(null);

  const handleLike = async () => {
    try {
      await reactToPost(post.id, liked ? "unlike" : "like");
      setLiked(!liked);
      setLikeCount(prev => liked ? prev - 1 : prev + 1);
    } catch (error) {
      console.error("Failed to like post:", error);
      toast.error("Failed to like post");
    }
  };

  const handleSave = async () => {
    try {
      if (saved) {
        await unsavePost(post.id);
      } else {
        await savePost(post.id);
      }
      setSaved(!saved);
      toast.success(saved ? "Post unsaved" : "Post saved!");
    } catch (error) {
      console.error("Failed to save post:", error);
      toast.error("Failed to save post");
    }
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const postTime = new Date(timestamp);
    const diff = Math.floor((now - postTime) / 1000 / 60);
    
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  };

  // Map backend data to component structure
  const author = post.author || post.trader || {};
  const trader = {
    name: author.username || author.name || 'Anonymous',
    username: author.username || 'anonymous',
    avatar: author.avatar_url || author.avatar || `https://i.pravatar.cc/150?u=${post.id}`,
    verified: author.verified || false,
    tier: (author.tier || 'Free').charAt(0).toUpperCase() + (author.tier || 'free').slice(1),
  };

  const isLocked = post.is_locked || (post.visibility === 'premium' && !post.can_view);
  const isArticle = post.post_type === 'analysis';
  const contentPreviewLength = 200;
  const shouldTruncate = isArticle && post.content && post.content.length > contentPreviewLength;
  
  // Extract trade info if available
  const trade = (post.post_type === 'quick_flip' || post.post_type === 'prediction') ? {
    type: post.post_type === 'quick_flip' ? 'buy' : 'sell',
    player: post.player_name || post.player?.name || extractPlayerName(post.content),
    price: getTradePrice(post),
    image:
      post.player?.image_url ||
      post.player?.image ||
      post.player_image_url ||
      post.card_image_url ||
      post.player?.card_image_url ||
      null,
    result: post.profit ? {
      profit: post.profit,
      percentage: post.profit_percentage || 0,
    } : null,
  } : null;

  function extractPlayerName(content) {
    if (!content) return 'Player';
    const match = content.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
    return match ? match[0] : 'Player';
  }

  function getTradePrice(postData) {
    if (postData.post_type === 'quick_flip') {
      return {
        min: postData.buy_range_min ?? postData.buy_price ?? 0,
        max: postData.buy_range_max ?? postData.buy_price ?? 0,
      };
    }

    const target = postData.sell_target ?? postData.sell_price ?? 0;
    return { min: target, max: target };
  }

  function formatTradePrice(price) {
    const min = Number(price.min) || 0;
    const max = Number(price.max) || 0;
    if (!min && !max) return 'TBD';
    if (min && max && min !== max) {
      return `${min.toLocaleString()} - ${max.toLocaleString()}`;
    }
    return (max || min).toLocaleString();
  }

  useEffect(() => {
    let active = true;

    const loadTradeImage = async () => {
      setTradeImage(null);
      if (!trade || trade.image || !trade.player) return;
      const players = await searchPlayers(trade.player);
      if (!active) return;
      const match = players[0];
      setTradeImage(match?.image_url || match?.card_image_url || null);
    };

    loadTradeImage();
    return () => {
      active = false;
    };
  }, [trade?.player, trade?.image]);

  return (
    <article className="bg-card border border-border rounded-xl overflow-hidden transition-all duration-300 hover:border-border/80">
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={trader.avatar}
                alt={trader.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              {trader.verified && (
                <CheckCircle2 className="absolute -bottom-0.5 -right-0.5 w-4 h-4 text-primary fill-primary-foreground" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">{trader.name}</span>
                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                  {trader.tier}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>@{trader.username}</span>
                <span>•</span>
                <span>{formatTime(post.created_at || post.timestamp)}</span>
              </div>
            </div>
          </div>
          <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        {isLocked ? (
          <div className="relative">
            <p className="text-muted-foreground blur-sm select-none">
              {post.content.slice(0, 100)}...
            </p>
            <div className="absolute inset-0 flex items-center justify-center bg-card/80 backdrop-blur-sm rounded-lg">
              <div className="text-center">
                <Lock className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-2">Subscribe to unlock</p>
                <GradientButton size="sm">Subscribe</GradientButton>
              </div>
            </div>
          </div>
        ) : (
          <>
            <p className="text-foreground leading-relaxed whitespace-pre-line">
              {shouldTruncate && !expanded 
                ? post.content.slice(0, contentPreviewLength) + '...' 
                : post.content}
            </p>
            {shouldTruncate && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="mt-2 text-primary hover:underline text-sm font-medium"
              >
                {expanded ? 'Show less' : 'Read more'}
              </button>
            )}
          </>
        )}
      </div>

      {/* Trade Signal */}
      {trade && !isLocked && (
        <div className="mx-4 mb-4 rounded-2xl border border-border/50 bg-muted/20 px-4 py-4">
          <div
            className={`flex items-center justify-between gap-5 border-l-4 pl-4 ${
              trade.type === "buy" ? "border-success/60" : "border-destructive/60"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-24 w-16 rounded-lg border border-border/40 bg-black/20 p-1">
                <img
                  src={tradeImage || trade.image || PLACEHOLDER}
                  alt={trade.player}
                  className="h-full w-full object-contain"
                  onError={(e) => {
                    const img = e.currentTarget;
                    const targetImage = tradeImage || trade.image;
                    if (!img.dataset.triedProxy && targetImage) {
                      img.dataset.triedProxy = "1";
                      img.src = buildProxy(targetImage);
                    } else {
                      img.src = PLACEHOLDER;
                    }
                  }}
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {trade.type === "buy" ? (
                    <TrendingUp className="w-5 h-5 text-success" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-destructive" />
                  )}
                  <p className="text-lg font-semibold text-foreground truncate">{trade.player}</p>
                </div>
                <p className="text-base text-muted-foreground">
                  {trade.type === "buy" ? "Buy" : "Sell"} @ {formatTradePrice(trade.price)} coins
                </p>
              </div>
            </div>
            {trade.result && (
              <div
                className={`text-right px-3 py-1.5 rounded-lg ${
                  trade.result.profit > 0
                    ? "bg-success/10 text-success"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                <p className="font-bold">
                  {trade.result.profit > 0 ? "+" : ""}
                  {trade.result.profit.toLocaleString()}
                </p>
                <p className="text-xs">
                  {trade.result.percentage > 0 ? "+" : ""}
                  {trade.result.percentage}%
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Image */}
      {post.image_url && !isLocked && (
        <div className="mx-4 mb-3 rounded-lg overflow-hidden">
          <img
            src={post.image_url}
            alt="Post content"
            className="w-full h-auto object-cover"
          />
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              liked ? "text-secondary bg-secondary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
            <span className="text-sm font-medium">{likeCount}</span>
          </button>

          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm font-medium">{post.comments_count || post.comments || 0}</span>
          </button>

          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <Share2 className="w-4 h-4" />
            <span className="text-sm font-medium">{post.shares_count || post.shares || 0}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Eye className="w-3 h-3" />
            <span>{(post.views_count || post.views || 0).toLocaleString()}</span>
          </div>
          <button
            onClick={handleSave}
            className={`p-1.5 rounded-lg transition-colors ${
              saved ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Bookmark className={`w-4 h-4 ${saved ? "fill-current" : ""}`} />
          </button>
        </div>
      </div>
    </article>
  );
}
