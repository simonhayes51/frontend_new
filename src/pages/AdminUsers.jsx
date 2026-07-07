// src/pages/AdminUsers.jsx
// Admin-only: search users and grant/revoke premium from the browser -
// built because the deploy environment has no terminal access, so
// scripts/grant_premium.py and pgAdmin aren't always practical (mobile).
// Server-side gate is require_admin on /api/admin/*; the client-side
// isAdmin check here is just UX.
import React, { useState } from "react";
import { Shield, Search, Loader2 } from "lucide-react";
import api from "../axios";
import { useEntitlements } from "../context/EntitlementsContext";

const LIME = "#91db32";

const TIER_STYLES = {
  elite: { bg: "rgba(250,204,21,0.15)", fg: "#facc15" },
  pro: { bg: "rgba(145,219,50,0.15)", fg: LIME },
  basic: { bg: "rgba(255,255,255,0.08)", fg: "rgba(255,255,255,0.6)" },
};

function TierChip({ tier }) {
  const s = TIER_STYLES[tier] || TIER_STYLES.basic;
  return (
    <span
      className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase"
      style={{ background: s.bg, color: s.fg }}
    >
      {tier || "basic"}
    </span>
  );
}

export default function AdminUsers() {
  const { isAdmin, loading: entLoading } = useEntitlements() || {};
  const [q, setQ] = useState("");
  const [users, setUsers] = useState([]);
  const [busy, setBusy] = useState(false);
  const [rowBusy, setRowBusy] = useState(null);
  const [msg, setMsg] = useState(null);

  const search = async (e) => {
    e?.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const { data } = await api.get("/api/admin/users", { params: { q } });
      setUsers(data.users || []);
      if (!data.users?.length) setMsg({ ok: true, text: "No users matched." });
    } catch (err) {
      setMsg({ ok: false, text: err?.userMessage || "Search failed - are you admin?" });
    } finally {
      setBusy(false);
    }
  };

  const setTier = async (user, tier) => {
    setRowBusy(user.id);
    setMsg(null);
    try {
      const { data } = await api.post(`/api/admin/users/${user.id}/tier`, { tier });
      setUsers((us) =>
        us.map((u) => (u.id === user.id ? { ...u, tier: data.tier, premium_until: data.premium_until } : u))
      );
      setMsg({
        ok: true,
        text: `${data.username || data.user_id}: ${data.previous_tier || "basic"} → ${data.tier}. Live within ~60s.`,
      });
    } catch (err) {
      setMsg({ ok: false, text: err?.userMessage || "Update failed." });
    } finally {
      setRowBusy(null);
    }
  };

  if (entLoading) return null;
  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto px-4 pt-12 text-center text-gray-400 text-sm">
        <Shield className="mx-auto mb-2" size={20} />
        Admin only.
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-3 pb-24 pt-4">
      <div className="flex items-center gap-2">
        <Shield size={22} style={{ color: LIME }} />
        <h1 className="text-xl font-extrabold text-white">User Admin</h1>
      </div>
      <p className="mt-1 text-sm text-gray-400">
        Search by username or Discord ID, then grant or revoke premium. Changes go live within a minute
        and are written to the audit log.
      </p>

      <form onSubmit={search} className="mt-4 flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Username or Discord ID…"
          className="flex-1 px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 text-sm text-white placeholder-gray-500"
        />
        <button
          type="submit"
          disabled={busy}
          className="px-4 py-2 rounded-xl text-sm font-bold text-black inline-flex items-center gap-1.5 active:scale-[0.98] disabled:opacity-50"
          style={{ background: LIME }}
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} Search
        </button>
      </form>

      {msg && (
        <p className={`mt-3 text-xs ${msg.ok ? "text-gray-300" : "text-red-400"}`}>{msg.text}</p>
      )}

      <div className="mt-4 space-y-2">
        {users.map((u) => (
          <div
            key={u.id}
            className="rounded-xl border border-gray-800 bg-gray-900/60 p-3 flex flex-col sm:flex-row sm:items-center gap-2"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white truncate">{u.username || u.id}</span>
                <TierChip tier={u.tier} />
                {u.account_type && u.account_type !== "user" && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-400">
                    {u.account_type}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-gray-500 truncate">
                {u.discord_id ? `discord ${u.discord_id}` : u.id}
                {u.premium_until ? ` · until ${new Date(u.premium_until).toLocaleDateString()}` : ""}
              </div>
            </div>
            <div className="flex gap-1.5 shrink-0">
              {["free", "pro", "elite"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTier(u, t)}
                  disabled={rowBusy === u.id}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border active:scale-[0.98] disabled:opacity-50 ${
                    (u.tier === t || (t === "free" && (!u.tier || u.tier === "basic")))
                      ? "border-transparent text-black"
                      : "border-gray-700 text-gray-300 hover:border-gray-500"
                  }`}
                  style={
                    u.tier === t || (t === "free" && (!u.tier || u.tier === "basic"))
                      ? { background: LIME }
                      : {}
                  }
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
