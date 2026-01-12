import React, { useEffect, useMemo, useState } from "react";
import {
  MessageSquare,
  MessageCircle,
  Send,
  Star,
  Users,
  Sparkles,
  Search,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import {
  getConversations,
  getConversationMessages,
  getTopRatedTraders,
  getTraders,
  getTraderRatings,
  markConversationRead,
  rateTrader,
  searchMessageUsers,
  sendConversationMessage,
  startConversation,
  subscribeToTrader,
  unsubscribeFromTrader,
} from "../api/social";
import FeedPanel, { formatDate } from "../components/social/FeedPanel";

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

const MessagesPanel = () => {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageDraft, setMessageDraft] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [userQuery, setUserQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [newRecipient, setNewRecipient] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [isStarting, setIsStarting] = useState(false);

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

  const handleSendNewMessage = async () => {
    if (!newRecipient?.id) {
      toast.error("Select a recipient first");
      return;
    }
    if (!newMessage.trim()) {
      toast.error("Write a message first");
      return;
    }

    setIsStarting(true);
    try {
      const { data } = await startConversation({ recipient_id: newRecipient.id });
      const conversation = data?.conversation || data;
      if (!conversation?.id) {
        toast.error("Unable to start conversation");
        return;
      }
      setConversations((prev) => [conversation, ...prev]);
      setActiveConversation(conversation);
      const { data: messageData } = await sendConversationMessage(conversation.id, {
        content: newMessage,
      });
      const sentMessage = messageData?.message || messageData;
      setMessages(sentMessage ? [sentMessage] : []);
      setNewMessage("");
      setNewRecipient(null);
      setUserQuery("");
      setSearchResults([]);
    } catch (error) {
      toast.error(error.userMessage || "Failed to send message");
    } finally {
      setIsStarting(false);
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
                onClick={() => {
                  setNewRecipient(user);
                  setNewMessage("");
                  setActiveConversation(null);
                }}
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
                onClick={() => {
                  setActiveConversation(conversation);
                  setNewRecipient(null);
                  setNewMessage("");
                }}
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
          <div className="flex flex-col gap-6 h-full">
            <div className="text-slate-400 text-center py-6">
              Select a conversation or start a new message.
            </div>
            <div className="bg-slate-950/60 border border-white/10 rounded-2xl p-4 space-y-4">
              <div>
                <h3 className="text-lg font-semibold">New message</h3>
                <p className="text-xs text-slate-400">
                  Pick a recipient from the search results and send your first note.
                </p>
              </div>
              <div className="bg-slate-900/60 rounded-xl px-3 py-2 text-sm text-slate-200">
                {newRecipient
                  ? newRecipient.username || newRecipient.display_name || "Trader"
                  : "No recipient selected"}
              </div>
              <textarea
                value={newMessage}
                onChange={(event) => setNewMessage(event.target.value)}
                placeholder="Write a message to start the conversation"
                rows={4}
                className="w-full rounded-xl bg-slate-950/80 border border-white/10 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={handleSendNewMessage}
                disabled={isStarting}
                className="bg-purple-600 hover:bg-purple-500 text-white rounded-xl px-4 py-2 text-sm font-semibold"
              >
                {isStarting ? "Sending..." : "Send message"}
              </button>
            </div>
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
