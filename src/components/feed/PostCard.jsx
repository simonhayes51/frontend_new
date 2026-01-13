import { useState } from "react";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  Lock,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Eye,
} from "lucide-react";
import { GradientButton } from "../ui/GradientButton";

export function PostCard({ post }) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <article className="bg-card border border-border rounded-xl overflow-hidden transition-all duration-300 hover:border-border/80">
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={post.trader.avatar}
                alt={post.trader.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              {post.trader.verified && (
                <CheckCircle2 className="absolute -bottom-0.5 -right-0.5 w-4 h-4 text-primary fill-primary-foreground" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">{post.trader.name}</span>
                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                  {post.trader.tier}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>@{post.trader.username}</span>
                <span>•</span>
                <span>{post.timestamp}</span>
              </div>
            </div>
          </div>
          <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        {post.isLocked ? (
          <div className="relative">
            <p className="text-muted-foreground blur-sm select-none">
              {post.content.slice(0, 100)}...
            </p>
            <div className="absolute inset-0 flex items-center justify-center bg-card/80 backdrop-blur-sm rounded-lg">
              <div className="text-center">
                <Lock className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-2">Subscribe to unlock</p>
                <GradientButton size="sm">Subscribe</GradientButton>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-foreground leading-relaxed">{post.content}</p>
        )}
      </div>

      {/* Trade Signal */}
      {post.trade && !post.isLocked && (
        <div className="mx-4 mb-3 p-3 bg-muted/50 border border-border rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  post.trade.type === "buy" ? "bg-success/20" : "bg-destructive/20"
                }`}
              >
                {post.trade.type === "buy" ? (
                  <TrendingUp className="w-5 h-5 text-success" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-destructive" />
                )}
              </div>
              <div>
                <p className="font-semibold text-foreground">{post.trade.player}</p>
                <p className="text-sm text-muted-foreground">
                  {post.trade.type === "buy" ? "Buy" : "Sell"} @ {post.trade.price.toLocaleString()} coins
                </p>
              </div>
            </div>
            {post.trade.result && (
              <div
                className={`text-right px-3 py-1.5 rounded-lg ${
                  post.trade.result.profit > 0
                    ? "bg-success/10 text-success"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                <p className="font-bold">
                  {post.trade.result.profit > 0 ? "+" : ""}
                  {post.trade.result.profit.toLocaleString()}
                </p>
                <p className="text-xs">
                  {post.trade.result.percentage > 0 ? "+" : ""}
                  {post.trade.result.percentage}%
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Image */}
      {post.image && !post.isLocked && (
        <div className="mx-4 mb-3 rounded-lg overflow-hidden">
          <img
            src={post.image}
            alt="Post content"
            className="w-full h-auto object-cover"
          />
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setLiked(!liked)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              liked ? "text-secondary bg-secondary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
            <span className="text-sm font-medium">{post.likes + (liked ? 1 : 0)}</span>
          </button>

          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm font-medium">{post.comments}</span>
          </button>

          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <Share2 className="w-4 h-4" />
            <span className="text-sm font-medium">{post.shares}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Eye className="w-3 h-3" />
            <span>{post.views.toLocaleString()}</span>
          </div>
          <button
            onClick={() => setSaved(!saved)}
            className={`p-1.5 rounded-lg transition-colors ${
              saved ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Bookmark className={`w-4 h-4 ${saved ? "fill-current" : ""}`} />
          </button>
        </div>
      </div>
    </article>
  );
}
