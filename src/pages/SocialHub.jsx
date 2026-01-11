import React, { useEffect, useMemo, useState } from "react";
import {
  MessageSquare,
  Heart,
  ThumbsDown,
  MessageCircle,
  Send,
  Star,
  Users,
  ShieldCheck,
  Sparkles,
  Search,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import {
  addPostComment,
  createPost,
  getConversations,
  getConversationMessages,
  getFeed,
  getPostComments,
  getTopRatedTraders,
  getTraders,
  getTraderRatings,
  markConversationRead,
  rateTrader,
  reactToComment,
  reactToPost,
  searchMessageUsers,
  sendConversationMessage,
  startConversation,
  subscribeToTrader,
  unsubscribeFromTrader,
  upgradeToTrader,
} from "../api/social";

const POST_TYPES = [
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

const TabButton = ({ active, onClick, icon, label }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
      active
        ? "bg-gradient-to-r from-purple-600 to-indigo-500 text-white"
        : "bg-slate-900/50 text-slate-300 hover:text-white hover:bg-slate-800/60"
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const FeedPanel = ({ user }) => {
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
        premium: composer.premium,
        expires_in_hours: composer.expires_in_hours
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
    try {
      const { data } = await reactToPost(postId, reaction);
      const stats = data?.stats || data?.post?.stats;
      if (stats) {
        updatePostStats(postId, stats);
      } else {
        const current = posts.find((post) => post.id === postId);
        if (current) {
          const { likes, dislikes } = getPostStats(current);
          updatePostStats(postId, {
            likes: reaction === "like" ? likes + 1 : likes,
            dislikes: reaction === "dislike" ? dislikes + 1 : dislikes,
          });
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
      const next = data?.comment || data;
      if (!next) return;
      setCommentsByPost((prev) => ({
        ...prev,
        [postId]: {
          ...prev[postId],
          items: prev[postId]?.items?.map((comment) =>
            comment.id === commentId ? { ...comment, ...next } : comment
          ),
        },
      }));
    } catch (error) {
      toast.error(error.userMessage || "Failed to like comment");
    }
  };

  return (
    <div className="space-y-6">
      {isTrader ? (
        <form
          onSubmit={handleCreatePost}
          className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Share a trading update</h3>
              <p className="text-sm text-slate-400">
                Premium content and time-sensitive tips can be gated for subscribers.
              </p>
            </div>
            <span className="text-xs uppercase tracking-[0.2em] text-purple-300">Trader</span>
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
            <button
              type="submit"
              disabled={isSubmitting}
              className="ml-auto bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold px-4 py-2 rounded-xl"
            >
              {isSubmitting ? "Publishing..." : "Publish"}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">Become a verified trader</h3>
            <p className="text-sm text-slate-400">
              Upgrade your account to post market analysis, predictions, and premium tips.
            </p>
          </div>
          <button
            type="button"
            onClick={async () => {
              try {
                await upgradeToTrader({});
                toast.success("Trader profile submitted");
              } catch (error) {
                toast.error(error.userMessage || "Failed to upgrade account");
              }
            }}
            className="bg-gradient-to-r from-emerald-500 to-green-500 text-black font-semibold px-4 py-2 rounded-xl"
          >
            Upgrade to Trader
          </button>
        </div>
      )}

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
                    className="flex items-center gap-1 hover:text-white"
                  >
                    <Heart className="w-4 h-4" /> {stats.likes}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReaction(post.id, "dislike")}
                    className="flex items-center gap-1 hover:text-white"
                  >
                    <ThumbsDown className="w-4 h-4" /> {stats.dislikes}
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
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-semibold">
                                  {comment.author?.username || comment.username || "User"}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {formatDate(comment.created_at)}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCommentLike(post.id, comment.id)}
                                className="text-xs text-slate-300 hover:text-white"
                              >
                                👍 {comment.likes ?? comment.likes_count ?? 0}
                              </button>
                            </div>
                            <p className="text-sm text-slate-200 mt-2">
                              {comment.content}
                            </p>
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

const MessagesPanel = () => {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageDraft, setMessageDraft] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [userQuery, setUserQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const loadConversations = async () => {
    try {
      const { data } = await getConversations();
      const items = Array.isArray(data)
        ? data
        : data?.conversations || data?.items || data?.results || [];
      setConversations(items);
      if (!activeConversation && items.length > 0) {
        setActiveConversation(items[0]);
      }
    } catch (error) {
      toast.error(error.userMessage || "Failed to load conversations");
    }
  };

  const loadMessages = async (conversationId) => {
    setLoadingMessages(true);
    try {
      const { data } = await getConversationMessages(conversationId);
      const items = Array.isArray(data)
        ? data
        : data?.messages || data?.items || data?.results || [];
      setMessages(items);
      await markConversationRead(conversationId);
    } catch (error) {
      toast.error(error.userMessage || "Failed to load messages");
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (activeConversation?.id) {
      loadMessages(activeConversation.id);
    }
  }, [activeConversation?.id]);

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (!userQuery || userQuery.length < 2) {
        setSearchResults([]);
        return;
      }
      try {
        const { data } = await searchMessageUsers(userQuery);
        const items = Array.isArray(data)
          ? data
          : data?.users || data?.results || [];
        setSearchResults(items);
      } catch (error) {
        toast.error(error.userMessage || "Failed to search users");
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [userQuery]);

  const handleSend = async () => {
    if (!messageDraft.trim() || !activeConversation?.id) return;
    const payload = { content: messageDraft };
    setMessageDraft("");
    try {
      const { data } = await sendConversationMessage(activeConversation.id, payload);
      const message = data?.message || data;
      if (message) {
        setMessages((prev) => [...prev, message]);
      } else {
        await loadMessages(activeConversation.id);
      }
    } catch (error) {
      toast.error(error.userMessage || "Failed to send message");
    }
  };

  const startNewConversation = async (userId) => {
    try {
      const { data } = await startConversation({ recipient_id: userId });
      const conversation = data?.conversation || data;
      if (conversation) {
        setConversations((prev) => [conversation, ...prev]);
        setActiveConversation(conversation);
        setUserQuery("");
        setSearchResults([]);
      }
    } catch (error) {
      toast.error(error.userMessage || "Failed to start conversation");
    }
  };

  return (
    <div className="grid lg:grid-cols-[320px_1fr] gap-6">
      <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-4 space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Conversations</h3>
          <p className="text-xs text-slate-400">Start a direct message with any trader.</p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={userQuery}
            onChange={(event) => setUserQuery(event.target.value)}
            placeholder="Search users"
            className="w-full rounded-xl bg-slate-950/80 border border-white/10 pl-9 pr-3 py-2 text-sm"
          />
        </div>
        {searchResults.length > 0 && (
          <div className="space-y-2">
            {searchResults.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => startNewConversation(user.id)}
                className="w-full text-left bg-slate-800/60 hover:bg-slate-700/60 rounded-xl px-3 py-2 text-sm"
              >
                {user.username || user.display_name || "Trader"}
              </button>
            ))}
          </div>
        )}
        <div className="space-y-2 max-h-[420px] overflow-y-auto">
          {conversations.map((conversation) => {
            const isActive = conversation.id === activeConversation?.id;
            return (
              <button
                key={conversation.id}
                type="button"
                onClick={() => setActiveConversation(conversation)}
                className={`w-full text-left rounded-xl px-3 py-2 transition-all border ${
                  isActive
                    ? "bg-purple-600/20 border-purple-400/40"
                    : "bg-slate-950/40 border-white/5 hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">
                    {conversation.title ||
                      conversation.participant?.username ||
                      "Conversation"}
                  </span>
                  {conversation.unread_count > 0 && (
                    <span className="text-xs bg-purple-500 text-white px-2 py-0.5 rounded-full">
                      {conversation.unread_count}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 truncate">
                  {conversation.last_message?.content || "No messages yet"}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 flex flex-col">
        {activeConversation ? (
          <>
            <div className="border-b border-white/10 pb-4 mb-4">
              <h3 className="text-lg font-semibold">
                {activeConversation.title ||
                  activeConversation.participant?.username ||
                  "Conversation"}
              </h3>
              <p className="text-xs text-slate-400">Direct messages are private.</p>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto">
              {loadingMessages ? (
                <p className="text-sm text-slate-400">Loading messages...</p>
              ) : messages.length === 0 ? (
                <p className="text-sm text-slate-400">Start the conversation.</p>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                      message.is_sender
                        ? "ml-auto bg-purple-600/30 text-white"
                        : "bg-slate-800/70 text-slate-100"
                    }`}
                  >
                    <p>{message.content}</p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {formatDate(message.created_at)}
                    </p>
                  </div>
                ))
              )}
            </div>
            <div className="pt-4 flex gap-2">
              <input
                type="text"
                value={messageDraft}
                onChange={(event) => setMessageDraft(event.target.value)}
                placeholder="Type your message"
                className="flex-1 rounded-xl bg-slate-950/80 border border-white/10 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={handleSend}
                className="bg-purple-600 hover:bg-purple-500 text-white rounded-xl px-3 py-2"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="text-slate-400 text-center py-10">
            Select a conversation to view messages.
          </div>
        )}
      </div>
    </div>
  );
};

