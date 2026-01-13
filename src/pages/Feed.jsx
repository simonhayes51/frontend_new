import { useState, useEffect } from "react";
import { PostCard } from "../components/feed/PostCard";
import { TrendingTraders } from "../components/feed/TrendingTraders";
import { LiveAlerts } from "../components/feed/LiveAlerts";
import { Image, FileText, BarChart3, Zap } from "lucide-react";
import { GradientButton } from "../components/ui/GradientButton";
import { getFeed, createPost } from "../api/social";
import toast from "react-hot-toast";

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [postContent, setPostContent] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadPosts();
  }, [filter]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const { data } = await getFeed({
        type: filter !== "all" ? filter : undefined,
      });
      const items = Array.isArray(data)
        ? data
        : data?.posts || data?.items || data?.results || [];
      setPosts(items);
    } catch (error) {
      console.error("Failed to load posts:", error);
      toast.error("Failed to load feed");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!postContent.trim()) {
      toast.error("Please enter some content");
      return;
    }

    setCreating(true);
    try {
      await createPost({
        content: postContent,
        post_type: "tip",
      });
      toast.success("Post created!");
      setPostContent("");
      loadPosts();
    } catch (error) {
      console.error("Failed to create post:", error);
      toast.error("Failed to create post");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-6">
            {/* Create Post */}
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <Zap className="w-5 h-5 text-primary-foreground" />
                </div>
                <input
                  type="text"
                  placeholder="Share a trade signal, market insight, or tip..."
                  className="flex-1 bg-muted/50 border border-border rounded-lg px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleCreatePost();
                    }
                  }}
                />
              </div>
              <div className="flex items-center justify-between pl-13">
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
                    <Image className="w-4 h-4" />
                    <span className="hidden sm:inline">Image</span>
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
                    <BarChart3 className="w-4 h-4" />
                    <span className="hidden sm:inline">Trade</span>
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
                    <FileText className="w-4 h-4" />
                    <span className="hidden sm:inline">Article</span>
                  </button>
                </div>
                <GradientButton 
                  size="sm" 
                  onClick={handleCreatePost}
                  disabled={creating || !postContent.trim()}
                >
                  {creating ? "Posting..." : "Post"}
                </GradientButton>
              </div>
            </div>

            {/* Feed Tabs */}
            <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg w-fit">
              <button 
                onClick={() => setFilter("all")}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  filter === "all" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                } transition-colors`}
              >
                For You
              </button>
              <button 
                onClick={() => setFilter("subscribed")}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  filter === "subscribed" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                } transition-colors`}
              >
                Following
              </button>
              <button 
                onClick={() => setFilter("premium")}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  filter === "premium" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                } transition-colors`}
              >
                Premium
              </button>
            </div>

            {/* Posts */}
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading posts...</div>
              ) : posts.length > 0 ? (
                posts.map((post) => (
                  <PostCard key={post.id} post={post} onUpdate={loadPosts} />
                ))
              ) : (
                <div className="text-center py-12 bg-card border border-border rounded-xl">
                  <p className="text-muted-foreground">No posts yet. Be the first to share!</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <LiveAlerts />
            <TrendingTraders />
          </div>
        </div>
    </div>
  );
}
