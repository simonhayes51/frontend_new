import api from "../axios";

const SOCIAL_BASE = (import.meta.env.VITE_SOCIAL_API_URL || api.defaults.baseURL || "").replace(
  /\/$/,
  ""
);

const socialRequest = (config) => api.request({ ...config, baseURL: SOCIAL_BASE });

const tryPost = async (paths, payload) => {
  let lastError;
  for (const path of paths) {
    try {
      // eslint-disable-next-line no-await-in-loop
      return await socialRequest({ method: "post", url: path, data: payload });
    } catch (error) {
      if (error?.response?.status !== 404) throw error;
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

export const getFeed = (params) =>
  tryGet(
    ["/api/feed", "/api/social/feed", "/api/social/posts"],
    { params }
  );
export const createPost = (payload) =>
  tryPost(["/api/feed", "/api/social/feed", "/api/social/posts"], payload);
export const updatePost = (postId, payload) =>
  tryPost([`/api/feed/${postId}`, `/api/social/posts/${postId}`], payload);
export const deletePost = (postId) =>
  socialRequest({ method: "delete", url: `/api/feed/${postId}` });

export const reactToPost = (postId, reaction) =>
  tryPost(
    [
      `/api/interactions/posts/${postId}/reactions`,
      `/api/social/interactions/posts/${postId}/reactions`,
    ],
    { reaction }
  );

export const getPostComments = (postId, params) =>
  tryGet(
    [
      `/api/interactions/posts/${postId}/comments`,
      `/api/social/interactions/posts/${postId}/comments`,
    ],
    { params }
  );

export const addPostComment = (postId, payload) =>
  tryPost(
    [
      `/api/interactions/posts/${postId}/comments`,
      `/api/social/interactions/posts/${postId}/comments`,
    ],
    payload
  );

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
  tryGet([`/api/ratings/${traderId}`, `/api/social/ratings/${traderId}`]);
export const rateTrader = (traderId, payload) =>
  tryPost([`/api/ratings/${traderId}`, `/api/social/ratings/${traderId}`], payload);
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
