import { Flame, ChevronRight } from "lucide-react";
import { TraderCard } from "./TraderCard";

const trendingTraders = [
  {
    id: "1",
    name: "CoinMaster_FC",
    username: "coinmaster",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
    verified: true,
    rating: 4.9,
    subscribers: 12500,
    winRate: 78,
    tier: "diamond",
    subscriptionPrice: 9.99,
  },
  {
    id: "2",
    name: "FC_Trader_Pro",
    username: "traderpro",
    avatar: "https://images.unsplash.com/photo-1599566150163-29194dcabd36?w=100&h=100&fit=crop",
    verified: true,
    rating: 4.7,
    subscribers: 8200,
    winRate: 72,
    tier: "platinum",
    subscriptionPrice: 7.99,
  },
  {
    id: "3",
    name: "MarketKing",
    username: "marketking",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    verified: false,
    rating: 4.5,
    subscribers: 5600,
    winRate: 68,
    tier: "gold",
    subscriptionPrice: 4.99,
  },
];

export function TrendingTraders() {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-secondary" />
          <h2 className="font-semibold text-foreground">Trending Traders</h2>
        </div>
        <button className="flex items-center gap-1 text-sm text-primary hover:underline">
          See all
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        {trendingTraders.map((trader) => (
          <TraderCard key={trader.id} trader={trader} />
        ))}
      </div>
    </div>
  );
}
