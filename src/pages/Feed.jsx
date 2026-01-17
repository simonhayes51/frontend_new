import { useState, useEffect } from "react";
import { PostCard } from "../components/feed/PostCard";
import { TrendingTraders } from "../components/feed/TrendingTraders";
import { LiveAlerts } from "../components/feed/LiveAlerts";
import { CommunityUploads } from "../components/feed/CommunityUploads";
import { TradeSignalModal } from "../components/feed/TradeSignalModal";
import { ArticleEditorModal } from "../components/feed/ArticleEditorModal";
import { Image, FileText, BarChart3, Zap, X } from "lucide-react";
import { GradientButton } from "../components/ui/GradientButton";
import { getFeed, createPost } from "../api/social";
import { getPaymentAccountsStatus } from "../api/billing";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { useSearchParams } from "react-router-dom";

export default function Feed() {
  const { user, login } = useAuth();
  const [searchParams] = useSearchParams();
  const searchQuery = (searchParams.get("q") || "").trim();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [postContent, setPostContent] = useState("");
  const [creating, setCreating] = useState(false);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  
  // Pricing & Access Control
  const [accessType, setAccessType] = useState("free"); // free, premium, paid
  const [price, setPrice] = useState("");
  const [paymentStatus, setPaymentStatus] = useState(null);

  // Warning on leave
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (postContent.trim() || selectedImage) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [postContent, selectedImage]);

  // Check payment status on mount
  useEffect(() => {
    if (user?.account_type === "trader") {
      checkPaymentStatus();
    }
  }, [user]);

  const checkPaymentStatus = async () => {
    try {
      const { data } = await getPaymentAccountsStatus();
      setPaymentStatus(data);
    } catch (error) {
      console.error("Failed to check payment status:", error);
    }
  };

  // Dummy posts for locked state
  const lockedPosts = [
    { 
      id: 1, 
      author: { username: "TradingPro", avatar_url: null, account_type: "trader" }, 
      content: "🔥 Huge opportunity on this player! Buy now before the hype starts. This is a locked preview of what you can see inside.", 
      created_at: new Date().toISOString(), 
      likes_count: 42, 
      comments_count: 12,
      is_premium: true,
      can_view: false
    },
    { 
      id: 2, 
      author: { username: "MarketKing", avatar_url: null, account_type: "user" }, 
      content: "Market is dipping, great time to invest in high rated fodder. Don't miss out on the rebound!", 
      created_at: new Date().toISOString(), 
      likes_count: 28, 
      comments_count: 5 
    },
    { 
      id: 3, 
      author: { username: "FUT_Sniper", avatar_url: null, account_type: "trader" }, 
      content: "Just flipped this icon for 200k profit! 💰 check the guide below. Join now to see the full breakdown.", 
      created_at: new Date().toISOString(), 
      likes_count: 156, 
      comments_count: 34,
      requires_purchase: true,
      price: 4.99,
      can_view: false
    },
  ];

  useEffect(() => {
    if (user) {
      loadPosts();
    } else {
      setPosts(lockedPosts);
      setLoading(false);
    }
  }, [filter, user, searchQuery]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter === "subscribed" || filter === "premium") {
        params.feed_type = "subscribed";
      }

      const { data } = await getFeed(params);
      let items = Array.isArray(data)
        ? data
        : data?.posts || data?.items || data?.results || [];
      
      if (filter === "premium") {
        items = items.filter(
          (post) => post.is_premium || post.requires_purchase
        );
      }

      const normalizedQuery = searchQuery.toLowerCase();
      if (normalizedQuery) {
        items = items.filter((post) => {
          const content = String(post.content || "").toLowerCase();
          const title = String(post.title || "").toLowerCase();
          const author =
            String(post.author?.username || post.username || "").toLowerCase();
          const tags = Array.isArray(post.tags)
            ? post.tags.join(" ").toLowerCase()
            : String(post.tags || "").toLowerCase();
          return (
            content.includes(normalizedQuery) ||
            title.includes(normalizedQuery) ||
            author.includes(normalizedQuery) ||
            tags.includes(normalizedQuery)
          );
        });
      }
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

    if (accessType === "paid") {
      if (!price || Number(price) <= 0) {
        toast.error("Please enter a valid price for paid content");
        return;
      }
      if (!paymentStatus?.payment_setup_completed) {
        toast.error("Please set up your payment account first");
        return;
      }
    }

    setCreating(true);
    try {
      const postData = {
        content: postContent,
        post_type: "tip",
        is_premium: accessType === "premium",
        requires_purchase: accessType === "paid",
      };
      if (accessType === "paid") {
        postData.price = Number(price);
      }
      
      // Add image if uploaded
      if (selectedImage) {
        postData.image_url = selectedImage;
      }

      await createPost(postData);
      toast.success("Post created!");
      setPostContent("");
      setSelectedImage(null);
      setAccessType("free");
      setPrice("");
      loadPosts();
    } catch (error) {
      console.error("Failed to create post:", error);
      toast.error("Failed to create post");
    } finally {
      setCreating(false);
    }
  };

  const handleTradeSignalSubmit = async (signalData) => {
    if (signalData.requires_purchase) {
      if (!signalData.price || Number(signalData.price) <= 0) {
        toast.error("Please enter a valid price for paid content");
        return;
      }
      if (!paymentStatus?.payment_setup_completed) {
        toast.error("Please set up your payment account first");
        return;
      }
    }

    const payload = { ...signalData };
    if (!payload.requires_purchase) {
      delete payload.price;
    }

    await createPost(payload);
    loadPosts();
  };

  const handleArticleSubmit = async (articleData) => {
    if (articleData.requires_purchase) {
      if (!articleData.price || Number(articleData.price) <= 0) {
        toast.error("Please enter a valid price for paid content");
        return;
      }
      if (!paymentStatus?.payment_setup_completed) {
        toast.error("Please set up your payment account first");
        return;
      }
    }

    const payload = { ...articleData };
    if (!payload.requires_purchase) {
      delete payload.price;
    }

    await createPost(payload);
    loadPosts();
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // In production, upload to storage service
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
        toast.success("Image attached!");
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePostUpdate = (updatedPost) => {
    if (!updatedPost) {
      loadPosts();
      return;
    }
    setPosts((prev) => {
      const filtered = prev.filter((post) => post.id !== updatedPost.id);
      return [updatedPost, ...filtered];
    });
  };

  return (
    <div className="max-w-7xl mx-auto relative min-h-screen">
        {/* Login Overlay */}
        {!user && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/60 backdrop-blur-md p-4 pt-20">
           <div className="bg-card border border-border p-8 rounded-2xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-300">
              {/* Logo & Title */}
              <div className="text-center mb-8">
                 <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-glow-primary">
                    <Zap className="w-8 h-8 text-white" />
                 </div>
                 <h2 className="text-2xl font-bold mb-2">Join Transfer Traders</h2>
                 <p className="text-muted-foreground">Unlock exclusive trading tips, market alerts, and community insights.</p>
              </div>
              
              {/* Login Actions */}
              <div className="space-y-4">
                 <button 
                   onClick={login}
                   className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02]"
                 >
                   <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419z"/>
                   </svg>
                   Continue with Discord
                 </button>
                 
                 <div className="relative">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border"></span></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or</span></div>
                 </div>

                 <div className="grid gap-3">
                   <input type="email" placeholder="Email address" className="bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/50 outline-none" />
                   <button className="bg-white/10 text-white py-3 rounded-xl font-semibold hover:bg-white/20 transition-all">
                     Continue with Email
                   </button>
                 </div>
              </div>
           </div>
        </div>
        )}

        <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${!user ? "blur-sm opacity-50 pointer-events-none select-none h-screen overflow-hidden" : ""}`}>
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

              {/* Pricing Options */}
              {user?.account_type === "trader" && (
                <div className="flex flex-wrap items-center gap-4 mb-3 pl-[52px]">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${accessType === "free" ? "border-brand-cyan" : "border-gray-500"}`}>
                      {accessType === "free" && <div className="w-2 h-2 rounded-full bg-brand-cyan" />}
                    </div>
                    <input
                      type="radio"
                      name="accessType"
                      value="free"
                      checked={accessType === "free"}
                      onChange={(e) => setAccessType(e.target.value)}
                      className="hidden"
                    />
                    <span className={`text-sm ${accessType === "free" ? "text-white" : "text-gray-400 group-hover:text-gray-300"}`}>Free</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${accessType === "premium" ? "border-purple-500" : "border-gray-500"}`}>
                      {accessType === "premium" && <div className="w-2 h-2 rounded-full bg-purple-500" />}
                    </div>
                    <input
                      type="radio"
                      name="accessType"
                      value="premium"
                      checked={accessType === "premium"}
                      onChange={(e) => setAccessType(e.target.value)}
                      className="hidden"
                    />
                    <span className={`text-sm font-medium ${accessType === "premium" ? "text-purple-400" : "text-gray-400 group-hover:text-purple-400/70"}`}>Premium</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${accessType === "paid" ? "border-green-500" : "border-gray-500"}`}>
                      {accessType === "paid" && <div className="w-2 h-2 rounded-full bg-green-500" />}
                    </div>
                    <input
                      type="radio"
                      name="accessType"
                      value="paid"
                      checked={accessType === "paid"}
                      onChange={(e) => setAccessType(e.target.value)}
                      className="hidden"
                    />
                    <span className={`text-sm font-medium ${accessType === "paid" ? "text-green-400" : "text-gray-400 group-hover:text-green-400/70"}`}>Paid</span>
                  </label>

                  {accessType === "paid" && (
                    <div className="flex items-center gap-2 ml-2 animate-in fade-in slide-in-from-left-5 duration-200">
                      <span className="text-sm text-gray-400">$</span>
                      <input
                        type="number"
                        placeholder="Price"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-24 bg-muted/50 border border-border rounded-lg px-3 py-1 text-sm text-white focus:outline-none focus:border-green-500 transition-all"
                        min="0.50"
                        step="0.50"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pl-13">
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors cursor-pointer">
                    <Image className="w-4 h-4" />
                    <span className="hidden sm:inline">Image</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleImageUpload}
                    />
                  </label>
                  <button 
                    onClick={() => setShowTradeModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span className="hidden sm:inline">Trade</span>
                  </button>
                  <button 
                    onClick={() => setShowArticleModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                  >
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
              
              {/* Image Preview */}
              {selectedImage && (
                <div className="mt-3 relative">
                  <img 
                    src={selectedImage} 
                    alt="Preview" 
                    className="max-h-40 rounded-lg"
                  />
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
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
                  <PostCard key={post.id} post={post} onUpdate={handlePostUpdate} />
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
            <CommunityUploads />
          </div>
        </div>

      {/* Modals */}
      <TradeSignalModal 
        isOpen={showTradeModal}
        onClose={() => setShowTradeModal(false)}
        onSubmit={handleTradeSignalSubmit}
      />
      <ArticleEditorModal 
        isOpen={showArticleModal}
        onClose={() => setShowArticleModal(false)}
        onSubmit={handleArticleSubmit}
      />
    </div>
  );
}
