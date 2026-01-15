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
  X,
} from "lucide-react";
import { GradientButton } from "../ui/GradientButton";
import {
  addPostComment,
  getPostComments,
  reactToPost,
  savePost,
  sharePost,
  unsavePost,
  updatePost,
  viewPost,
} from "../../api/social";
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
  const buildEditDraft = (source) => ({
    title: source?.title || "",
    content: source?.content || "",
    post_type: source?.post_type || "tip",
    player_name: source?.player_name || "",
    buy_price:
      source?.buy_price ??
      source?.buy_range_min ??
      "",
    sell_target: source?.sell_target ?? "",
    confidence_level: source?.confidence_level ?? "",
    tags: Array.isArray(source?.tags) ? source.tags.join(", ") : source?.tags || "",
    image_url: source?.image_url || "",
    expires_in_hours: source?.expires_in_hours ?? "",
    premium: source?.premium ?? source?.visibility === "premium",
  });

  const [postState, setPostState] = useState(post);
  const [liked, setLiked] = useState(post.user_has_liked || false);
  const [saved, setSaved] = useState(post.is_saved || false);
  const [likeCount, setLikeCount] = useState(post.likes_count || post.likes || 0);
  const [shareCount, setShareCount] = useState(post.shares_count || post.shares || 0);
  const [commentCount, setCommentCount] = useState(post.comments_count || post.comments || 0);
  const [viewCount, setViewCount] = useState(post.views_count || post.views || 0);
  const [expanded, setExpanded] = useState(false);
  const [tradeImage, setTradeImage] = useState(null);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editDraft, setEditDraft] = useState(() => buildEditDraft(post));

  useEffect(() => {
    setPostState(post);
    setLiked(post.user_has_liked || false);
    setSaved(post.is_saved || false);
    setLikeCount(post.likes_count || post.likes || 0);
    setShareCount(post.shares_count || post.shares || 0);
    setCommentCount(post.comments_count || post.comments || 0);
    setViewCount(post.views_count || post.views || 0);
    if (!showEditModal) {
      setEditDraft(buildEditDraft(post));
    }
  }, [post, showEditModal]);

  const handleLike = async () => {
    try {
      const { data } = await reactToPost(postState.id, "like");
      const nextLiked = data?.removed === undefined ? !liked : !data.removed;
      const nextCount =
        data?.stats?.likes ?? data?.likes_count ?? (nextLiked ? likeCount + 1 : likeCount - 1);
      setLiked(nextLiked);
      setLikeCount(Math.max(0, nextCount));
    } catch (error) {
      console.error("Failed to like post:", error);
      toast.error("Failed to like post");
    }
  };

  const handleSave = async () => {
    try {
      if (saved) {
        await unsavePost(postState.id);
      } else {
        await savePost(postState.id);
      }
      setSaved(!saved);
      toast.success(saved ? "Post unsaved" : "Post saved!");
    } catch (error) {
      console.error("Failed to save post:", error);
      toast.error("Failed to save post");
    }
  };

  const handleShare = async () => {
    try {
      const { data } = await sharePost(postState.id);
      const nextCount = data?.stats?.shares ?? data?.shares_count ?? shareCount + 1;
      setShareCount(Math.max(0, nextCount));
      if (navigator?.share) {
        await navigator.share({
          title: postState.title || "Check out this post",
          text: postState.content?.slice(0, 120),
          url: window.location.href,
        });
      } else if (navigator?.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard");
      } else {
        toast.success("Post shared");
      }
    } catch (error) {
      console.error("Failed to share post:", error);
      toast.error("Failed to share post");
    }
  };

  const toggleComments = async () => {
    const nextShow = !showComments;
    setShowComments(nextShow);
    if (!nextShow || commentsLoading || comments.length) return;
    setCommentsLoading(true);
    try {
      const { data } = await getPostComments(postState.id);
      const nextComments = data?.comments || data?.results || data || [];
      setComments(Array.isArray(nextComments) ? nextComments : []);
    } catch (error) {
      console.error("Failed to load comments:", error);
      toast.error("Failed to load comments");
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleAddComment = async () => {
    const trimmed = commentDraft.trim();
    if (!trimmed) return;
    try {
      const { data } = await addPostComment(postState.id, { content: trimmed });
      const newComment = data?.comment || data;
      if (newComment) {
        setComments((prev) => [newComment, ...prev]);
      }
      setCommentCount((prev) => prev + 1);
      setCommentDraft("");
    } catch (error) {
      console.error("Failed to add comment:", error);
      toast.error("Failed to add comment");
    }
  };

  const openEditModal = () => {
    setEditDraft(buildEditDraft(postState));
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    try {
      const tags = editDraft.tags
        ? editDraft.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
        : [];
      const payload = {
        title: editDraft.title || undefined,
        content: editDraft.content,
        post_type: editDraft.post_type || postState.post_type,
        image_url: editDraft.image_url || undefined,
        expires_in_hours: editDraft.expires_in_hours
          ? parseInt(editDraft.expires_in_hours, 10)
          : undefined,
        tags,
        is_premium: !!editDraft.premium,
      };

      if (payload.post_type === "quick_flip" || payload.post_type === "prediction") {
        if (editDraft.player_name) {
          payload.player_name = editDraft.player_name;
        }

        if (editDraft.buy_price !== "") {
          const buy = Number(editDraft.buy_price);
          if (!Number.isNaN(buy) && buy > 0) {
            payload.buy_range_min = buy;
            payload.buy_range_max = buy;
          }
        }

        if (editDraft.sell_target !== "") {
          const sell = Number(editDraft.sell_target);
          if (!Number.isNaN(sell) && sell > 0) {
            payload.sell_target = sell;
          }
        }

        if (editDraft.confidence_level !== "") {
          const conf = Number(editDraft.confidence_level);
          if (!Number.isNaN(conf)) {
            payload.confidence_level = conf;
          }
        }
      }

      const { data } = await updatePost(postState.id, payload);
      const updated = data?.post || data || payload;
      setPostState((prev) => ({ ...prev, ...updated }));
      onUpdate?.(updated);
      toast.success("Post updated");
      setShowEditModal(false);
    } catch (error) {
      console.error("Failed to update post:", error);
      toast.error("Failed to update post");
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
  const author = postState.author || postState.trader || {};
  const trader = {
    name: author.username || author.name || 'Anonymous',
    username: author.username || 'anonymous',
    avatar: author.avatar_url || author.avatar || `https://i.pravatar.cc/150?u=${postState.id}`,
    verified: author.verified || false,
    tier: (author.tier || 'Free').charAt(0).toUpperCase() + (author.tier || 'free').slice(1),
  };

  const isLocked = postState.is_locked || (postState.visibility === "premium" && !postState.can_view);
  const isArticle = postState.post_type === "analysis";
  const contentPreviewLength = 200;
  const shouldTruncate = isArticle && postState.content && postState.content.length > contentPreviewLength;
  
  // Extract trade info if available
  const trade =
    postState.post_type === "quick_flip" || postState.post_type === "prediction"
      ? {
          type: postState.post_type === "quick_flip" ? "buy" : "sell",
          player:
            postState.player_name ||
            postState.player?.name ||
            extractPlayerName(postState.content),
          buyPrice: getBuyPrice(postState),
          sellPrice: getSellPrice(postState),
          image:
            postState.player?.image_url ||
            postState.player?.image ||
            postState.player_image_url ||
            postState.card_image_url ||
            postState.player?.card_image_url ||
            null,
          result: postState.profit
            ? {
                profit: postState.profit,
                percentage: postState.profit_percentage || 0,
              }
            : null,
          sellTimestamp: postState.sell_at || postState.closed_at || null,
        }
      : null;

  const netProfit =
    trade && trade.buyPrice && trade.sellPrice && !trade.result
      ? calculateNetProfit(trade.buyPrice, trade.sellPrice)
      : null;

  function extractPlayerName(content) {
    if (!content) return "Player";
    const match = content.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
    return match ? match[0] : "Player";
  }

  function getBuyPrice(postData) {
    const min =
      postData.buy_range_min ??
      postData.buy_price ??
      null;
    const max =
      postData.buy_range_max ??
      postData.buy_price ??
      null;
    if (min == null && max == null) return null;
    return { min, max };
  }

  function getSellPrice(postData) {
    const target =
      postData.sell_target ??
      postData.sell_price ??
      null;
    if (target == null) return null;
    return { min: target, max: target };
  }

  function hasPrice(price) {
    if (!price) return false;
    const min = Number(price.min) || 0;
    const max = Number(price.max) || 0;
    return !!(min || max);
  }

  function formatTradePrice(price) {
    const min = Number(price.min) || 0;
    const max = Number(price.max) || 0;
    if (!min && !max) return "TBD";
    if (min && max && min !== max) {
      return `${min.toLocaleString()} - ${max.toLocaleString()}`;
    }
    return (max || min).toLocaleString();
  }

  function calculateNetProfit(buyPrice, sellPrice) {
    if (!buyPrice || !sellPrice) return null;
    const buy =
      Number(buyPrice.max ?? buyPrice.min ?? 0) || 0;
    const sell =
      Number(sellPrice.min ?? sellPrice.max ?? 0) || 0;
    if (!buy || !sell) return null;
    const gross = sell - buy;
    const tax = gross * 0.05;
    const net = gross - tax;
    if (!Number.isFinite(net)) return null;
    return Math.round(net);
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

  useEffect(() => {
    let active = true;
    const registerView = async () => {
      try {
        const { data } = await viewPost(postState.id);
        const nextCount = data?.stats?.views ?? data?.views_count ?? data?.views;
        if (active && typeof nextCount === "number") {
          setViewCount(nextCount);
        }
      } catch (error) {
        console.error("Failed to record view:", error);
      }
    };
    if (postState?.id) {
      registerView();
    }
    return () => {
      active = false;
    };
  }, [postState?.id]);

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
          <button
            onClick={openEditModal}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        {isLocked ? (
          <div className="relative">
            <p className="text-muted-foreground blur-sm select-none">
              {postState.content.slice(0, 100)}...
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
                ? postState.content.slice(0, contentPreviewLength) + '...'
                : postState.content}
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
        <div className="mx-4 mb-4 rounded-2xl border border-border/50 bg-muted/30 px-5 py-5 shadow-[0_0_30px_rgba(0,0,0,0.15)]">
          <div
            className={`flex items-center justify-between gap-6 border-l-4 pl-4 ${
              trade.type === "buy" ? "border-success/60" : "border-destructive/60"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-28 w-20 rounded-xl border border-border/40 bg-black/30 p-2">
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
              <div className="min-w-0 space-y-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      trade.type === "buy"
                        ? "bg-success/15 text-success"
                        : "bg-destructive/15 text-destructive"
                    }`}
                  >
                    {trade.type === "buy" ? (
                      <TrendingUp className="w-3.5 h-3.5" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5" />
                    )}
                    {trade.type === "buy" ? "Buy" : "Sell"}
                  </span>
                  <p className="text-xl font-semibold text-foreground truncate">{trade.player}</p>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  {hasPrice(trade.buyPrice) && (
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-3.5 h-3.5 text-success" />
                      <span className="font-semibold text-success">
                        Buy @ {formatTradePrice(trade.buyPrice)} coins
                      </span>
                    </div>
                  )}
                  {hasPrice(trade.sellPrice) && (
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-3.5 h-3.5 text-destructive" />
                      <span className="font-semibold text-destructive">
                        Sell @ {formatTradePrice(trade.sellPrice)} coins
                      </span>
                      {trade.sellTimestamp && (
                        <span className="text-xs text-muted-foreground">
                          · {formatTime(trade.sellTimestamp)}
                        </span>
                      )}
                    </div>
                  )}
                  {typeof netProfit === "number" && (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-success">
                        Profit: {netProfit.toLocaleString()} coins
                      </span>
                    </div>
                  )}
                </div>
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
                  {trade.result.profit.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs">
                  {trade.result.percentage > 0 ? "+" : ""}
                  {trade.result.percentage.toFixed(2)}%
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Image */}
      {postState.image_url && !isLocked && (
        <div className="mx-4 mb-3 rounded-lg overflow-hidden">
          <img
            src={postState.image_url}
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

          <button
            onClick={toggleComments}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm font-medium">{commentCount}</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Share2 className="w-4 h-4" />
            <span className="text-sm font-medium">{shareCount}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Eye className="w-3 h-3" />
            <span>{viewCount.toLocaleString()}</span>
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

      {showComments && (
        <div className="border-t border-border px-4 py-3 space-y-3 bg-muted/20">
          {commentsLoading ? (
            <p className="text-sm text-muted-foreground">Loading comments...</p>
          ) : comments.length ? (
            <div className="space-y-2">
              {comments.map((comment) => (
                <div key={comment.id} className="rounded-lg bg-card border border-border/60 p-3">
                  <p className="text-xs text-muted-foreground mb-1">
                    {comment.author?.username || comment.username || "User"}
                  </p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{comment.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No comments yet.</p>
          )}
          <div className="flex items-center gap-2">
            <input
              value={commentDraft}
              onChange={(e) => setCommentDraft(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm"
            />
            <button
              onClick={handleAddComment}
              className="px-3 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg"
            >
              Post
            </button>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">Edit Post</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-muted rounded-lg"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <input
                value={editDraft.title}
                onChange={(e) => setEditDraft((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Title"
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
              />
              <textarea
                value={editDraft.content}
                onChange={(e) => setEditDraft((prev) => ({ ...prev, content: e.target.value }))}
                placeholder="Content"
                rows={4}
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={editDraft.post_type}
                  onChange={(e) => setEditDraft((prev) => ({ ...prev, post_type: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                >
                  <option value="tip">Tip</option>
                  <option value="analysis">Analysis</option>
                  <option value="quick_flip">Quick Flip</option>
                  <option value="prediction">Prediction</option>
                </select>
                <input
                  value={editDraft.player_name}
                  onChange={(e) =>
                    setEditDraft((prev) => ({ ...prev, player_name: e.target.value }))
                  }
                  placeholder="Player name"
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={editDraft.buy_price}
                  onChange={(e) =>
                    setEditDraft((prev) => ({ ...prev, buy_price: e.target.value }))
                  }
                  placeholder="Buy price"
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                />
                <input
                  value={editDraft.sell_target}
                  onChange={(e) =>
                    setEditDraft((prev) => ({ ...prev, sell_target: e.target.value }))
                  }
                  placeholder="Sell target"
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                />
                <input
                  value={editDraft.sell_at}
                  onChange={(e) =>
                    setEditDraft((prev) => ({ ...prev, sell_at: e.target.value }))
                  }
                  placeholder="Sell at (timestamp)"
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={editDraft.confidence_level}
                  onChange={(e) =>
                    setEditDraft((prev) => ({ ...prev, confidence_level: e.target.value }))
                  }
                  placeholder="Confidence level"
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                />
                <input
                  value={editDraft.tags}
                  onChange={(e) => setEditDraft((prev) => ({ ...prev, tags: e.target.value }))}
                  placeholder="Tags (comma separated)"
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={editDraft.image_url}
                  onChange={(e) =>
                    setEditDraft((prev) => ({ ...prev, image_url: e.target.value }))
                  }
                  placeholder="Image URL"
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                />
                <input
                  value={editDraft.expires_in_hours}
                  onChange={(e) =>
                    setEditDraft((prev) => ({ ...prev, expires_in_hours: e.target.value }))
                  }
                  placeholder="Expires in hours"
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={!!editDraft.premium}
                  onChange={(e) =>
                    setEditDraft((prev) => ({ ...prev, premium: e.target.checked }))
                  }
                />
                Premium
              </label>
            </div>
            <div className="flex items-center justify-end gap-2 p-4 border-t border-border">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <GradientButton onClick={handleEditSubmit}>Save changes</GradientButton>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
