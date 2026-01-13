import { Zap, TrendingUp, TrendingDown } from "lucide-react";

const liveAlerts = [
  {
    id: "1",
    type: "buy",
    player: "Mbappé",
    price: 2800000,
    trader: "CoinMaster_FC",
    time: "2m ago",
  },
  {
    id: "2",
    type: "sell",
    player: "Haaland",
    price: 1950000,
    trader: "FC_Trader_Pro",
    time: "5m ago",
  },
  {
    id: "3",
    type: "buy",
    player: "Rodri TOTY",
    price: 3200000,
    trader: "MarketKing",
    time: "8m ago",
  },
  {
    id: "4",
    type: "sell",
    player: "Vinícius Jr",
    price: 2100000,
    trader: "TradeMaster",
    time: "12m ago",
  },
];

export function LiveAlerts() {
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
        {liveAlerts.map((alert, index) => (
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
                {(alert.price / 1000).toFixed(0)}k
              </p>
              <p className="text-[10px] text-muted-foreground">{alert.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
