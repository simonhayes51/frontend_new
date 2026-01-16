// src/pages/TraderProfileNew.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

// Adjust these imports to your project structure:
import {
  getTraderProfile,
  subscribeToTrader,
  unsubscribeFromTrader,
  checkSubscriptionStatus,
  getTraderSubscriptionStats,
  getTraderRatings,
} from "../api/socialApi";

// If you use lucide-react (common in your stack). If not, remove icons.
import {
  Globe,
  Twitter,
  Youtube,
  Twitch,
  MapPin,
  BadgeCheck,
  UserPlus,
  UserMinus,
  AlertTriangle,
} from "lucide-react";

const isBadId = (v) =>
  v == null ||
  String(v).trim() === "" ||
  ["undefined", "null", "none"].includes(String(v).trim().toLowerCase());

const safeArray = (v) => (Array.isArray(v) ? v : []);
const safeStr = (v, fallback = "") => (v == null ? fallback : String(v));
const safeNum = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const iconForUrl = (url) => {
  const u = (url || "").toLowerCase();
  if (!u) return null;
  if (u.includes("twitter.com") || u.includes("x.com")) return Twitter;
  if (u.includes("youtube.com") || u.includes("youtu.be")) return Youtube;
  if (u.includes("twitch.tv")) return Twitch;
  return Globe;
};

