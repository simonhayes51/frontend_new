import api from "../axios";

export const getFeed = (params) => api.get("/api/feed", { params });
export const createPost = (payload) => api.post("/api/feed", payload);
export const updatePost = (postId, payload) => api.put(`/api/feed/${postId}`, payload);
export const deletePost = (postId) => api.delete(`/api/feed/${postId}`);

export const reactToPost = (postId, reaction) =>
  api.post(`/api/interactions/posts/${postId}/reactions`, { reaction });

export const getPostComments = (postId, params) =>
  api.get(`/api/interactions/posts/${postId}/comments`, { params });

export const addPostComment = (postId, payload) =>
  api.post(`/api/interactions/posts/${postId}/comments`, payload);

export const updateComment = (commentId, payload) =>
  api.put(`/api/interactions/comments/${commentId}`, payload);

export const deleteComment = (commentId) =>
  api.delete(`/api/interactions/comments/${commentId}`);

export const reactToComment = (commentId) =>
  api.post(`/api/interactions/comments/${commentId}/like`);

export const getConversations = () => api.get("/api/messages/conversations");
export const getConversationMessages = (conversationId) =>
  api.get(`/api/messages/conversations/${conversationId}/messages`);

export const sendConversationMessage = (conversationId, payload) =>
  api.post(`/api/messages/conversations/${conversationId}/messages`, payload);

export const startConversation = (payload) =>
  api.post("/api/messages/conversations", payload);

export const markConversationRead = (conversationId) =>
  api.post(`/api/messages/conversations/${conversationId}/read`);

export const searchMessageUsers = (query) =>
  api.get("/api/messages/users/search", { params: { q: query } });

export const getUnreadMessageCount = () => api.get("/api/messages/unread-count");

export const getTraders = (params) => api.get("/api/traders", { params });
export const getTraderProfile = (traderId) => api.get(`/api/traders/${traderId}`);
export const upgradeToTrader = (payload) => api.post("/api/traders/upgrade", payload);

export const subscribeToTrader = (traderId) =>
  api.post(`/api/subscriptions/${traderId}/subscribe`);

export const unsubscribeFromTrader = (traderId) =>
  api.post(`/api/subscriptions/${traderId}/unsubscribe`);

export const getTraderRatings = (traderId) => api.get(`/api/ratings/${traderId}`);
export const rateTrader = (traderId, payload) => api.post(`/api/ratings/${traderId}`, payload);
export const getTopRatedTraders = () => api.get("/api/ratings/leaderboard");