const TradersPanel = () => {
  const [traders, setTraders] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [query, setQuery] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [loading, setLoading] = useState(false);
  const [ratingsByTrader, setRatingsByTrader] = useState({});
  const [ratingDrafts, setRatingDrafts] = useState({});

  const loadTraders = async () => {
    setLoading(true);
    try {
      const { data } = await getTraders({
        q: query || undefined,
        specialty: specialty || undefined,
      });
      const items = Array.isArray(data)
        ? data
        : data?.traders || data?.items || data?.results || [];
      setTraders(items);
    } catch (error) {
      toast.error(error.userMessage || "Failed to load traders");
    } finally {
      setLoading(false);
    }
  };

  const loadTopRated = async () => {
    try {
      const { data } = await getTopRatedTraders();
      const items = Array.isArray(data)
        ? data
        : data?.traders || data?.items || data?.results || [];
      setTopRated(items.slice(0, 3));
    } catch (error) {
      toast.error(error.userMessage || "Failed to load top rated traders");
    }
  };

  useEffect(() => {
    loadTraders();
  }, [query, specialty]);

  useEffect(() => {
    loadTopRated();
  }, []);

  const fetchRatings = async (traderId) => {
    try {
      const { data } = await getTraderRatings(traderId);
      setRatingsByTrader((prev) => ({
        ...prev,
        [traderId]: data,
      }));
    } catch (error) {
      toast.error(error.userMessage || "Failed to load ratings");
    }
  };

  const toggleFollow = async (trader) => {
    try {
      if (trader.is_following || trader.is_subscribed) {
        await unsubscribeFromTrader(trader.id);
        setTraders((prev) =>
          prev.map((item) =>
            item.id === trader.id ? { ...item, is_following: false, is_subscribed: false } : item
          )
        );
      } else {
        await subscribeToTrader(trader.id);
        setTraders((prev) =>
          prev.map((item) =>
            item.id === trader.id ? { ...item, is_following: true } : item
          )
        );
      }
    } catch (error) {
      toast.error(error.userMessage || "Failed to update subscription");
    }
  };

  const submitRating = async (traderId) => {
    const draft = ratingDrafts[traderId];
    if (!draft?.rating) {
      toast.error("Select a rating first");
      return;
    }
    try {
      await rateTrader(traderId, { rating: draft.rating, review: draft.review || "" });
      toast.success("Rating submitted");
      setRatingDrafts((prev) => ({
        ...prev,
        [traderId]: { rating: 0, review: "" },
      }));
      fetchRatings(traderId);
    } catch (error) {
      toast.error(error.userMessage || "Failed to submit rating");
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        {topRated.map((trader) => (
          <div
            key={trader.id}
            className="bg-gradient-to-r from-purple-900/40 to-indigo-900/20 border border-purple-500/20 rounded-2xl p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Top Rated</p>
                <h3 className="text-lg font-semibold">
                  {trader.username || trader.display_name || "Trader"}
                </h3>
              </div>
              <Star className="w-6 h-6 text-yellow-400" />
            </div>
            <p className="text-sm text-slate-300 mt-2">
              {Number(trader.rating_avg || trader.average_rating || 0).toFixed(1)} ★ •{" "}
              {trader.rating_count || trader.review_count || 0} reviews
            </p>
          </div>
        ))}
      </div>

      <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search traders"
            className="w-full rounded-xl bg-slate-950/80 border border-white/10 pl-9 pr-3 py-2 text-sm"
          />
        </div>
        <input
          type="text"
          value={specialty}
          onChange={(event) => setSpecialty(event.target.value)}
          placeholder="Filter by specialty"
          className="w-full md:w-60 rounded-xl bg-slate-950/80 border border-white/10 px-3 py-2 text-sm"
        />
      </div>

      {loading ? (
        <div className="text-center py-10 text-slate-400">Loading traders...</div>
      ) : (
        <div className="space-y-4">
          {traders.map((trader) => {
            const ratings = ratingsByTrader[trader.id];
            const draft = ratingDrafts[trader.id] || { rating: 0, review: "" };
            return (
              <div
                key={trader.id}
                className="bg-slate-950/70 border border-white/10 rounded-2xl p-6 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">
                        {trader.username || trader.display_name || "Trader"}
                      </h3>
                      {trader.is_verified && (
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      )}
                      {trader.specialties?.length > 0 && (
                        <span className="text-xs bg-slate-800/70 text-slate-300 px-2 py-1 rounded-full">
                          {trader.specialties[0]}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-400">
                      {Number(trader.rating_avg || trader.average_rating || 0).toFixed(1)} ★ •{" "}
                      {trader.rating_count || trader.review_count || 0} reviews •{" "}
                      {trader.subscribers || trader.followers || 0} followers
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => toggleFollow(trader)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold ${
                        trader.is_following || trader.is_subscribed
                          ? "bg-slate-800/60 text-white"
                          : "bg-purple-600 text-white"
                      }`}
                    >
                      {trader.is_following || trader.is_subscribed ? "Following" : "Follow"}
                    </button>
                    <button
                      type="button"
                      onClick={() => fetchRatings(trader.id)}
                      className="px-4 py-2 rounded-xl text-sm bg-slate-800/60 text-white"
                    >
                      View Reviews
                    </button>
                  </div>
                </div>

                {ratings && (
                  <div className="bg-slate-900/60 rounded-2xl p-4 space-y-2">
                    <p className="text-sm text-slate-300">
                      Rating summary: {ratings.average_rating?.toFixed(1) || "0.0"} ★ from{" "}
                      {ratings.total_ratings || 0} ratings
                    </p>
                    {ratings.recent_reviews?.length > 0 ? (
                      <div className="space-y-2">
                        {ratings.recent_reviews.map((review) => (
                          <div
                            key={review.id}
                            className="bg-slate-950/60 rounded-xl p-3 text-sm text-slate-200"
                          >
                            <p className="font-semibold">
                              {review.author?.username || "User"} • {review.rating} ★
                            </p>
                            <p className="text-slate-400 text-xs">{formatDate(review.created_at)}</p>
                            <p className="mt-2">{review.review}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400">No reviews yet.</p>
                    )}
                  </div>
                )}

                <div className="bg-slate-900/60 rounded-2xl p-4 space-y-3">
                  <p className="text-sm font-semibold">Rate this trader</p>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: 5 }).map((_, index) => {
                      const value = index + 1;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() =>
                            setRatingDrafts((prev) => ({
                              ...prev,
                              [trader.id]: { ...draft, rating: value },
                            }))
                          }
                          className="p-1"
                        >
                          <Star
                            className={`w-5 h-5 ${
                              value <= draft.rating ? "text-yellow-400" : "text-slate-600"
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                  <textarea
                    value={draft.review}
                    onChange={(event) =>
                      setRatingDrafts((prev) => ({
                        ...prev,
                        [trader.id]: { ...draft, review: event.target.value },
                      }))
                    }
                    placeholder="Leave a short review"
                    rows={3}
                    className="w-full rounded-xl bg-slate-950/80 border border-white/10 px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => submitRating(trader.id)}
                    className="bg-emerald-400 text-black font-semibold px-4 py-2 rounded-xl"
                  >
                    Submit Rating
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const SocialHub = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("feed");

  const tabContent = useMemo(() => {
    if (activeTab === "messages") return <MessagesPanel />;
    if (activeTab === "traders") return <TradersPanel />;
    return <FeedPanel user={user} />;
  }, [activeTab, user]);

  return (
    <div className="min-h-screen bg-[#0e1320] text-white p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-purple-400" />
              <h1 className="text-3xl font-black">Social Trading Hub</h1>
            </div>
            <p className="text-slate-400">
              Follow top traders, share trades, and connect directly in real time.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-300">
            <div className="flex items-center gap-2 bg-slate-900/50 px-3 py-2 rounded-xl">
              <Users className="w-4 h-4" />
              Community driven
            </div>
            <div className="flex items-center gap-2 bg-slate-900/50 px-3 py-2 rounded-xl">
              <Sparkles className="w-4 h-4" />
              Premium insights
            </div>
          </div>
        </div>

        <div className="bg-slate-900/50 p-2 rounded-2xl border border-white/10 flex flex-col md:flex-row gap-2">
          <TabButton
            active={activeTab === "feed"}
            onClick={() => setActiveTab("feed")}
            icon={<MessageCircle className="w-4 h-4" />}
            label="Feed"
          />
          <TabButton
            active={activeTab === "messages"}
            onClick={() => setActiveTab("messages")}
            icon={<Send className="w-4 h-4" />}
            label="Messages"
          />
          <TabButton
            active={activeTab === "traders"}
            onClick={() => setActiveTab("traders")}
            icon={<Star className="w-4 h-4" />}
            label="Traders & Ratings"
          />
        </div>

        {tabContent}
      </div>
    </div>
  );
};

export default SocialHub;
