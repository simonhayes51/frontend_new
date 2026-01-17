import api from "../axios";

const SOCIAL_BASE = (import.meta.env.VITE_SOCIAL_API_URL || api.defaults.baseURL || "")
  .replace(/\/$/, "")
  .replace(/^http:\/\//, "https://");

const socialRequest = (config) => api.request({ ...config, baseURL: SOCIAL_BASE });

const tryPost = async (paths, payload) => {
  let lastError;
  for (const path of paths) {
    try {
      // eslint-disable-next-line no-await-in-loop
      return await socialRequest({ method: "post", url: path, data: payload });
    } catch (error) {
      if (![404, 405].includes(error?.response?.status)) throw error;
      lastError = error;
    }
  }
  throw lastError;
};

const tryPatch = async (paths, payload) => {
  let lastError;
  for (const path of paths) {
    try {
      // eslint-disable-next-line no-await-in-loop
      return await socialRequest({ method: "patch", url: path, data: payload });
    } catch (error) {
      if (![404, 405].includes(error?.response?.status)) throw error;
      lastError = error;
    }
  }
  throw lastError;
};

const tryGet = async (paths, config) => {
  let lastError;
  for (const path of paths) {
    try {
      // eslint-disable-next-line no-await-in-loop
      return await socialRequest({ method: "get", url: path, ...config });
    } catch (error) {
      if (error?.response?.status !== 404) throw error;
      lastError = error;
    }
  }
  throw lastError;
};

const tryDelete = async (paths) => {
  let lastError;
  for (const path of paths) {
    try {
      // eslint-disable-next-line no-await-in-loop
      return await socialRequest({ method: "delete", url: path });
    } catch (error) {
      if (![404, 405].includes(error?.response?.status)) throw error;
      lastError = error;
    }
  }
  throw lastError;
};

export const getFeed = (params) =>
  tryGet(
    ["/api/feed", "/api/social/feed", "/api/social/posts"],
    { params }
  );
export const createPost = (payload) =>
  tryPost(
    ["/api/feed/posts", "/api/social/posts", "/api/feed", "/api/social/feed"],
    payload
  );
export const updatePost = async (postId, payload) => {
  try {
    return await tryPatch([`/api/feed/posts/${postId}`], payload);
  } catch (error) {
    if (![404, 405].includes(error?.response?.status)) throw error;
    return tryPost([`/api/social/posts/${postId}`], payload);
  }
};
export const deletePost = (postId) =>
  socialRequest({ method: "delete", url: `/api/feed/${postId}` });

export const reactToPost = (postId, reaction) =>
  socialRequest({
    method: "post",
    url: `/api/social/posts/${postId}/reactions`,
    data: { reaction: reaction || "like" },
  });

export const removePostReaction = (postId) =>
  socialRequest({ method: "delete", url: `/api/social/posts/${postId}/reactions` });

export const getPostComments = (postId, params) =>
  socialRequest({ method: "get", url: `/api/social/posts/${postId}/comments`, params });

export const addPostComment = (postId, payload) =>
  socialRequest({ method: "post", url: `/api/social/posts/${postId}/comments`, data: payload });

export const updateComment = (commentId, payload) =>
  tryPost(
    [
      `/api/interactions/comments/${commentId}`,
      `/api/social/interactions/comments/${commentId}`,
    ],
    payload
  );

export const deleteComment = (commentId) =>
  socialRequest({ method: "delete", url: `/api/interactions/comments/${commentId}` });

export const reactToComment = (commentId) =>
  tryPost(
    [
      `/api/interactions/comments/${commentId}/like`,
      `/api/social/interactions/comments/${commentId}/like`,
    ],
    {}
  );

export const sharePost = (postId) =>
  socialRequest({ method: "post", url: `/api/social/posts/${postId}/share` });

export const viewPost = async (postId) => {
  try {
    return await socialRequest({
      method: "post",
      url: `/api/social/posts/${postId}/view`,
    });
  } catch (error) {
    if (error?.response?.status === 404) {
      return { data: { post_id: postId } };
    }
    throw error;
  }
};

export const getConversations = () =>
  tryGet(["/api/messages/conversations", "/api/social/messages/conversations"]);
export const getConversationMessages = (conversationId) =>
  tryGet([
    `/api/messages/conversations/${conversationId}/messages`,
    `/api/social/messages/conversations/${conversationId}/messages`,
  ]);

export const sendConversationMessage = (conversationId, payload) =>
  tryPost(
    [
      `/api/messages/conversations/${conversationId}/messages`,
      `/api/social/messages/conversations/${conversationId}/messages`,
    ],
    payload
  );

export const startConversation = (payload) =>
  tryPost(["/api/messages/conversations", "/api/social/messages/conversations"], payload);

export const deleteConversationMessage = (conversationId, messageId) =>
  socialRequest({
    method: "delete",
    url: `/api/messages/conversations/${conversationId}/messages/${messageId}`,
  });

export const clearConversationMessages = (conversationId) =>
  tryPost(
    [
      `/api/messages/conversations/${conversationId}/clear`,
      `/api/social/messages/conversations/${conversationId}/clear`,
    ],
    {}
  );

export const markConversationRead = (conversationId) =>
  tryPost(
    [
      `/api/messages/conversations/${conversationId}/read`,
      `/api/social/messages/conversations/${conversationId}/read`,
    ],
    {}
  );

export const searchMessageUsers = (query) =>
  tryGet(
    [
      "/api/messages/users/search",
      "/api/social/messages/users/search",
      "/api/messages/search/users",
    ],
    { params: { q: query, query, username: query } }
  );

export const getUnreadMessageCount = () =>
  tryGet(["/api/messages/unread-count", "/api/social/messages/unread-count"]);

export const getNotifications = (params) =>
  tryGet(
    ["/api/notifications", "/api/social/notifications"],
    { params }
  );

export const markNotificationRead = (notificationId) =>
  tryPost(
    [
      `/api/notifications/${notificationId}/read`,
      `/api/social/notifications/${notificationId}/read`,
    ],
    {}
  );

export const markAllNotificationsRead = () =>
  tryPost(
    ["/api/notifications/read-all", "/api/social/notifications/read-all"],
    {}
  );

export const deleteNotification = (notificationId) =>
  tryDelete([
    `/api/notifications/${notificationId}`,
    `/api/social/notifications/${notificationId}`,
  ]);

export const getUnreadNotificationCount = () =>
  tryGet([
    "/api/notifications/unread-count",
    "/api/social/notifications/unread-count",
  ]);

export const getTraders = (params) =>
  tryGet(["/api/traders", "/api/social/traders"], { params });
export const getTraderProfile = (traderId) => api.get(`/api/traders/${traderId}`);
export const upgradeToTrader = (payload) =>
  tryPost(
    ["/api/traders/upgrade", "/api/traders/request", "/api/traders/apply", "/api/social/traders"],
    payload
  );

export const subscribeToTrader = (traderId) =>
  tryPost(
    [
      `/api/subscriptions/${traderId}/subscribe`,
      `/api/social/subscriptions/${traderId}/subscribe`,
    ],
    {}
  );

export const unsubscribeFromTrader = (traderId) =>
  tryPost(
    [
      `/api/subscriptions/${traderId}/unsubscribe`,
      `/api/social/subscriptions/${traderId}/unsubscribe`,
    ],
    {}
  );

export const getTraderRatings = (traderId) =>
  tryGet(
    [
      `/api/ratings/trader/${traderId}`,
      `/api/ratings/${traderId}`,
      `/api/social/ratings/${traderId}`,
    ]
  );
export const rateTrader = (traderId, payload) =>
  tryPost(
    [
      "/api/ratings/rate",
      `/api/ratings/${traderId}`,
      `/api/social/ratings/${traderId}`,
    ],
    { trader_id: traderId, ...payload }
  );
export const getTraderRatingSummary = (traderId) =>
  tryGet([`/api/ratings/trader/${traderId}/summary`]);
export const getMyTraderRating = (traderId) =>
  tryGet([`/api/ratings/my-rating/${traderId}`]);
export const deleteMyTraderRating = (traderId) =>
  tryDelete([`/api/ratings/rating/${traderId}`]);
export const getTopRatedTraders = () =>
  tryGet(["/api/ratings/leaderboard", "/api/social/ratings/leaderboard"]);
export const getRecommendedTraders = () =>
  tryGet(["/api/subscriptions/recommended", "/api/social/subscriptions/recommended"]);

export const getTraderRoleRequests = () =>
  tryGet([
    "/api/admin/traders/requests",
    "/api/traders/requests",
    "/api/social/traders/requests",
  ]);
export const approveTraderRoleRequest = (requestId) =>
  tryPost(
    [
      `/api/admin/traders/requests/${requestId}/approve`,
      `/api/traders/requests/${requestId}/approve`,
      `/api/social/traders/requests/${requestId}/approve`,
    ],
    {}
  );
export const rejectTraderRoleRequest = (requestId) =>
  tryPost(
    [
      `/api/admin/traders/requests/${requestId}/reject`,
      `/api/traders/requests/${requestId}/reject`,
      `/api/social/traders/requests/${requestId}/reject`,
    ],
    {}
  );
export const assignTraderRole = (payload) =>
  tryPost(
    ["/api/admin/traders/assign", "/api/traders/assign", "/api/social/traders/assign"],
    payload
  );

// ============================================================================
// NEW: Tier-based subscriptions, tips, and saved posts
// ============================================================================

export const subscribeToTier = (traderId, tier) =>
  tryPost([`/api/subscriptions/tier/${traderId}`], { tier });

export const getTraderSubscriptionStats = (traderId) =>
  tryGet([`/api/subscriptions/trader/${traderId}/subscription-stats`]);

export const checkSubscriptionStatus = (traderId) =>
  tryGet([`/api/subscriptions/check/${traderId}`]);

export const getSubscriptionPrice = (traderId) =>
  tryGet([
    `/api/subscriptions/${traderId}/subscription-price`,
    `/api/social/subscriptions/${traderId}/subscription-price`,
  ]);

export const tipPost = (postId, amount) =>
  tryPost(["/api/subscriptions/tip"], { post_id: postId, amount });

export const getMySubscriptions = () =>
  tryGet(
    [
      "/api/subscriptions/my-subscriptions",
      "/api/subscriptions/mine",
      "/api/social/subscriptions/mine",
    ]
  );

export const savePost = (postId) =>
  tryPost([`/api/subscriptions/save-post/${postId}`], {});

export const unsavePost = (postId) =>
  socialRequest({ method: "delete", url: `/api/subscriptions/save-post/${postId}` });

export const getSavedPosts = (params) =>
  tryGet(["/api/subscriptions/saved-posts"], { params });

// Content Requests
export const createContentRequest = (payload) =>
  tryPost(["/api/content-requests/create"], payload);

export const getTraderContentRequests = (traderId, params) =>
  tryGet([`/api/content-requests/trader/${traderId}`], { params });

export const upvoteContentRequest = (requestId) =>
  tryPost([`/api/content-requests/${requestId}/upvote`], {});

export const updateContentRequestStatus = (requestId, status, postId) =>
  socialRequest({
    method: "patch",
    url: `/api/content-requests/${requestId}/status`,
    data: { status },
    params: postId ? { post_id: postId } : {},
  });

export const deleteContentRequest = (requestId) =>
  socialRequest({ method: "delete", url: `/api/content-requests/${requestId}` });

export const getMyContentRequests = (params) =>
  tryGet(["/api/content-requests/my-requests"], { params });
