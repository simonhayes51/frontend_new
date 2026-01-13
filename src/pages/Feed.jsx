import { MainLayout } from "../components/layout/MainLayout";
import { PostCard } from "../components/feed/PostCard";
import { TrendingTraders } from "../components/feed/TrendingTraders";
import { LiveAlerts } from "../components/feed/LiveAlerts";
import { Image, FileText, BarChart3, Zap } from "lucide-react";
import { GradientButton } from "../components/ui/GradientButton";

const mockPosts = [
  {
    id: "1",
    trader: {
      name: "CoinMaster_FC",
      username: "coinmaster",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
      verified: true,
      tier: "Diamond",
    },
    content: "🚀 BIG OPPORTUNITY! Mbappé TOTY is dropping due to panic sells. This is the perfect time to invest. Target buy: 2.8M, Expected rise: 3.2M+ by weekend. Trust the process! 💎",
    trade: {
      type: "buy",
      player: "Mbappé TOTY",
      price: 2800000,
      prediction: "profit",
    },
    isLocked: false,
    likes: 847,
    comments: 124,
    shares: 56,
    views: 12400,
    timestamp: "2h ago",
  },
  {
    id: "2",
    trader: {
      name: "FC_Trader_Pro",
      username: "traderpro",
      avatar: "https://images.unsplash.com/photo-1599566150163-29194dcabd36?w=100&h=100&fit=crop",
      verified: true,
      tier: "Platinum",
    },
    content: "Just closed another huge trade! Haaland sold at peak. +320k profit in just 3 days. My subscribers ate good this week! 🔥 Full breakdown in premium...",
    trade: {
      type: "sell",
      player: "Haaland",
      price: 1950000,
      result: { profit: 320000, percentage: 19.6 },
    },
    isLocked: false,
    likes: 523,
    comments: 89,
    shares: 34,
    views: 8900,
    timestamp: "5h ago",
  },
  {
    id: "3",
    trader: {
      name: "MarketKing",
      username: "marketking",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
      verified: false,
      tier: "Gold",
    },
    content: "🔒 PREMIUM CONTENT: The full market analysis for next week's promo is ready. 5 players to invest in, expected ROI breakdown, and timing strategy all included...",
    isLocked: true,
    likes: 234,
    comments: 45,
    shares: 12,
    views: 4200,
    timestamp: "8h ago",
  },
  {
    id: "4",
    trader: {
      name: "TradeMaster",
      username: "trademaster",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
      verified: true,
      tier: "Diamond",
    },
    content: "Meta update incoming! Based on leaks, these players will rise: Rodri, Bellingham, and Salah. Get them now before the patch drops tomorrow. You heard it here first! 📈",
    image: "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=800&h=400&fit=crop",
    isLocked: false,
    likes: 1203,
    comments: 234,
    shares: 89,
    views: 23000,
    timestamp: "12h ago",
  },
];

export default function Feed() {
  return (
    <MainLayout>
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
                <GradientButton size="sm">Post</GradientButton>
              </div>
            </div>

            {/* Feed Tabs */}
            <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg w-fit">
              <button className="px-4 py-2 text-sm font-medium rounded-md bg-card text-foreground shadow-sm">
                For You
              </button>
              <button className="px-4 py-2 text-sm font-medium rounded-md text-muted-foreground hover:text-foreground transition-colors">
                Following
              </button>
              <button className="px-4 py-2 text-sm font-medium rounded-md text-muted-foreground hover:text-foreground transition-colors">
                Premium
              </button>
            </div>

            {/* Posts */}
            <div className="space-y-4">
              {mockPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <LiveAlerts />
            <TrendingTraders />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
