import React, { useEffect, useState } from "react";
import { CheckCircle2, Search, ShieldCheck, UserPlus, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import {
  approveTraderRoleRequest,
  assignTraderRole,
  getTraderRoleRequests,
  rejectTraderRoleRequest,
  searchMessageUsers,
} from "../api/social";
import { formatDate } from "../components/social/FeedPanel";
import { useAuth } from "../context/AuthContext";
import { getAdminIds, isAdminUser } from "../utils/admin";

export default function AdminTraders() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [manualUserId, setManualUserId] = useState("");

  const adminAccess = isAdminUser(user);
  const adminIds = getAdminIds();
  const userId = user?.user_id || user?.id || "unknown";
  const username = user?.username || user?.global_name || "unknown";

  const loadRequests = async () => {
    setLoading(true);
    try {
      const { data } = await getTraderRoleRequests();
      const items = Array.isArray(data)
        ? data
        : data?.requests || data?.items || data?.results || [];
      setRequests(items);
    } catch (error) {
      toast.error(error.userMessage || "Failed to load trader requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adminAccess) {
      loadRequests();
    }
  }, [adminAccess]);

  useEffect(() => {
    if (!adminAccess) return () => {};
    const handler = setTimeout(async () => {
      if (!searchQuery || searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }
      try {
        const { data } = await searchMessageUsers(searchQuery);
        const items = Array.isArray(data)
          ? data
          : data?.users || data?.results || [];
        setSearchResults(items);
      } catch (error) {
        toast.error(error.userMessage || "Failed to search users");
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [adminAccess, searchQuery]);

  const handleApprove = async (requestId) => {
    try {
      await approveTraderRoleRequest(requestId);
      toast.success("Trader request approved");
      setRequests((prev) => prev.filter((req) => req.id !== requestId));
    } catch (error) {
      toast.error(error.userMessage || "Failed to approve request");
    }
  };

  const handleReject = async (requestId) => {
    try {
      await rejectTraderRoleRequest(requestId);
      toast.success("Trader request rejected");
      setRequests((prev) => prev.filter((req) => req.id !== requestId));
    } catch (error) {
      toast.error(error.userMessage || "Failed to reject request");
    }
  };

  const handleAssignRole = async (userId) => {
    if (!userId) {
      toast.error("Enter a user ID to grant trader role");
      return;
    }
    try {
      await assignTraderRole({ user_id: userId });
      toast.success("Trader role granted");
      setManualUserId("");
      setSearchResults([]);
      setSearchQuery("");
    } catch (error) {
      toast.error(error.userMessage || "Failed to grant trader role");
    }
  };

  if (!adminAccess) {
    return (
      <div className="min-h-screen bg-[#0e1320] text-white p-6">
        <div className="max-w-3xl mx-auto bg-slate-900/60 border border-white/10 rounded-2xl p-6 text-center">
          <h1 className="text-xl font-semibold mb-2">Admin access required</h1>
          <p className="text-slate-400">
            You do not have access to the trader requests panel.
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Ask an existing admin to add your user ID to VITE_ADMIN_IDS or grant admin on the
            backend.
          </p>
          <div className="mt-4 text-xs text-slate-500 space-y-1">
            <p>Signed in as: {username}</p>
            <p>User ID: {userId}</p>
            <p>
              Configured VITE_ADMIN_IDS: {adminIds.length > 0 ? adminIds.join(", ") : "none"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0e1320] text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black">Trader Requests</h1>
            <p className="text-slate-400">
              Review trader role requests and manually grant access to members.
            </p>
          </div>
          <button
            type="button"
            onClick={loadRequests}
            className="bg-slate-800/70 hover:bg-slate-700 text-sm px-4 py-2 rounded-xl"
          >
            Refresh
          </button>
        </div>

        <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <UserPlus className="w-4 h-4" />
            Manually add trader role
          </div>
          <div className="grid md:grid-cols-[1fr_auto] gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by username"
                className="w-full rounded-xl bg-slate-950/80 border border-white/10 pl-9 pr-3 py-2 text-sm"
              />
            </div>
            <button
              type="button"
              onClick={() => handleAssignRole(manualUserId)}
              className="bg-emerald-400 text-black font-semibold px-4 py-2 rounded-xl"
            >
              Grant Role
            </button>
          </div>
          {searchResults.length > 0 && (
            <div className="grid md:grid-cols-2 gap-2">
              {searchResults.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => setManualUserId(user.id)}
                  className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm border ${
                    manualUserId === user.id
                      ? "border-emerald-400/60 bg-emerald-500/10"
                      : "border-white/5 bg-slate-950/60"
                  }`}
                >
                  <span>{user.username || user.display_name || "User"}</span>
                  <span className="text-xs text-slate-400">{user.id}</span>
                </button>
              ))}
            </div>
          )}
          {manualUserId && (
            <p className="text-xs text-slate-400">Selected user ID: {manualUserId}</p>
          )}
        </div>

        <div className="bg-slate-900/60 border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold">Pending requests</h2>
          </div>
          {loading ? (
            <div className="p-6 text-sm text-slate-400">Loading requests...</div>
          ) : requests.length === 0 ? (
            <div className="p-6 text-sm text-slate-400">No pending requests.</div>
          ) : (
            <div className="divide-y divide-white/5">
              {requests.map((request) => (
                <div key={request.id} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold">
                      {request.user?.username || request.username || "User"}
                    </p>
                    <p className="text-xs text-slate-400">
                      Requested {formatDate(request.created_at)} • User ID: {request.user_id}
                    </p>
                    {request.note && (
                      <p className="text-xs text-slate-300 mt-1">“{request.note}”</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleApprove(request.id)}
                      className="flex items-center gap-1 bg-emerald-400 text-black text-sm font-semibold px-3 py-2 rounded-xl"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReject(request.id)}
                      className="flex items-center gap-1 bg-red-500/70 text-white text-sm font-semibold px-3 py-2 rounded-xl"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
