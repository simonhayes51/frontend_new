import { useState, useEffect } from "react";
import { Zap, TrendingUp, TrendingDown } from "lucide-react";
import { getFeed } from "../../api/social";

export function LiveAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
    // Refresh every 30 seconds
    const interval = setInterval(loadAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadAlerts = async () => {
    try {
      const { data } = await getFeed({ limit: 4 });
      const items = Array.isArray(data)
        ? data
        : data?.posts || data?.items || data?.results || [];
      
      // Filter for posts with trade signals
      const tradeAlerts = items
        .filter(post => post.post_type === 'quick_flip' || post.post_type === 'prediction')
        .slice(0, 4)
        .map(post => ({
          id: post.id,
          type: post.post_type === 'quick_flip' ? 'buy' : 'sell',
          player: post.player_name || post.player?.name || extractPlayerName(post.content),
          price: getAlertPrice(post),
          trader: post.author?.username || 'Unknown',
          time: formatTime(post.created_at),
        }));
      
      setAlerts(tradeAlerts);
    } catch (error) {
      console.error("Failed to load alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  const extractPlayerName = (content) => {
    // Try to extract player name from content (basic pattern matching)
    const match = content.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
    return match ? match[0] : 'Player';
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const postTime = new Date(timestamp);
    const diff = Math.floor((now - postTime) / 1000 / 60); // minutes
    
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  };

  const getAlertPrice = (post) => {
    if (post.post_type === 'quick_flip') {
      return {
        min: post.buy_range_min ?? post.buy_price ?? 0,
        max: post.buy_range_max ?? post.buy_price ?? 0,
      };
    }

    const target = post.sell_target ?? post.sell_price ?? 0;
    return { min: target, max: target };
  };

  const formatAlertPrice = (price) => {
    const min = Number(price.min) || 0;
    const max = Number(price.max) || 0;
    if (!min && !max) return 'TBD';
    const formatValue = (value) => `${(value / 1000).toFixed(0)}k`;
    if (min && max && min !== max) {
      return `${formatValue(min)} - ${formatValue(max)}`;
    }
    return formatValue(max || min);
  };

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="animate-pulse space-y-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-12 bg-muted/30 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="relative">
          <Zap className="w-5 h-5 text-primary" />
          <div className="absolute inset-0 w-5 h-5 text-primary animate-ping opacity-25">
            <Zap className="w-5 h-5" />
          </div>
        </div>
        <h2 className="font-semibold text-foreground">Live Signals</h2>
        <div className="ml-auto flex items-center gap-1.5 px-2 py-0.5 bg-success/10 border border-success/20 rounded-full">
          <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
          <span className="text-[10px] font-medium text-success">LIVE</span>
        </div>
      </div>

      <div className="space-y-2">
        {alerts.length > 0 ? (
          alerts.map((alert, index) => (
            <div
              key={alert.id}
              className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  alert.type === "buy" ? "bg-success/20" : "bg-destructive/20"
                }`}
              >
                {alert.type === "buy" ? (
                  <TrendingUp className="w-4 h-4 text-success" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-destructive" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {alert.player}
                </p>
                <p className="text-xs text-muted-foreground">
                  by @{alert.trader}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-semibold text-foreground">
                  {formatAlertPrice(alert.price)}
                </p>
                <p className="text-[10px] text-muted-foreground">{alert.time}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No recent signals
          </div>
        )}
      </div>
    </div>
  );
}
