import React, { useEffect, useState } from "react";
import { Upload, FileText, Target, Star, X } from "lucide-react";
import api from "../axios";
import { useAuth } from "../context/AuthContext";

const CATEGORY_OPTIONS = [
  { id: "article", label: "Articles", icon: FileText },
  { id: "tactic", label: "Tactics", icon: Target },
  { id: "review", label: "Reviews", icon: Star },
];

function CommunityUploadModal({ open, onClose, onCreated }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("article");
  const [submitting, setSubmitting] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  if (!open) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setSubmitting(true);

    try {
      await api.post("/api/social/posts", {
        post_type: category === "tactic" ? "tip" : "analysis",
        title: title.trim(),
        content: content.trim(),
        image_url: imageUrl.trim() || undefined,
        tags: [category],
        is_premium: false,
        requires_purchase: false,
      });
      setTitle("");
      setContent("");
      setCategory("article");
      setImageUrl("");
      onCreated();
      onClose();
    } catch (error) {
      console.error("Failed to create community post:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Upload to Community</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-muted"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {CATEGORY_OPTIONS.map((option) => {
              const Icon = option.icon;
              const active = category === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setCategory(option.id)}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl border text-xs ${
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-muted/40 text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Title"
            required
            className="w-full bg-muted/50 border border-border rounded-xl px-3 py-2 text-sm"
          />
          <input
            type="url"
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
            placeholder="Image URL (optional)"
            className="w-full bg-muted/50 border border-border rounded-xl px-3 py-2 text-sm"
          />
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Write your content here"
            rows={6}
            required
            className="w-full bg-muted/50 border border-border rounded-xl px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-xl font-semibold disabled:opacity-60"
          >
            <Upload className="w-4 h-4" />
            {submitting ? "Publishing..." : "Publish"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function CommunityPage() {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState("article");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [expandedPostId, setExpandedPostId] = useState(null);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/social/feed", {
        params: { limit: 50 },
      });
      const items = Array.isArray(data)
        ? data
        : data?.posts || data?.items || data?.results || [];
      const filtered = items.filter((post) => {
        if (post.post_type === "trade") return false;
        const tags = Array.isArray(post.tags) ? post.tags : [];
        if (activeCategory === "article") {
          return tags.includes("article") || post.post_type === "analysis";
        }
        if (activeCategory === "tactic") {
          return tags.includes("tactic") || post.post_type === "tip";
        }
        if (activeCategory === "review") {
          return tags.includes("review");
        }
        return true;
      });
      setPosts(filtered);
    } catch (error) {
      console.error("Failed to load community posts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [activeCategory]);

  const currentCategory = CATEGORY_OPTIONS.find((c) => c.id === activeCategory);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Community Uploads</h1>
          <p className="text-sm text-muted-foreground">
            Browse tactics, long-form articles, and reviews shared by the community.
          </p>
        </div>
        {user && (
          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold"
          >
            <Upload className="w-4 h-4" />
            Upload content
          </button>
        )}
      </div>

      <div className="flex gap-2 rounded-2xl bg-card border border-border p-1">
        {CATEGORY_OPTIONS.map((option) => {
          const Icon = option.icon;
          const active = activeCategory === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setActiveCategory(option.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>

      <div className="bg-card border border-border rounded-2xl p-4">
        {loading ? (
          <div className="py-10 text-center text-muted-foreground text-sm">
            Loading {currentCategory?.label?.toLowerCase() || "content"}...
          </div>
        ) : posts.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground text-sm">
            No {currentCategory?.label?.toLowerCase() || ""} yet.
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <div
                key={post.id}
                className="border border-border/60 rounded-xl p-4 bg-muted/40"
              >
                {post.image_url && (
                  <div className="mb-3">
                    <img
                      src={post.image_url}
                      alt={post.title || "Community upload"}
                      className="w-full max-h-64 object-cover rounded-lg"
                    />
                  </div>
                )}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <h3 className="font-semibold text-foreground">
                    {post.title || "Untitled"}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {post.author?.username
                      ? `@${post.author.username}`
                      : post.username
                      ? `@${post.username}`
                      : ""}
                  </span>
                </div>
                <p
                  className={`text-sm text-muted-foreground whitespace-pre-line ${
                    expandedPostId === post.id ? "" : "line-clamp-4"
                  }`}
                >
                  {post.content}
                </p>
                {post.content && post.content.length > 200 && (
                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedPostId(
                          expandedPostId === post.id ? null : post.id
                        )
                      }
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      {expandedPostId === post.id ? "Show less" : "View full post"}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <CommunityUploadModal
        open={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onCreated={loadPosts}
      />
    </div>
  );
}
