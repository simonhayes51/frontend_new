import { useState, useEffect, useMemo } from "react";
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
  const [editDraft, setEditDraft] = useState({});

  useEffect(() => {
    setPostState(post);
    setLiked(post.user_has_liked || false);
    setSaved(post.is_saved || false);
    setLikeCount(post.likes_count || post.likes || 0);
    setShareCount(post.shares_count || post.shares || 0);
    setCommentCount(post.comments_count || post.comments || 0);
    setViewCount(post.views_count || post.views || 0);
  }, [post]);

  useEffect(() => {
    let active = true;
    const trackView = async () => {
      try {
        const { data } = await viewPost(post.id);
        if (!active) return;
        const nextViews =
          data?.stats?.views ?? data?.views_count ?? data?.views ?? viewCount + 1;
        setViewCount(nextViews);
      } catch (error) {
        console.error("Failed to track view:", error);
      }
    };
    trackView();
    return () => {
      active = false;
    };
  }, [post.id]);

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

  const isLocked = postState.is_locked || (postState.visibility === 'premium' && !postState.can_view);
  const isArticle = postState.post_type === 'analysis';
  const contentPreviewLength = 200;
  const shouldTruncate = isArticle && postState.content && postState.content.length > contentPreviewLength;
  
  // Extract trade info if available
  const trade = (postState.post_type === 'quick_flip' || postState.post_type === 'prediction') ? {
    type: postState.post_type === 'quick_flip' ? 'buy' : 'sell',
    player: postState.player_name || postState.player?.name || extractPlayerName(postState.content),
    buyPrice: getTradeBuyPrice(postState),
    sellPrice: getTradeSellPrice(postState),
    image:
      postState.player?.image_url ||
      postState.player?.image ||
      postState.player_image_url ||
      postState.card_image_url ||
      postState.player?.card_image_url ||
      null,
    result: buildTradeResult(postState),
  } : null;

  function extractPlayerName(content) {
    if (!content) return 'Player';
    const match = content.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
    return match ? match[0] : 'Player';
  }

  function getTradeBuyPrice(postData) {
    return {
      min: postData.buy_range_min ?? postData.buy_price ?? 0,
      max: postData.buy_range_max ?? postData.buy_price ?? 0,
    };
  }

  function getTradeSellPrice(postData) {
    return postData.sell_target ?? postData.sell_price ?? 0;
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

  function formatTradeNumber(value) {
    const number = Number(value);
    if (!number) return "TBD";
    return number.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }

  function buildTradeResult(postData) {
    if (postData.profit !== undefined && postData.profit !== null) {
      return {
        profit: Number(postData.profit),
        percentage: Number(postData.profit_percentage) || 0,
      };
    }
    const buyValue = Number(
      postData.buy_range_min ?? postData.buy_range_max ?? postData.buy_price ?? 0
    );
    const sellValue = Number(postData.sell_target ?? postData.sell_price ?? 0);
    if (!buyValue || !sellValue) return null;
    const profit = sellValue - buyValue - sellValue * 0.05;
    const percentage = buyValue ? (profit / buyValue) * 100 : 0;
    return { profit, percentage };
  }

  function parseTradeTimestamp(value) {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === "number" && value > 10_000_000_000) {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? null : date;
    }
    if (typeof value === "string") {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? null : date;
    }
    return null;
  }

  const buyTimestamp = parseTradeTimestamp(
    postState.buy_at || postState.buy_timestamp || postState.buy_time || postState.created_at || postState.timestamp
  );
  const sellTimestamp = parseTradeTimestamp(
    postState.sell_timestamp ||
      postState.sell_time ||
      postState.sold_at ||
      postState.closed_at ||
      postState.sell_at
  );
  const sellPrice = postState.sell_target ?? postState.sell_price ?? null;

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

  const tagsLabel = useMemo(() => {
    const tags = postState.tags || [];
    if (!Array.isArray(tags)) return "";
    return tags.join(", ");
  }, [postState.tags]);

  const openEditModal = () => {
    setEditDraft({
      title: postState.title || "",
      content: postState.content || "",
      post_type: postState.post_type || "tip",
      player_name: postState.player_name || "",
      player_card_id: postState.player_card_id || "",
      buy_price: postState.buy_range_min ?? postState.buy_price ?? "",
      sell_target: postState.sell_target ?? "",
      sell_at: postState.sell_at ?? "",
      confidence_level: postState.confidence_level ?? "",
      tags: tagsLabel,
      image_url: postState.image_url || "",
      premium: postState.premium ?? postState.is_premium ?? false,
      expires_in_hours: postState.expires_in_hours ?? "",
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    try {
      const toNumberOrString = (value) => {
        if (value === "" || value === null || value === undefined) return undefined;
        const asNumber = Number(value);
        return Number.isNaN(asNumber) ? value : asNumber;
      };
      const buyPrice = editDraft.buy_price;
      const sellTarget = editDraft.sell_target;
      const sellAt = editDraft.sell_at;
      const hasSellSignal = Boolean(sellTarget || sellAt);
      const payload = {
        title: editDraft.title || undefined,
        content: editDraft.content,
        post_type: hasSellSignal ? "prediction" : editDraft.post_type,
        player_name: editDraft.player_name || undefined,
        player_card_id: editDraft.player_card_id || undefined,
        buy_range_min: toNumberOrString(buyPrice),
        buy_range_max: toNumberOrString(buyPrice),
        sell_target: toNumberOrString(sellTarget),
        sell_at: toNumberOrString(sellAt),
        confidence_level:
          editDraft.confidence_level === "" ? undefined : Number(editDraft.confidence_level),
        tags: editDraft.tags
          ? editDraft.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
          : undefined,
        image_url: editDraft.image_url || undefined,
        premium: !!editDraft.premium,
        expires_in_hours:
          editDraft.expires_in_hours === ""
            ? undefined
            : Number(editDraft.expires_in_hours),
      };
      const { data } = await updatePost(postState.id, payload);
      const nextPost = data?.post || data;
      if (nextPost) {
        setPostState((prev) => ({ ...prev, ...nextPost }));
      }
      setShowEditModal(false);
      if (hasSellSignal && nextPost) {
        onUpdate?.(nextPost);
      } else {
        onUpdate?.();
      }
      toast.success("Post updated");
    } catch (error) {
      console.error("Failed to update post:", error);
      toast.error("Failed to update post");
    }
  };

  const toggleComments = async () => {
    if (showComments) {
      setShowComments(false);
      return;
    }
    setShowComments(true);
    if (comments.length) return;
    setCommentsLoading(true);
    try {
      const { data } = await getPostComments(postState.id);
      const items = Array.isArray(data)
        ? data
        : data?.comments || data?.items || data?.results || [];
      setComments(items);
    } catch (error) {
      console.error("Failed to load comments:", error);
      toast.error("Failed to load comments");
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentDraft.trim()) {
      toast.error("Write a comment first");
      return;
    }
    try {
      const { data } = await addPostComment(postState.id, { content: commentDraft.trim() });
      const newComment = data?.comment || data;
      if (newComment) {
        setComments((prev) => [newComment, ...prev]);
        setCommentCount((prev) => prev + 1);
      }
      setCommentDraft("");
    } catch (error) {
      console.error("Failed to add comment:", error);
      toast.error("Failed to add comment");
    }
  };

  const handleShare = async () => {
    try {
      const { data } = await sharePost(postState.id);
      const nextShares =
        data?.stats?.shares ?? data?.shares_count ?? data?.shares ?? shareCount + 1;
      setShareCount(nextShares);
      toast.success("Post shared");
    } catch (error) {
      console.error("Failed to share post:", error);
      toast.error("Failed to share post");
    }
  };

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
                <div className="text-base text-muted-foreground space-y-1">
                  <p>
                    Buy @ {formatTradePrice(trade.buyPrice)} coins
                    {buyTimestamp && (
                      <span className="ml-2 text-xs text-muted-foreground/80">
                        {formatTime(buyTimestamp)}
                      </span>
                    )}
                  </p>
                  <p>
                    Sell @ {formatTradeNumber(trade.sellPrice || sellPrice)} coins
                    {sellTimestamp && (
                      <span className="ml-2 text-xs text-muted-foreground/80">
                        {formatTime(sellTimestamp)}
                      </span>
                    )}
                  </p>
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
