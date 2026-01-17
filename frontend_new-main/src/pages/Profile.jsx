import React, { useEffect, useMemo, useState } from "react";
import { useDashboard } from "../context/DashboardContext";
import api from "../axios";
import toast from "react-hot-toast";

const Profile = () => {
  const { profile, isLoading, error } = useDashboard();
  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState(null);
  const [formData, setFormData] = useState({
    bio: "",
    header_image_url: "",
    location: "",
    website_url: "",
    twitter_url: "",
    youtube_url: "",
    twitch_url: "",
  });
  const [originalData, setOriginalData] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      setProfileLoading(true);
      setProfileError(null);
      try {
        const response = await api.get("/api/user-profile");
        const data = response.data || {};
        setProfileData(data);
        const nextForm = {
          bio: data.bio || "",
          header_image_url: data.header_image_url || "",
          location: data.location || "",
          website_url: data.website_url || "",
          twitter_url: data.twitter_url || "",
          youtube_url: data.youtube_url || "",
          twitch_url: data.twitch_url || "",
        };
        setFormData(nextForm);
        setOriginalData(nextForm);
      } catch (err) {
        console.error("Failed to load profile data:", err);
        setProfileError("Failed to load profile data.");
      } finally {
        setProfileLoading(false);
      }
    };

    loadProfile();
  }, []);

  const hasProfileChanges = useMemo(() => {
    if (!originalData) return false;
    return Object.keys(formData).some((key) => formData[key] !== originalData[key]);
  }, [formData, originalData]);

  const handleProfileChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleProfileSave = async () => {
    if (!originalData) return;
    const updates = Object.keys(formData).reduce((acc, key) => {
      if (formData[key] !== originalData[key]) {
        acc[key] = formData[key];
      }
      return acc;
    }, {});

    if (Object.keys(updates).length === 0) {
      toast.error("No profile updates to save.");
      return;
    }

    setSaving(true);
    try {
      const response = await api.patch("/api/user-profile", updates);
      const updated = response.data || {};
      setProfileData((prev) => ({ ...prev, ...updated }));
      setOriginalData((prev) => ({ ...prev, ...updates }));
      toast.success("Profile updated.");
    } catch (err) {
      console.error("Failed to update profile:", err);
      toast.error(err.response?.data?.detail || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || profileLoading) {
    return <p className="text-gray-400">Loading trader profile...</p>;
  }

  if (error || profileError) {
    return <p className="text-red-400">Error loading profile: {error || profileError}</p>;
  }

  if (!profile && !profileData) {
    return <p className="text-gray-400">No trading data found yet.</p>;
  }

  const safeProfile = profile || {};

  return (
    <div className="bg-zinc-900 p-6 rounded-2xl shadow-md space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={profileData?.avatar_url || "/server-logo.png"}
            alt={profileData?.username || "Profile avatar"}
            className="w-16 h-16 rounded-full object-cover"
          />
          <div>
            <h1 className="text-2xl font-bold">Trader Profile</h1>
            <p className="text-gray-400">
              {profileData?.global_name || profileData?.username || "Your profile"}
            </p>
          </div>
        </div>
        <button
          onClick={handleProfileSave}
          disabled={saving || !hasProfileChanges}
          className="px-4 py-2 rounded-lg bg-green-600 text-white font-semibold disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </div>

      <div className="bg-black/40 p-4 rounded-xl space-y-4">
        <h2 className="text-lg font-semibold">Public Profile</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="text-sm text-gray-300">Bio</label>
            <textarea
              rows={3}
              value={formData.bio}
              onChange={(e) => handleProfileChange("bio", e.target.value)}
              className="mt-2 w-full rounded-lg bg-zinc-900 border border-white/10 p-3 text-white"
              placeholder="Tell followers about your trading style..."
            />
          </div>
          <div>
            <label className="text-sm text-gray-300">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleProfileChange("location", e.target.value)}
              className="mt-2 w-full rounded-lg bg-zinc-900 border border-white/10 p-3 text-white"
              placeholder="City, Country"
            />
          </div>
          <div>
            <label className="text-sm text-gray-300">Website</label>
            <input
              type="url"
              value={formData.website_url}
              onChange={(e) => handleProfileChange("website_url", e.target.value)}
              className="mt-2 w-full rounded-lg bg-zinc-900 border border-white/10 p-3 text-white"
              placeholder="https://example.com"
            />
          </div>
          <div>
            <label className="text-sm text-gray-300">Twitter</label>
            <input
              type="url"
              value={formData.twitter_url}
              onChange={(e) => handleProfileChange("twitter_url", e.target.value)}
              className="mt-2 w-full rounded-lg bg-zinc-900 border border-white/10 p-3 text-white"
              placeholder="https://twitter.com/username"
            />
          </div>
          <div>
            <label className="text-sm text-gray-300">YouTube</label>
            <input
              type="url"
              value={formData.youtube_url}
              onChange={(e) => handleProfileChange("youtube_url", e.target.value)}
              className="mt-2 w-full rounded-lg bg-zinc-900 border border-white/10 p-3 text-white"
              placeholder="https://youtube.com/@channel"
            />
          </div>
          <div>
            <label className="text-sm text-gray-300">Twitch</label>
            <input
              type="url"
              value={formData.twitch_url}
              onChange={(e) => handleProfileChange("twitch_url", e.target.value)}
              className="mt-2 w-full rounded-lg bg-zinc-900 border border-white/10 p-3 text-white"
              placeholder="https://twitch.tv/username"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm text-gray-300">Header Image URL</label>
            <input
              type="url"
              value={formData.header_image_url}
              onChange={(e) => handleProfileChange("header_image_url", e.target.value)}
              className="mt-2 w-full rounded-lg bg-zinc-900 border border-white/10 p-3 text-white"
              placeholder="https://..."
            />
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-black/40 p-4 rounded-xl">
          <h2 className="text-lg font-semibold">Total Profit</h2>
          <p className="text-3xl font-bold text-green-400">{safeProfile.totalProfit?.toLocaleString() || '0'}</p>
        </div>
        <div className="bg-black/40 p-4 rounded-xl">
          <h2 className="text-lg font-semibold">Trades Logged</h2>
          <p className="text-3xl font-bold text-blue-400">{safeProfile.tradesLogged || 0}</p>
        </div>
        <div className="bg-black/40 p-4 rounded-xl">
          <h2 className="text-lg font-semibold">Win Rate</h2>
          <p className="text-3xl font-bold text-green-400">{safeProfile.winRate || 0}%</p>
        </div>
        <div className="bg-black/40 p-4 rounded-xl">
          <h2 className="text-lg font-semibold">Most Used Tag</h2>
          <p className="text-3xl font-bold text-purple-400">{safeProfile.mostUsedTag || 'N/A'}</p>
        </div>
        {safeProfile.bestTrade && (
          <div className="bg-black/40 p-4 rounded-xl md:col-span-2">
            <h2 className="text-lg font-semibold">Best Trade</h2>
            <p className="text-xl font-bold text-green-400">
              {safeProfile.bestTrade.player} ({safeProfile.bestTrade.version}) → +{safeProfile.bestTrade.profit?.toLocaleString() || 'N/A'} coins
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
