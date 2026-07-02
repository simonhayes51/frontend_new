import React, { useEffect, useMemo, useState } from "react";
import { Users, Star, TrendingUp, Wallet, Activity } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useDashboard } from "../context/DashboardContext";
import toast from "react-hot-toast";
import FeedPanel, { formatDate } from "../components/social/FeedPanel";
import { getRecommendedTraders, getTopRatedTraders } from "../api/social";

const StatCard = ({ label, value, icon, accent = "text-emerald-400" }) => (
  <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-4 flex items-center gap-3">
    <div className={`w-10 h-10 rounded-xl bg-slate-900/80 grid place-items-center ${accent}`}>
      {icon}
    </div>
    <div>
      <p className="text-xs text-slate-400 uppercase tracking-[0.2em]">{label}</p>
      <p className="text-lg font-semibold text-white">{value}</p>
    </div>
  </div>
);

const TraderList = ({ title, traders }) => (
  <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-4">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-sm font-semibold text-white">{title}</h3>
    </div>
    <div className="space-y-3">
      {traders.length === 0 ? (
        <p className="text-xs text-slate-400">No traders to show yet.</p>
      ) : (
        traders.map((trader) => (
          <div key={trader.id} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">
                {trader.username || trader.display_name || "Trader"}
              </p>
              <p className="text-xs text-slate-400">
                {Number(trader.rating_avg || trader.average_rating || 0).toFixed(1)} ★ •{" "}
                {trader.specialties?.[0] || "All markets"}
              </p>
            </div>
            <span className="text-xs text-emerald-300">
              {trader.subscribers || trader.followers || 0} followers
            </span>
          </div>
        ))
      )}
    </div>
  </div>
);

export default function Feed() {
  const { user } = useAuth();
  const { netProfit, trades, profile, startingBalance } = useDashboard();
  const [topRated, setTopRated] = useState([]);
  const [recommended, setRecommended] = useState([]);

  useEffect(() => {
    const loadSidebars = async () => {
      try {
        const [topRes, recRes] = await Promise.all([
          getTopRatedTraders(),
          getRecommendedTraders(),
        ]);
        const topItems = Array.isArray(topRes.data)
          ? topRes.data
          : topRes.data?.traders || topRes.data?.results || [];
        const recItems = Array.isArray(recRes.data)
          ? recRes.data
          : recRes.data?.traders || recRes.data?.results || [];
        setTopRated(topItems.slice(0, 4));
        setRecommended(recItems.slice(0, 4));
      } catch (error) {
        toast.error(error.userMessage || "Failed to load trader insights");
      }
    };

    loadSidebars();
  }, []);

  const stats = useMemo(() => {
    const totalTrades = trades?.length || 0;
    const winRate = profile?.winRate || 0;
    return [
      {
        label: "Invested",
        value: startingBalance ? `${startingBalance.toLocaleString()} coins` : "—",
        icon: <Wallet className="w-5 h-5" />,
      },
      {
        label: "Profit",
        value: `${(netProfit || 0).toLocaleString()} coins`,
        icon: <TrendingUp className="w-5 h-5" />,
        accent: netProfit >= 0 ? "text-emerald-400" : "text-red-400",
      },
      {
        label: "Trades",
        value: totalTrades,
        icon: <Users className="w-5 h-5" />,
      },
      {
        label: "Win Rate",
        value: `${winRate.toFixed(1)}%`,
        icon: <Activity className="w-5 h-5" />,
      },
    ];
  }, [netProfit, profile?.winRate, startingBalance, trades]);

  const recentTrades = useMemo(() => {
    if (!trades?.length) return [];
    return [...trades]
      .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))
      .slice(0, 4);
  }, [trades]);

  return (
    <div className="min-h-screen bg-[#0e1320] text-white p-6">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-[minmax(0,1fr)_320px] gap-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-black">Your Feed</h1>
            <p className="text-slate-400">
              Latest tips and trade alerts from the traders you follow.
            </p>
          </div>
          <FeedPanel user={user} headline="Post a trade update" />
        </div>

        <aside className="space-y-6">
          <div className="grid gap-4">
            {stats.map((stat) => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </div>

          <TraderList title="Top Rated Traders" traders={topRated} />
          <TraderList title="Suggested Traders" traders={recommended} />

          <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-4 h-4 text-yellow-400" />
              <h3 className="text-sm font-semibold">Recent Trades</h3>
            </div>
            {recentTrades.length === 0 ? (
              <p className="text-xs text-slate-400">No recent trades yet.</p>
            ) : (
              <div className="space-y-3">
                {recentTrades.map((trade) => (
                  <div key={trade.trade_id || trade.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {trade.player || trade.name || "Trade"}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatDate(trade.timestamp)}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-semibold ${
                        trade.profit >= 0 ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {trade.profit >= 0 ? "+" : ""}
                      {Number(trade.profit || 0).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
