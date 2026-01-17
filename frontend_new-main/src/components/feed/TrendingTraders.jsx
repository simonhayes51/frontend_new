import { useState, useEffect } from "react";
import { Flame, ChevronRight } from "lucide-react";
import { TraderCard } from "./TraderCard";
import { getTraders } from "../../api/social";

export function TrendingTraders() {
  const [traders, setTraders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTraders();
  }, []);

  const loadTraders = async () => {
    try {
      const { data } = await getTraders({ verified: true, limit: 50 });
      const items = Array.isArray(data) ? data : data?.traders || [];
      
      // Map to expected format
      const formattedTraders = items
        .filter(trader => trader.user_id || trader.id || trader.trader_id) // Only include traders with valid ID
        .map(trader => ({
          id: trader.user_id || trader.id || trader.trader_id, // Fallback to id if user_id doesn't exist
          name: trader.username || trader.name || 'Anonymous',
          username: trader.username || trader.name || 'trader',
          avatar: trader.avatar_url || `https://i.pravatar.cc/150?u=${trader.user_id || trader.id || trader.trader_id || 'default'}`,
          verified: trader.verified || false,
          rating: typeof trader.avg_rating === "number" ? trader.avg_rating : 0,
          subscribers: trader.total_followers || 0,
          winRate: trader.win_rate || 0,
          tier: mapTierName(trader.tier),
          subscriptionPrice: getSubscriptionPrice(trader.tier),
          isSubscribed: trader.is_subscribed || false,
        }));

      const topByRating = [...formattedTraders].sort(
        (a, b) => (b.rating || 0) - (a.rating || 0)
      ).slice(0, 5);
      
      setTraders(topByRating);
    } catch (error) {
      console.error("Failed to load traders:", error);
    } finally {
      setLoading(false);
    }
  };

  const mapTierName = (tier) => {
    const tierMap = {
      'free': 'bronze',
      'basic': 'silver',
      'premium': 'gold',
      'elite': 'platinum',
      'diamond': 'diamond',
    };
    return tierMap[tier?.toLowerCase()] || 'bronze';
  };

  const getSubscriptionPrice = (tier) => {
    const priceMap = {
      'diamond': 9.99,
      'elite': 7.99,
      'premium': 4.99,
      'basic': 2.99,
      'free': 0,
    };
    return priceMap[tier?.toLowerCase()] || 4.99;
  };

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-muted/30 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }
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
        {traders.length > 0 ? (
          traders.map((trader) => (
            <TraderCard key={trader.id} trader={trader} />
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No traders found
          </div>
        )}
      </div>
    </div>
  );
}
