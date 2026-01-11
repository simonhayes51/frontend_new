import api from "../axios";

const tryPost = async (paths, payload) => {
  let lastError;
  for (const path of paths) {
    try {
      // eslint-disable-next-line no-await-in-loop
      return await api.post(path, payload);
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
      return await api.get(path, config);
    } catch (error) {
      if (error?.response?.status !== 404) throw error;
      lastError = error;
    }
  }
  throw lastError;
};

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
  api.get("/api/messages/users/search", {
    params: { q: query, query, username: query },
  });

export const getUnreadMessageCount = () => api.get("/api/messages/unread-count");

export const getTraders = (params) => api.get("/api/traders", { params });
export const getTraderProfile = (traderId) => api.get(`/api/traders/${traderId}`);
export const upgradeToTrader = (payload) =>
  tryPost(["/api/traders/upgrade", "/api/traders/request", "/api/traders/apply"], payload);

export const subscribeToTrader = (traderId) =>
  api.post(`/api/subscriptions/${traderId}/subscribe`);

export const unsubscribeFromTrader = (traderId) =>
  api.post(`/api/subscriptions/${traderId}/unsubscribe`);

export const getTraderRatings = (traderId) => api.get(`/api/ratings/${traderId}`);
export const rateTrader = (traderId, payload) => api.post(`/api/ratings/${traderId}`, payload);
export const getTopRatedTraders = () => api.get("/api/ratings/leaderboard");
export const getRecommendedTraders = () => api.get("/api/subscriptions/recommended");

export const getTraderRoleRequests = () =>
  tryGet(["/api/admin/traders/requests", "/api/traders/requests"]);
export const approveTraderRoleRequest = (requestId) =>
  tryPost(
    [
      `/api/admin/traders/requests/${requestId}/approve`,
      `/api/traders/requests/${requestId}/approve`,
    ],
    {}
  );
export const rejectTraderRoleRequest = (requestId) =>
  tryPost(
    [
      `/api/admin/traders/requests/${requestId}/reject`,
      `/api/traders/requests/${requestId}/reject`,
    ],
    {}
  );
export const assignTraderRole = (payload) =>
  tryPost(["/api/admin/traders/assign", "/api/traders/assign"], payload);
