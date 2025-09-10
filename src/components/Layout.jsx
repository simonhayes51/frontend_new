// src/components/Layout.jsx – Reverted neon-lime styling + active bar + glassy sidebar

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
  User,
  GitCompare,
} from "lucide-react";

const ACCENT = "#91db32"; // neon lime

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

  const NavItem = ({ to, end, icon: Icon, label, disabled = false }) => (
    <NavLink
      to={to}
      end={end}
      onClick={(e) => {
        if (disabled) e.preventDefault();
      }}
      className={({ isActive }) =>
        [
          "group relative flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all",
          disabled
            ? "text-gray-600 cursor-not-allowed opacity-60"
            : "text-gray-300 hover:text-white hover:bg-white/5",
          isActive ? "text-white" : "",
        ].join(" ")
      }
    >
      {({ isActive }) => (
        <>
          {/* Left active bar */}
          <span
            className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r"
            style={{
              background: isActive ? ACCENT : "transparent",
              boxShadow: isActive ? `0 0 10px ${ACCENT}` : "none",
            }}
          />
          <Icon
            size={18}
            className="shrink-0"
            style={{ color: ACCENT, opacity: 0.9 }}
          />
          <span className="truncate">{label}</span>
          {/* Hover glow */}
          <span
            className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
            style={{ boxShadow: `0 0 0 1px ${ACCENT}33, 0 0 18px ${ACCENT}22 inset` }}
          />
          {/* Active ring */}
          <span
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{
              boxShadow:
                location.pathname === to
                  ? `0 0 0 1px ${ACCENT}66, 0 0 22px ${ACCENT}22 inset`
                  : "none",
            }}
          />
        </>
      )}
    </NavLink>
  );

  return (
    <div className="flex h-screen bg-black text-white">
      {/* Sidebar */}
      <aside
        className="w-72 border-r border-white/10 flex flex-col"
        style={{
          background:
            "linear-gradient(180deg, rgba(20,20,20,0.75) 0%, rgba(8,8,8,0.75) 100%)",
          backdropFilter: "blur(8px)",
        }}
      >
        {/* Logo / header */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl grid place-items-center"
              style={{
                background: `conic-gradient(from 180deg, ${ACCENT}, #1e293b 60%, ${ACCENT})`,
                boxShadow: `0 0 24px ${ACCENT}55`,
              }}
            >
              <BarChart3 size={22} className="text-black" />
            </div>
            <div className="min-w-0">
              <div className="font-extrabold text-lg tracking-wide">
                FUT Traders Hub
              </div>
              {user && (
                <div className="text-xs text-gray-400 flex items-center gap-2 truncate">
                  <span className="truncate">{user.username}</span>
                  {isPremium && (
                    <span
                      className="inline-flex items-center justify-center rounded px-1.5 py-0.5 text-[10px] font-semibold"
                      style={{
                        color: "#111",
                        backgroundColor: ACCENT,
                        boxShadow: `0 0 10px ${ACCENT}77`,
                      }}
                      title="Premium active"
                    >
                      <Crown size={10} className="mr-1" />
                      Premium
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto">
          <div className="p-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] mb-2 px-3 text-gray-400">
              Navigation
            </div>

            {/* Main */}
            <div className="space-y-1 mb-4">
              {mainNavItems.map((item) => (
                <NavItem key={item.path} to={item.path} end={item.end} icon={item.icon} label={item.label} />
              ))}
            </div>

            {/* Premium */}
            <div className="mb-4">
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] mb-2 px-3 text-gray-400">
                <Crown size={10} style={{ color: ACCENT }} />
                Premium
              </div>
              <div className="space-y-1">
                {premiumNavItems.map((item) => (
                  <NavItem
                    key={item.path}
                    to={item.path}
                    icon={item.icon}
                    label={
                      !isPremium ? (
                        <span className="flex items-center gap-2">
                          {item.label}
                          <Crown size={12} style={{ color: ACCENT }} className="ml-auto" />
                        </span>
                      ) : (
                        item.label
                      )
                    }
                    disabled={!isPremium}
                  />
                ))}
              </div>
            </div>

            {/* Bottom links */}
            <div className="space-y-1">
              {bottomNavItems.map((item) => (
                <NavItem key={item.path} to={item.path} icon={item.icon} label={item.label} />
              ))}
            </div>
          </div>
        </nav>

        {/* Footer / Billing + Logout */}
        <div className="p-3 border-t border-white/10 space-y-2">
          {isPremium ? (
            <NavLink
              to="/billing"
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all"
              style={{
                backgroundColor: "#0a2a12",
                border: `1px solid ${ACCENT}55`,
                color: ACCENT,
                boxShadow: `0 0 12px ${ACCENT}33 inset`,
              }}
            >
              <Crown size={14} />
              <span className="font-medium">Premium Active</span>
            </NavLink>
          ) : (
            <NavLink
              to="/billing"
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all"
              style={{
                background:
                  "linear-gradient(90deg, rgba(145,219,50,0.18), rgba(145,219,50,0.06))",
                border: `1px solid ${ACCENT}55`,
                color: ACCENT,
              }}
            >
              <Crown size={14} />
              <span className="font-medium">Upgrade to Premium</span>
            </NavLink>
          )}

          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-400 truncate">
              Logged in as {user?.username}
            </div>
            <button
              onClick={logout}
              className="text-xs text-gray-300 hover:text-white px-2 py-1 rounded-lg hover:bg-white/5 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-[radial-gradient(ellipse_at_top_left,rgba(145,219,50,0.08),transparent_40%),radial-gradient(ellipse_at_bottom_right,rgba(145,219,50,0.06),transparent_35%)]">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
