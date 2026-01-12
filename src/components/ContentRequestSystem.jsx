import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  ArrowUp,
  Check,
  X,
  Clock,
  Play,
  Plus,
  MessageSquare,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  createContentRequest,
  getTraderContentRequests,
  upvoteContentRequest,
  updateContentRequestStatus,
  deleteContentRequest,
} from "../api/social";

const STATUS_CONFIG = {
  pending: { label: "Pending", color: "bg-slate-600", icon: Clock },
  in_progress: { label: "In Progress", color: "bg-yellow-600", icon: Play },
  completed: { label: "Completed", color: "bg-green-600", icon: Check },
  declined: { label: "Declined", color: "bg-red-600", icon: X },
};

const CATEGORIES = [
  "Flipping Strategy",
  "SBC Investment",
  "Market Analysis",
  "Player Review",
  "Trading Tips",
  "Other",
];

export default function ContentRequestSystem({ traderId, isTrader = false, isSubscribed = false }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [newRequest, setNewRequest] = useState({
    title: "",
    description: "",
    category: "",
  });

  useEffect(() => {
    loadRequests();
  }, [traderId, statusFilter]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/api/content-requests/trader/${traderId}`, {
        params: { status: statusFilter === "all" ? undefined : statusFilter },
      });
      setRequests(data.requests || []);
    } catch (error) {
      console.error("Failed to load requests:", error);
      toast.error("Failed to load content requests");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!newRequest.title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    try {
      await api.post("/api/content-requests/create", {
        trader_id: traderId,
        ...newRequest,
      });
      toast.success("Content request created!");
      setNewRequest({ title: "", description: "", category: "" });
      setShowCreateModal(false);
      loadRequests();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to create request");
    }
  };

  const handleUpvote = async (requestId) => {
    try {
      const { data } = await upvoteContentRequest(requestId);
      setRequests((prev) =>
        prev.map((req) =>
          req.id === requestId
            ? { ...req, upvotes: data.upvotes, user_has_voted: data.voted }
            : req
        )
      );
      toast.success(data.message);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to vote");
    }
  };

  const handleUpdateStatus = async (requestId, newStatus, postId = null) => {
    try {
      await api.patch(`/api/content-requests/${requestId}/status`, {
        status: newStatus,
      }, {
        params: postId ? { post_id: postId } : {},
      });
      toast.success(`Status updated to ${newStatus}`);
      loadRequests();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to update status");
    }
  };

  const handleDeleteRequest = async (requestId) => {
    if (!confirm("Are you sure you want to delete this request?")) return;

    try {
      await api.delete(`/api/content-requests/${requestId}`);
      toast.success("Request deleted");
      loadRequests();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to delete");
    }
  };

  if (!isSubscribed && !isTrader) {
    return (
      <div className="bg-gradient-to-br from-purple-900/30 to-indigo-900/20 border border-purple-500/30 rounded-2xl p-8 text-center">
        <MessageSquare className="w-12 h-12 text-purple-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">Subscriber Feature</h3>
        <p className="text-slate-300 mb-4">
          Subscribe to request content and vote on what you'd like to see next!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-purple-400" />
            Content Requests
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {isTrader
              ? "See what your subscribers want to learn"
              : "Request content and upvote ideas you want to see"}
          </p>
        </div>

        {isSubscribed && !isTrader && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white px-4 py-2 rounded-xl font-semibold transition-all"
          >
            <Plus className="w-4 h-4" />
            New Request
          </button>
        )}
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {["all", "pending", "in_progress", "completed", "declined"].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-xl font-semibold whitespace-nowrap transition-all ${
              statusFilter === status
                ? "bg-purple-600 text-white"
                : "bg-slate-800/60 text-slate-300 hover:bg-slate-700/60"
            }`}
          >
            {status === "all" ? "All" : STATUS_CONFIG[status]?.label || status}
          </button>
        ))}
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-12 h-12 border-4 border-purple-600/30 border-t-purple-600 rounded-full animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>No content requests yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              isTrader={isTrader}
              onUpvote={handleUpvote}
              onUpdateStatus={handleUpdateStatus}
              onDelete={handleDeleteRequest}
            />
          ))}
        </div>
      )}

      {/* Create Request Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-lg w-full"
            >
              <h3 className="text-2xl font-bold mb-4">Request Content</h3>
              <form onSubmit={handleCreateRequest} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Title *</label>
                  <input
                    type="text"
                    placeholder="e.g., How to flip during TOTY promo"
                    value={newRequest.title}
                    onChange={(e) =>
                      setNewRequest({ ...newRequest, title: e.target.value })
                    }
                    className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-3 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Category</label>
                  <select
                    value={newRequest.category}
                    onChange={(e) =>
                      setNewRequest({ ...newRequest, category: e.target.value })
                    }
                    className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-3 text-sm"
                  >
                    <option value="">Select a category</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Description (optional)
                  </label>
                  <textarea
                    placeholder="Add more details about what you'd like to learn..."
                    value={newRequest.description}
                    onChange={(e) =>
                      setNewRequest({ ...newRequest, description: e.target.value })
                    }
                    rows={4}
                    className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-3 text-sm resize-none"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-semibold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white py-3 rounded-xl font-semibold transition-all"
                  >
                    Submit Request
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RequestCard({ request, isTrader, onUpvote, onUpdateStatus, onDelete }) {
  const statusConfig = STATUS_CONFIG[request.status];
  const StatusIcon = statusConfig?.icon || Clock;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900/60 border border-white/10 rounded-xl p-5"
    >
      <div className="flex items-start gap-4">
        {/* Upvote Button */}
        <div className="flex flex-col items-center">
          <button
            onClick={() => onUpvote(request.id)}
            disabled={request.status !== "pending"}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all ${
              request.user_has_voted
                ? "bg-purple-600 text-white"
                : "bg-slate-800 hover:bg-slate-700 text-slate-300"
            } ${request.status !== "pending" ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <ArrowUp className="w-5 h-5" />
            <span className="text-sm font-bold">{request.upvotes}</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <h4 className="font-bold text-lg">{request.title}</h4>
              {request.category && (
                <span className="inline-block text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded mt-1">
                  {request.category}
                </span>
              )}
            </div>

            <div
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${statusConfig?.color} text-white`}
            >
              <StatusIcon className="w-3 h-3" />
              {statusConfig?.label}
            </div>
          </div>

          {request.description && (
            <p className="text-sm text-slate-300 mb-3">{request.description}</p>
          )}

          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              by {request.requester_username} •{" "}
              {new Date(request.created_at).toLocaleDateString()}
            </span>

            {isTrader && request.status === "pending" && (
              <div className="flex gap-2">
                <button
                  onClick={() => onUpdateStatus(request.id, "in_progress")}
                  className="text-yellow-400 hover:text-yellow-300 font-semibold"
                >
                  Start Working
                </button>
                <button
                  onClick={() => onUpdateStatus(request.id, "completed")}
                  className="text-green-400 hover:text-green-300 font-semibold"
                >
                  Mark Complete
                </button>
                <button
                  onClick={() => onUpdateStatus(request.id, "declined")}
                  className="text-red-400 hover:text-red-300 font-semibold"
                >
                  Decline
                </button>
              </div>
            )}

            {isTrader && request.status === "in_progress" && (
              <button
                onClick={() => onUpdateStatus(request.id, "completed")}
                className="text-green-400 hover:text-green-300 font-semibold"
              >
                Mark Complete
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
