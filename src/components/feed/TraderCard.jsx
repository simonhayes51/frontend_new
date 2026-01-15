import { Star, TrendingUp, Users, CheckCircle2 } from "lucide-react";
import { GradientButton } from "../ui/GradientButton";
import { useNavigate } from "react-router-dom";

const tierColors = {
  bronze: "from-amber-700 to-amber-500",
  silver: "from-slate-400 to-slate-300",
  gold: "from-yellow-500 to-yellow-300",
  platinum: "from-cyan-400 to-cyan-200",
  diamond: "from-primary to-secondary",
};

const tierBadgeColors = {
  bronze: "bg-amber-600/20 text-amber-400 border-amber-500/30",
  silver: "bg-slate-500/20 text-slate-300 border-slate-400/30",
  gold: "bg-yellow-500/20 text-yellow-400 border-yellow-400/30",
  platinum: "bg-cyan-500/20 text-cyan-300 border-cyan-300/30",
  diamond: "bg-gradient-to-r from-primary/20 to-secondary/20 text-primary border-primary/30",
};

export function TraderCard({ trader }) {
  const navigate = useNavigate();

  const handleViewProfile = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const tid = trader.trader_id ?? trader.user_id ?? trader.id;
    if (!tid || tid === "undefined" || tid === "null") return;
    navigate(`/trader/${tid}`);
  };

  return (
    <div className="block group relative bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
      {/* Tier Glow Effect */}
      <div
        className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10 bg-gradient-to-r ${tierColors[trader.tier]}`}
        style={{ transform: "scale(0.95)" }}
      />

      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className={`relative rounded-full p-0.5 bg-gradient-to-br ${tierColors[trader.tier]}`}>
          <img
            src={trader.avatar}
            alt={trader.name}
            className="w-12 h-12 rounded-full object-cover border-2 border-card"
          />
          {trader.verified && (
            <CheckCircle2 className="absolute -bottom-0.5 -right-0.5 w-4 h-4 text-primary fill-primary-foreground" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground truncate">{trader.name}</h3>
            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${tierBadgeColors[trader.tier]}`}>
              {trader.tier}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">@{trader.username}</p>

          {/* Stats */}
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              <span>{trader.rating.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>{trader.subscribers.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-success" />
              <span className="text-success">{trader.winRate}%</span>
            </div>
          </div>
        </div>

        {/* Subscribe Button */}
        <div className="flex flex-col items-end gap-1">
          {trader.isSubscribed ? (
            <GradientButton variant="ghost" size="sm" onClick={handleViewProfile}>
              Subscribed
            </GradientButton>
          ) : (
            <GradientButton size="sm" onClick={handleViewProfile}>
              ${trader.subscriptionPrice}/mo
            </GradientButton>
          )}
        </div>
      </div>
    </div>
  );
}
