// src/components/DesktopSidebar.jsx
import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEntitlements } from "../context/EntitlementsContext";
import {
  Home,
  Plus,
  BarChart3,
  Search,
  Users,
  Settings,
  TrendingUp,
  Eye,
  Zap,
  Target,
  Crown,
  User,
  GitCompare,
  Lock,
} from "lucide-react";

const DesktopSidebar = () => {
  const { user } = useAuth();
  const { isPremium } = useEntitlements();
  const navigate = useNavigate();

  const navItems = [
    { path: "/", icon: Home, label: "Dashboard", end: true },
    { path: "/add-trade", icon: Plus, label: "Add Trade" },
    { path: "/trades", icon: BarChart3, label: "Trades" },
    { path: "/player-search", icon: Search, label: "Player Search" },
    { path: "/player-compare", icon: GitCompare, label: "Compare" },
    { path: "/analytics", icon: TrendingUp, label: "Analytics" },
    { path: "/pricecheck", icon: Target, label: "Price Check" },
    { path: "/watchlist", icon: Eye, label: "Watchlist" },
    { path: "/squad", icon: Users, label: "Squad Builder" },
    { path: "/trending", icon: TrendingUp, label: "Trending" },

    // Premium features
    { path: "/smart-buy", icon: Zap, label: "Smart Buy", premium: true },
    { path: "/trade-finder", icon: Target, label: "Trade Finder", premium: true },
  ];

  const handlePremiumClick = (e, item) => {
    if (!isPremium && item.premium) {
      e.preventDefault();
      navigate("/billing");
    }
  };

  return (
    <aside className="fixed top-0 left-0 h-full w-[var(--sidebar-width)] bg-gray-950 border-r border-gray-800 flex flex-col">
      {/* Logo + user */}
      <div className="p-4 border-b border-gray-800 flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-xl flex items-center justify-center">
          <BarChart3 size={24} className="text-black" />
        </div>
        <div className="min-w-0">
          <div className="font-bold text-lg truncate">FUT Traders Hub</div>
          {user && (
            <div className="text-xs text-gray-400 flex items-center gap-1 truncate">
              <span className="truncate">{user.username}</span>
              {isPremium && <Crown size={10} className="text-yellow-400" />}
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {navItems.map((item) => {
          const isLocked = !!item.premium && !isPremium;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              onClick={(e) => handlePremiumClick(e, item)}
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white",
                  isLocked ? "opacity-70" : "",
                ].join(" ")
              }
              aria-disabled={isLocked ? "true" : "false"}
              title={isLocked ? "Premium feature — click to upgrade" : item.label}
            >
              <item.icon size={18} />
              <span className="truncate">{item.label}</span>

              {/* Lock/Crown badge when not premium */}
              {isLocked && (
                <span className="ml-auto inline-flex items-center gap-1 text-xs text-yellow-300">
                  <Lock size={14} className="opacity-90" />
                  <Crown size={12} className="opacity-90" />
                </span>
              )}
            </NavLink>
          );
        })}

        {/* Premium pill (replaces Help & Support spot) */}
        <NavLink
          to="/billing"
          className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors
                     border border-yellow-500/30 text-yellow-300
                     hover:bg-yellow-500/10 hover:text-yellow-200"
        >
          <Crown size={14} className="text-yellow-400" />
          {isPremium ? "Premium Active" : "Upgrade to Premium"}
        </NavLink>
      </nav>

      {/* Bottom utility (kept simple) */}
      <div className="p-2 border-t border-gray-800">
        <NavLink
          to="/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-gray-300 hover:bg-gray-800 hover:text-white"
        >
          <Settings size={18} />
          <span>Settings</span>
        </NavLink>
        <NavLink
          to="/profile"
          className="mt-1 flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-gray-300 hover:bg-gray-800 hover:text-white"
        >
          <User size={18} />
          <span>Profile</span>
        </NavLink>
      </div>
    </aside>
  );
};

export default DesktopSidebar;
