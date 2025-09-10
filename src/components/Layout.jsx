// src/components/Layout.jsx - COMPLETE WITH NAVIGATION IMPROVEMENTS

import React from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
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
  CreditCard,
  User,
  GitCompare
} from "lucide-react";

const Layout = () => {
  const { user, logout } = useAuth();
  const { isPremium } = useEntitlements();
  const location = useLocation();

  const mainNavItems = [
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
  ];

  const premiumNavItems = [
    { path: "/smart-buy", icon: Zap, label: "Smart Buy", premium: true },
    { path: "/trade-finder", icon: Target, label: "Trade Finder", premium: true },
  ];

  const bottomNavItems = [
    { path: "/profile", icon: User, label: "Profile" },
    { path: "/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="flex h-screen bg-black text-white">
      {/* Sidebar */}
      <div className="w-64 bg-gray-950 border-r border-gray-800 flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-xl flex items-center justify-center">
              <BarChart3 size={24} className="text-black" />
            </div>
            <div>
              <div className="font-bold text-lg">FUT Traders Hub</div>
              {user && (
                <div className="text-xs text-gray-400 flex items-center gap-2">
                  <span>{user.username}</span>
                  {isPremium && (
                    <span className="text-yellow-400">
                      <Crown size={10} />
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto">
          <div className="p-2">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
              Navigation
            </div>
            
            {/* Main Navigation */}
            <div className="space-y-1 mb-4">
              {mainNavItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "text-gray-300 hover:bg-gray-800 hover:text-white"
                    }`
                  }
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>

            {/* Premium Section */}
            <div className="mb-4">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3 flex items-center gap-2">
                <Crown size={10} className="text-yellow-400" />
                Premium
              </div>
              <div className="space-y-1">
                {premiumNavItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) => {
                      const baseClasses = "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors";
                      if (!isPremium) {
                        return `${baseClasses} text-gray-500 cursor-not-allowed opacity-60`;
                      }
                      return `${baseClasses} ${
                        isActive
                          ? "bg-blue-600 text-white"
                          : "text-gray-300 hover:bg-gray-800 hover:text-white"
                      }`;
                    }}
                    onClick={(e) => {
                      if (!isPremium) {
                        e.preventDefault();
                        // Could show a premium modal or redirect to billing
                      }
                    }}
                  >
                    <item.icon size={18} />
                    <span>{item.label}</span>
                    {!isPremium && <Crown size={12} className="text-yellow-400 ml-auto" />}
                  </NavLink>
                ))}
              </div>
            </div>

            {/* Bottom Navigation */}
            <div className="space-y-1">
              {bottomNavItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "text-gray-300 hover:bg-gray-800 hover:text-white"
                    }`
                  }
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </nav>

        {/* Bottom Section */}
        <div className="p-3 border-t border-gray-800 space-y-2">
          {/* Premium Status */}
          {isPremium ? (
            <NavLink
              to="/billing"
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-900/30 border border-green-500/30 text-green-300 hover:bg-green-900/50 transition-colors text-sm"
            >
              <Crown size={14} />
              <span className="font-medium">Premium Active</span>
            </NavLink>
          ) : (
            <NavLink
              to="/billing"
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 text-yellow-300 hover:from-yellow-500/30 hover:to-amber-500/30 transition-all text-sm"
            >
              <Crown size={14} />
              <span className="font-medium">Upgrade to Premium</span>
            </NavLink>
          )}

          {/* User Menu */}
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-400">
              Logged in as {user?.username}
            </div>
            <button
              onClick={logout}
              className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-gray-800 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;
