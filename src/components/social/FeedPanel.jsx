import React, { useEffect, useState } from "react";
import {
  Heart,
  MessageCircle,
  ShieldCheck,
  ThumbsDown,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  addPostComment,
  createPost,
  getFeed,
  getPostComments,
  reactToComment,
  reactToPost,
  upgradeToTrader,
} from "../../api/social";

const POST_TYPES = [
  { value: "status", label: "Status" },
  { value: "quick_flip", label: "Quick Flip" },
  { value: "prediction", label: "Prediction" },
  { value: "tip", label: "Tip" },
  { value: "analysis", label: "Analysis" },
];

const formatDate = (value) => {
  if (!value) return "Just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";
  return date.toLocaleString();
};

const getPostStats = (post) => {
  const stats = post?.stats || {};
  return {
    likes: stats.likes ?? post?.likes ?? post?.likes_count ?? 0,
    dislikes: stats.dislikes ?? post?.dislikes ?? post?.dislikes_count ?? 0,
    comments: stats.comments ?? post?.comments_count ?? post?.comment_count ?? 0,
  };
};

const isTraderAccount = (user) =>
  user?.account_type === "trader" || user?.role === "trader" || user?.is_trader;

const FeedPanel = ({ user, headline = "Share a trading update" }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [composer, setComposer] = useState({
    title: "",
    content: "",
    post_type: "tip",
    premium: false,
    expires_in_hours: "",
  });
  const [commentDrafts, setCommentDrafts] = useState({});
  const [commentsByPost, setCommentsByPost] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userReactions, setUserReactions] = useState({});

  const isTrader = isTraderAccount(user);

  const loadFeed = async () => {
    setLoading(true);
    try {
      const { data } = await getFeed({
        type: filterType !== "all" ? filterType : undefined,
      });
      const items = Array.isArray(data)
        ? data
        : data?.posts || data?.items || data?.results || [];
      setPosts(items);
      
      const reactions = {};
      items.forEach((post) => {
        if (post.user_reaction) {
          reactions[post.id] = post.user_reaction;
        }
      });
      setUserReactions(reactions);
    } catch (error) {
      toast.error(error.userMessage || "Failed to load feed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeed();
  }, [filterType]);

  const handleCreatePost = async (event) => {
    event.preventDefault();
    if (!composer.content.trim()) {
      toast.error("Add some details to your post first");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: composer.title || undefined,
        content: composer.content,
        post_type: composer.post_type,
        premium: isTrader ? composer.premium : false,
        expires_in_hours:
          isTrader && composer.expires_in_hours
            ? Number(composer.expires_in_hours)
            : undefined,
      };
      const { data } = await createPost(payload);
      const newPost = data?.post || data;
      if (newPost) {
        setPosts((prev) => [newPost, ...prev]);
      } else {
        await loadFeed();
      }
      setComposer({
        title: "",
        content: "",
        post_type: "tip",
        premium: false,
        expires_in_hours: "",
      });
      toast.success("Post published");
    } catch (error) {
      toast.error(error.userMessage || "Failed to publish post");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updatePostStats = (postId, nextStats) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              stats: {
                ...post.stats,
                ...nextStats,
              },
            }
          : post
      )
    );
  };

  const handleReaction = async (postId, reaction) => {
    const currentReaction = userReactions[postId];
    
    try {
      const { data } = await reactToPost(postId, reaction);
      
      const removed = data?.removed ?? currentReaction === reaction;
      setUserReactions((prev) => {
        if (removed) {
          const next = { ...prev };
          delete next[postId];
          return next;
        }
        return { ...prev, [postId]: reaction };
      });
      
      const stats = data?.stats || data?.post?.stats;
      if (stats) {
        updatePostStats(postId, stats);
      } else {
        const current = posts.find((post) => post.id === postId);
        const currentStats = getPostStats(current || {});
        if (reaction === "like") {
          const delta = removed ? -1 : 1;
          updatePostStats(postId, { likes: Math.max(0, currentStats.likes + delta) });
        } else if (reaction === "dislike") {
          const delta = removed ? -1 : 1;
          updatePostStats(postId, { dislikes: Math.max(0, currentStats.dislikes + delta) });
        } else {
          await loadFeed();
        }
      }
      
    } catch (error) {
      toast.error(error.userMessage || "Failed to update reaction");
    }
  };

  const toggleComments = async (postId) => {
    const current = commentsByPost[postId];
    if (current?.open) {
      setCommentsByPost((prev) => ({
        ...prev,
        [postId]: { ...prev[postId], open: false },
      }));
      return;
    }

    setCommentsByPost((prev) => ({
      ...prev,
      [postId]: { ...prev[postId], open: true, loading: true },
    }));

    try {
      const { data } = await getPostComments(postId);
      const items = Array.isArray(data)
        ? data
        : data?.comments || data?.items || data?.results || [];
      setCommentsByPost((prev) => ({
        ...prev,
        [postId]: { items, open: true, loading: false },
      }));
    } catch (error) {
      setCommentsByPost((prev) => ({
        ...prev,
        [postId]: { ...prev[postId], loading: false },
      }));
      toast.error(error.userMessage || "Failed to load comments");
    }
  };

  const handleAddComment = async (postId) => {
    const content = commentDrafts[postId]?.trim();
    if (!content) {
      toast.error("Write a comment first");
      return;
    }

    try {
      const { data } = await addPostComment(postId, { content });
      const newComment = data?.comment || data;
      setCommentsByPost((prev) => {
        const existing = prev[postId]?.items || [];
        return {
          ...prev,
          [postId]: {
            ...prev[postId],
            items: newComment ? [newComment, ...existing] : existing,
            open: true,
            loading: false,
          },
        };
      });
      setCommentDrafts((prev) => ({ ...prev, [postId]: "" }));
      const current = posts.find((post) => post.id === postId);
      const { comments } = getPostStats(current || {});
      updatePostStats(postId, { comments: comments + 1 });
    } catch (error) {
      toast.error(error.userMessage || "Failed to add comment");
    }
  };

  const handleCommentLike = async (postId, commentId) => {
    try {
      const { data } = await reactToComment(commentId);
      const likesCount = data?.likes_count ?? 0;
      const removed = data?.removed ?? false;
      
      setCommentsByPost((prev) => ({
        ...prev,
        [postId]: {
          ...prev[postId],
          items: prev[postId]?.items?.map((comment) =>
            comment.id === commentId 
              ? { ...comment, likes: likesCount, likes_count: likesCount, user_has_liked: !removed } 
              : comment
          ),
        },
      }));
    } catch (error) {
      toast.error(error.userMessage || "Failed to like comment");
    }
  };

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleCreatePost}
        className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">{headline}</h3>
            <p className="text-sm text-slate-400">
              {isTrader
                ? "Premium content and time-sensitive tips can be gated for subscribers."
                : "Post trade ideas or questions for the community."}
            </p>
          </div>
          {isTrader ? (
            <span className="text-xs uppercase tracking-[0.2em] text-purple-300">Trader</span>
          ) : (
            <button
              type="button"
              onClick={async () => {
                try {
                  await upgradeToTrader({});
                  toast.success("Trader role request submitted");
                } catch (error) {
                  toast.error(error.userMessage || "Failed to request trader role");
                }
              }}
              className="bg-gradient-to-r from-emerald-500 to-green-500 text-black font-semibold px-4 py-2 rounded-xl"
            >
              Request Trader Role
            </button>
          )}
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <input
            type="text"
            value={composer.title}
            onChange={(event) => setComposer((prev) => ({ ...prev, title: event.target.value }))}
            placeholder="Headline (optional)"
            className="w-full rounded-xl bg-slate-950/80 border border-white/10 px-4 py-2 text-sm"
          />
          <select
            value={composer.post_type}
            onChange={(event) =>
              setComposer((prev) => ({ ...prev, post_type: event.target.value }))
            }
            className="w-full rounded-xl bg-slate-950/80 border border-white/10 px-4 py-2 text-sm"
          >
            {POST_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
        <textarea
          value={composer.content}
          onChange={(event) => setComposer((prev) => ({ ...prev, content: event.target.value }))}
          placeholder="Share the trade setup, timing, and reasoning..."
          rows={4}
          className="w-full rounded-xl bg-slate-950/80 border border-white/10 px-4 py-3 text-sm"
        />
        <div className="flex flex-wrap items-center gap-4">
          {isTrader && (
            <>
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={composer.premium}
                  onChange={(event) =>
                    setComposer((prev) => ({ ...prev, premium: event.target.checked }))
                  }
                  className="rounded border-white/20"
                />
                Premium-only
              </label>
              <input
                type="number"
                min="1"
                value={composer.expires_in_hours}
                onChange={(event) =>
                  setComposer((prev) => ({ ...prev, expires_in_hours: event.target.value }))
                }
                placeholder="Expires in (hours)"
                className="w-40 rounded-xl bg-slate-950/80 border border-white/10 px-3 py-2 text-sm"
              />
            </>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="ml-auto bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold px-4 py-2 rounded-xl"
          >
            {isSubmitting ? "Publishing..." : "Publish"}
          </button>
        </div>
      </form>

      <div className="flex flex-wrap gap-2">
        {[{ value: "all", label: "All" }, ...POST_TYPES].map((type) => (
          <button
            key={type.value}
            type="button"
            onClick={() => setFilterType(type.value)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              filterType === type.value
                ? "bg-purple-600 text-white"
                : "bg-slate-800/60 text-slate-300 hover:text-white"
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400">
          <div className="w-10 h-10 border-2 border-purple-400/40 border-t-purple-400 rounded-full animate-spin mx-auto mb-4" />
          Loading feed...
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-10 text-center text-slate-400">
          No posts yet. Follow traders or post your first analysis.
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => {
            const stats = getPostStats(post);
            const commentsState = commentsByPost[post.id];
            return (
              <div
                key={post.id}
                className="bg-slate-950/70 border border-white/10 rounded-2xl p-6 space-y-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        {post.author?.username || post.username || "Trader"}
                      </span>
                      {post.author?.is_verified && (
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      )}
                      {post.is_premium && (
                        <span className="text-[10px] uppercase tracking-[0.2em] bg-yellow-400/20 text-yellow-300 px-2 py-1 rounded-full">
                          Premium
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500">{formatDate(post.created_at)}</p>
                  </div>
                  <span className="text-xs uppercase tracking-[0.2em] text-purple-300">
                    {POST_TYPES.find((type) => type.value === post.post_type)?.label ||
                      post.post_type ||
                      "Update"}
                  </span>
                </div>

                {post.title && <h4 className="text-lg font-semibold">{post.title}</h4>}
                <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                  {post.content}
                </p>
                {post.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-slate-800/80 text-slate-300 px-2 py-1 rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300">
                  <button
                    type="button"
                    onClick={() => handleReaction(post.id, "like")}
                    className={`flex items-center gap-1 transition-colors ${
                      userReactions[post.id] === "like"
                        ? "text-red-400 hover:text-red-300"
                        : "hover:text-white"
                    }`}
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        userReactions[post.id] === "like" ? "fill-current" : ""
                      }`}
                    />{" "}
                    {stats.likes}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReaction(post.id, "dislike")}
                    className={`flex items-center gap-1 transition-colors ${
                      userReactions[post.id] === "dislike"
                        ? "text-purple-400 hover:text-purple-300"
                        : "hover:text-white"
                    }`}
                  >
                    <ThumbsDown
                      className={`w-4 h-4 ${
                        userReactions[post.id] === "dislike" ? "fill-current" : ""
                      }`}
                    />{" "}
                    {stats.dislikes}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleComments(post.id)}
                    className="flex items-center gap-1 hover:text-white"
                  >
                    <MessageCircle className="w-4 h-4" /> {stats.comments} comments
                  </button>
                </div>

                {commentsState?.open && (
                  <div className="border-t border-white/10 pt-4 space-y-4">
                    {commentsState.loading ? (
                      <p className="text-sm text-slate-400">Loading comments...</p>
                    ) : commentsState.items?.length ? (
                      <div className="space-y-3">
                        {commentsState.items.map((comment) => (
                          <div key={comment.id} className="bg-slate-900/60 rounded-xl p-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="text-sm font-semibold">
                                    {comment.author?.username || comment.username || "User"}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {formatDate(comment.created_at)}
                                  </p>
                                </div>
                                <p className="text-sm text-slate-200 mt-1 whitespace-pre-wrap">
                                  {comment.content}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCommentLike(post.id, comment.id)}
                                className={`flex items-center gap-1 text-xs transition-colors ${
                                  comment.user_has_liked
                                    ? "text-blue-400 hover:text-blue-300"
                                    : "text-slate-400 hover:text-white"
                                }`}
                              >
                                <span className={comment.user_has_liked ? "font-semibold" : ""}>
                                  👍
                                </span>
                                <span>{comment.likes ?? comment.likes_count ?? 0}</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400">No comments yet.</p>
                    )}

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={commentDrafts[post.id] || ""}
                        onChange={(event) =>
                          setCommentDrafts((prev) => ({
                            ...prev,
                            [post.id]: event.target.value,
                          }))
                        }
                        placeholder="Add a comment"
                        className="flex-1 rounded-xl bg-slate-950/80 border border-white/10 px-3 py-2 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddComment(post.id)}
                        className="bg-purple-600 hover:bg-purple-500 text-white text-sm px-3 py-2 rounded-xl"
                      >
                        Post
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FeedPanel;
export { POST_TYPES, formatDate, getPostStats };