export default function TraderProfileNew() {
  const params = useParams();
  const navigate = useNavigate();

  // Support either /traders/:id or /traders/:traderId
  const routeId = useMemo(() => params?.traderId ?? params?.id, [params]);

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [subStats, setSubStats] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [error, setError] = useState("");

  // Always derive a single “internal id” for actions
  const traderId = useMemo(() => {
    if (isBadId(routeId)) return null;
    return String(routeId).trim();
  }, [routeId]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setError("");
      setLoading(true);
      setProfile(null);
      setSubStats(null);
      setRatings([]);
      setIsSubscribed(false);

      if (!traderId) {
        setLoading(false);
        setError("Invalid trader id.");
        return;
      }

      try {
        // 1) profile
        const profileRes = await getTraderProfile(traderId);
        if (cancelled) return;

        // Some APIs return {data: ...}, axios does that.
        const p = profileRes?.data ?? profileRes;
        setProfile(p);

        // Use the profile.id (internal id) for everything else if present
        const internalId = !isBadId(p?.id) ? String(p.id) : traderId;

        // 2) subscription status (optional but nice)
        try {
          const subRes = await checkSubscriptionStatus(internalId);
          if (!cancelled) {
            const s = subRes?.data ?? subRes;
            setIsSubscribed(Boolean(s?.is_subscribed));
          }
        } catch {
          // ignore
        }

        // 3) subscription stats (your endpoint already guards undefined)
        try {
          const statsRes = await getTraderSubscriptionStats(internalId);
          if (!cancelled) setSubStats(statsRes?.data ?? statsRes);
        } catch {
          // ignore
        }

        // 4) ratings (optional)
        try {
          const rRes = await getTraderRatings(internalId);
          if (!cancelled) setRatings(rRes?.data ?? rRes ?? []);
        } catch {
          // ignore
        }
      } catch (e) {
        if (cancelled) return;
        setError(
          e?.response?.data?.detail ||
            e?.message ||
            "Failed to load trader profile."
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [traderId]);

  const internalTraderId = useMemo(() => {
    // Prefer the returned profile.id (internal user id)
    if (!isBadId(profile?.id)) return String(profile.id);
    // fall back to route id
    if (!isBadId(traderId)) return String(traderId);
    return null;
  }, [profile, traderId]);

  const socials = useMemo(() => {
    // Your TraderPublicProfile model has these
    const website_url = safeStr(profile?.website_url);
    const twitter_url = safeStr(profile?.twitter_url);
    const youtube_url = safeStr(profile?.youtube_url);
    const twitch_url = safeStr(profile?.twitch_url);

    const list = [
      website_url && { label: "Website", url: website_url },
      twitter_url && { label: "X / Twitter", url: twitter_url },
      youtube_url && { label: "YouTube", url: youtube_url },
      twitch_url && { label: "Twitch", url: twitch_url },
    ].filter(Boolean);

    return list;
  }, [profile]);

  const onToggleSubscribe = async () => {
    setError("");
    if (!internalTraderId) {
      setError("Missing trader id.");
      return;
    }
    if (actionBusy) return;

    setActionBusy(true);
    try {
      if (isSubscribed) {
        await unsubscribeFromTrader(internalTraderId);
        setIsSubscribed(false);
      } else {
        await subscribeToTrader(internalTraderId);
        setIsSubscribed(true);
      }

      // refresh stats after change (optional)
      try {
        const statsRes = await getTraderSubscriptionStats(internalTraderId);
        setSubStats(statsRes?.data ?? statsRes);
      } catch {
        // ignore
      }
    } catch (e) {
      setError(
        e?.response?.data?.detail ||
          e?.message ||
          "Subscription action failed."
      );
    } finally {
      setActionBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-sm opacity-80">
        Loading trader profile…
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5" />
          <div>
            <div className="font-semibold">Trader profile error</div>
            <div className="text-sm opacity-90">{error}</div>
            <button
              className="mt-3 rounded-md border px-3 py-1.5 text-sm"
              onClick={() => navigate(-1)}
            >
              Go back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const username = safeStr(profile?.username, "Anonymous");
  const avatar = profile?.avatar_url || "";
  const header = profile?.header_image_url || "";
  const verified = Boolean(profile?.verified);
  const bio = safeStr(profile?.bio, "");
  const location = safeStr(profile?.location, "");
  const specialties = safeArray(profile?.specialties);

  const totalFollowers = safeNum(profile?.total_followers, 0);
  const totalPosts = safeNum(profile?.total_posts, 0);
  const avgRating = safeNum(profile?.avg_rating, 0);
  const totalRatings = safeNum(profile?.total_ratings, 0);

  return (
    <div className="mx-auto w-full max-w-5xl p-4 md:p-6">
      {/* Header */}
      <div className="overflow-hidden rounded-2xl border">
        <div className="relative h-36 w-full md:h-48">
          {header ? (
            <img
              src={header}
              alt=""
              className="h-full w-full object-cover"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-r from-slate-900 to-slate-800" />
          )}

          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
            <div className="flex items-end gap-4">
              <div className="h-16 w-16 overflow-hidden rounded-2xl border bg-black/20 md:h-20 md:w-20">
                {avatar ? (
                  <img
                    src={avatar}
                    alt=""
                    className="h-full w-full object-cover"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                ) : (
                  <div className="h-full w-full" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="truncate text-xl font-semibold md:text-2xl">
                    {username}
                  </h1>
                  {verified && (
                    <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs">
                      <BadgeCheck className="h-4 w-4" />
                      Verified
                    </span>
                  )}
                </div>

                {location && (
                  <div className="mt-1 flex items-center gap-2 text-sm opacity-80">
                    <MapPin className="h-4 w-4" />
                    <span className="truncate">{location}</span>
                  </div>
                )}
              </div>

              <button
                onClick={onToggleSubscribe}
                disabled={actionBusy || !internalTraderId}
                className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium disabled:opacity-50"
              >
                {isSubscribed ? (
                  <>
                    <UserMinus className="h-4 w-4" />
                    Unfollow
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Follow
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 md:p-6">
          {bio && <p className="whitespace-pre-wrap text-sm opacity-90">{bio}</p>}

          {specialties.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {specialties.slice(0, 20).map((s) => (
                <span
                  key={s}
                  className="rounded-full border px-3 py-1 text-xs opacity-90"
                >
                  {s}
                </span>
              ))}
            </div>
          )}

          {socials.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {socials.map((s) => {
                const Icon = iconForUrl(s.url) || Globe; // ✅ never undefined
                return (
                  <a
                    key={s.label}
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm"
                  >
                    <Icon className="h-4 w-4" />
                    {s.label}
                  </a>
                );
              })}
            </div>
          )}

          {/* Stats */}
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-xl border p-3">
              <div className="text-xs opacity-70">Followers</div>
              <div className="text-lg font-semibold">{totalFollowers}</div>
            </div>
            <div className="rounded-xl border p-3">
              <div className="text-xs opacity-70">Posts</div>
              <div className="text-lg font-semibold">{totalPosts}</div>
            </div>
            <div className="rounded-xl border p-3">
              <div className="text-xs opacity-70">Avg rating</div>
              <div className="text-lg font-semibold">{avgRating.toFixed(1)}</div>
            </div>
            <div className="rounded-xl border p-3">
              <div className="text-xs opacity-70">Ratings</div>
              <div className="text-lg font-semibold">{totalRatings}</div>
            </div>
          </div>

          {/* Subscription stats (if available) */}
          {subStats && (
            <div className="mt-6 rounded-2xl border p-4">
              <div className="text-sm font-semibold">Subscription stats</div>
              <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="rounded-xl border p-3">
                  <div className="text-xs opacity-70">Total</div>
                  <div className="text-lg font-semibold">
                    {safeNum(subStats.total, 0)}
                  </div>
                </div>
                <div className="rounded-xl border p-3">
                  <div className="text-xs opacity-70">Founding</div>
                  <div className="text-lg font-semibold">
                    {safeNum(subStats.founding_count, 0)}
                  </div>
                </div>
                <div className="rounded-xl border p-3">
                  <div className="text-xs opacity-70">Active %</div>
                  <div className="text-lg font-semibold">
                    {safeNum(subStats.active_percentage, 0)}%
                  </div>
                </div>
                <div className="rounded-xl border p-3">
                  <div className="text-xs opacity-70">Tiers</div>
                  <div className="text-xs opacity-90">
                    {Object.entries(subStats.tier_breakdown || {}).length
                      ? Object.entries(subStats.tier_breakdown || {})
                          .map(([k, v]) => `${k}:${v}`)
                          .join(" • ")
                      : "—"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Ratings (optional) */}
          {Array.isArray(ratings) && ratings.length > 0 && (
            <div className="mt-6 rounded-2xl border p-4">
              <div className="text-sm font-semibold">Recent ratings</div>
              <div className="mt-3 space-y-2">
                {ratings.slice(0, 5).map((r, idx) => (
                  <div key={r?.id ?? idx} className="rounded-xl border p-3">
                    <div className="text-xs opacity-70">
                      {safeNum(r?.rating, 0)} ★
                    </div>
                    {r?.review && (
                      <div className="mt-1 text-sm opacity-90">
                        {safeStr(r.review)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
