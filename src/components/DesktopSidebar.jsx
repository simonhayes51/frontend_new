// src/components/DesktopSidebar.jsx
import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEntitlements } from "../context/EntitlementsContext";
import { 
  ChevronDown, 
  ChevronUp, 
  LayoutDashboard, 
  PlusSquare, 
  ListChecks, 
  Search, 
  GitCompare, 
  Brain, 
  Bell, 
  TrendingUp, 
  Users, 
  HelpCircle,
  Settings,
  BarChart3,
  DollarSign,
  Eye,
  Zap,
  Crown,
  Star
} from "lucide-react";

const DesktopSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isPremium, features } = useEntitlements();

  // collapsed state (persisted)
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("sidebarCollapsed") || "false");
    } catch {
      return false;
    }
  });

  // user menu state
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userCardRef = useRef(null);

  // keep a CSS variable for main layout to consume
  useEffect(() => {
    const width = collapsed ? "4rem" : "16rem"; // w-16 vs w-64
    document.documentElement.style.setProperty("--sidebar-width", width);
    localStorage.setItem("sidebarCollapsed", JSON.stringify(collapsed));
  }, [collapsed]);

  // close user menu when clicking outside or navigating
  useEffect(() => {
    const onDocClick = (e) => {
      if (!userCardRef.current) return;
      if (!userCardRef.current.contains(e.target)) setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);
  useEffect(() => {
    setUserMenuOpen(false);
  }, [location.pathname]);

  // Enhanced Nav config with premium features and access checking
  const navItems = [
    { 
      path: "/", 
      label: "Dashboard", 
      icon: LayoutDashboard, 
      premium: false 
    },
    { 
      path: "/add-trade", 
      label: "Add Trade", 
      icon: PlusSquare, 
      premium: false 
    },
    { 
      path: "/trades", 
      label: "Trades", 
      icon: ListChecks, 
      premium: false 
    },
    { 
      path: "/player-search", 
      label: "Player Search", 
      icon: Search, 
      premium: false 
    },
    { 
      path: "/player-compare", 
      label: "Compare", 
      icon: GitCompare, 
      premium: false 
    },
    { 
      path: "/analytics", 
      label: "Analytics", 
      icon: BarChart3, 
      premium: false 
    },
    { 
      path: "/pricecheck", 
      label: "Price Check", 
      icon: DollarSign, 
      premium: false 
    },
    { 
      path: "/watchlist", 
      label: "Watchlist", 
      icon: Eye, 
      premium: false 
    },
    { 
      path: "/trending", 
      label: "Trending", 
      icon: TrendingUp, 
      premium: false 
    },
    { 
      path: "/squad", 
      label: "Squad Builder", 
      icon: Users, 
      premium: false 
    },
    // Premium features
    { 
      path: "/smart-buy", 
      label: "Smart Buy", 
      icon: Brain, 
      premium: true,
      feature: "smart_buy"
    },
    { 
      path: "/trade-finder", 
      label: "Trade Finder", 
      icon: Zap, 
      premium: true,
      feature: "trade_finder"
    },
    { 
      path: "/settings", 
      label: "Settings", 
      icon: Settings, 
      premium: false 
    },
  ];

  // Check if user has access to a feature
  const hasAccess = (item) => {
    if (!item.premium) return true;
    if (item.feature) return features.includes(item.feature);
    return isPremium;
  };

  const isActive = (p) => location.pathname === p;

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-gray-900/95 backdrop-blur-sm border-r border-gray-700/50
                  flex flex-col transition-all duration-200
                  ${collapsed ? "w-16 px-2" : "w-64 p-4"}`}
      style={{ overflow: "visible" }}
    >
      {/* Header / brand + toggle */}
      <div className="relative mb-6 shrink-0 flex flex-col items-center">
        {/* Logo */}
        <div
          className={`rounded-full p-[4px] bg-gradient-to-r from-green-400/80 to-blue-500/80 
                overflow-hidden aspect-square mt-2
                ${collapsed ? "w-10" : "w-16"}`}
        >
          <img
            src="/server-logo.png"
            alt="Server Logo"
            className="w-full h-full rounded-full object-cover block"
            onError={(e) => {
              e.currentTarget.src =
                'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="white" d="M12 2L13.09 8.26L22 9L13.09 15.74L12 22L10.91 15.74L2 9L10.91 8.26L12 2Z"/></svg>';
            }}
          />
        </div>

        {!collapsed && (
          <h1 className="mt-2 text-lg font-bold text-white text-center">FUT Traders Hub</h1>
        )}

        {/* Toggle */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="absolute top-1/2 -right-3 -translate-y-1/2 
                     p-1.5 rounded-md bg-gray-900 border border-gray-700
                     hover:bg-gray-800 text-gray-300 shadow-lg"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
        >
          {collapsed ? (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
            </svg>
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
            </svg>
          )}
        </button>
      </div>

      {/* User card (+ dropdown) */}
      <div
        ref={userCardRef}
        className={`relative bg-gray-800/40 rounded-xl ${collapsed ? "p-2 mb-3" : "p-3 mb-4"} shrink-0`}
      >
        <button
          type="button"
          onClick={() => setUserMenuOpen((o) => !o)}
          className={`w-full flex items-center ${collapsed ? "justify-center" : "gap-3"} text-left`}
          title="Account menu"
          aria-expanded={userMenuOpen}
        >
          <img
            src={user?.avatar_url}
            alt={user?.global_name}
            className={`${collapsed ? "w-8 h-8" : "w-10 h-10"} rounded-full border-2 border-purple-500`}
            onError={(e) => {
              e.currentTarget.src = "https://cdn.discordapp.com/embed/avatars/0.png";
            }}
          />
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate flex items-center gap-1">
                {user?.global_name || user?.username}
                {isPremium && <Crown className="w-3 h-3 text-yellow-400" />}
                {userMenuOpen ? (
                  <ChevronUp className="w-4 h-4 text-gray-400 shrink-0 ml-auto" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 ml-auto" />
                )}
              </p>
              <p className="text-xs text-gray-400">
                {isPremium ? "Premium Trader" : "Free Trader"}
              </p>
            </div>
          )}
        </button>

        {userMenuOpen && (
          <div
            className={`absolute z-50 ${
              collapsed
                ? "left-[calc(100%+8px)] top-0"
                : "left-3 right-3 top-[calc(100%+6px)]"
            }`}
          >
            <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden w-48">
              <Link
                to="/profile"
                className="block px-3 py-2 text-sm text-gray-200 hover:bg-gray-800"
              >
                Profile
              </Link>
              <Link
                to="/settings"
                className="block px-3 py-2 text-sm text-gray-200 hover:bg-gray-800"
              >
                Settings
              </Link>
              {!isPremium && (
                <Link
                  to="/billing"
                  className="block px-3 py-2 text-sm text-purple-400 hover:bg-purple-500/10 font-medium"
                >
                  <div className="flex items-center gap-2">
                    <Crown className="w-3 h-3" />
                    Upgrade to Premium
                  </div>
                </Link>
              )}
              <button
                onClick={async () => {
                  try {
                    await logout();
                    navigate("/login");
                  } catch (e) {
                    console.error(e);
                  }
                }}
                className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <nav className={`${collapsed ? "px-1" : "px-1.5"} space-y-1`}>
          {!collapsed && (
            <p className="px-2 pb-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
              Navigation
            </p>
          )}
          {navItems.map((item) => {
            const Active = isActive(item.path);
            const Icon = item.icon;
            const userHasAccess = hasAccess(item);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                aria-label={item.label}
                title={collapsed ? item.label : undefined}
                className={`group relative flex items-center rounded-lg transition-colors h-9
                            ${collapsed ? "justify-center" : "gap-2 px-2.5"}
                            ${
                              Active
                                ? "bg-purple-600/20 text-purple-300 border-r-2 border-purple-500"
                                : "text-gray-300 hover:text-white hover:bg-gray-800/60"
                            }
                            ${!userHasAccess ? "opacity-75" : ""}`}
              >
                <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                
                {/* Hide the text when collapsed to avoid truncation */}
                {!collapsed && (
                  <span className="text-sm font-medium truncate flex-1">{item.label}</span>
                )}

                {/* Premium indicators */}
                {item.premium && !collapsed && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {userHasAccess ? (
                      // User has access - show subtle premium badge
                      <div className="w-2 h-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full" />
                    ) : (
                      // User doesn't have access - show lock emoji and PRO badge
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-400 text-xs">🔒</span>
                        <div className="text-[10px] text-gray-500 font-medium bg-gray-700/50 px-1 py-0.5 rounded">
                          PRO
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Tooltip on hover (collapsed) */}
                {collapsed && (
                  <span
                    role="tooltip"
                    className="pointer-events-none absolute left-[calc(100%+8px)] top-1/2 -translate-y-1/2 
                               whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs text-white 
                               opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 z-50
                               flex items-center gap-2"
                  >
                    {item.label}
                    {item.premium && !userHasAccess && (
                      <span className="text-yellow-400">🔒</span>
                    )}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Premium Upgrade CTA (only show if user is not premium) */}
      {!isPremium && (
        <div className={`mt-4 shrink-0 ${collapsed ? "px-2" : "px-2"}`}>
          <div className={`bg-gradient-to-br from-purple-900/50 to-blue-900/50 border border-purple-500/30 rounded-xl ${collapsed ? "p-2" : "p-4"}`}>
            {collapsed ? (
              <Link
                to="/billing"
                className="w-full flex justify-center"
                title="Upgrade to Premium"
              >
                <Crown className="w-6 h-6 text-yellow-400" />
              </Link>
            ) : (
              <div className="text-center">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Crown size={16} className="text-white" />
                </div>
                <h3 className="font-semibold text-white mb-1">Go Premium</h3>
                <p className="text-xs text-gray-300 mb-3">
                  Unlock Smart Buy AI, advanced analytics, and more!
                </p>
                <Link
                  to="/billing"
                  className="w-full block py-2 px-4 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white text-sm font-medium rounded-lg transition-all duration-200 text-center"
                >
                  Upgrade Now
                </Link>
                <p className="text-xs text-gray-400 mt-2">Starting at £9.99/month</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* User Premium Status */}
      {isPremium && (
        <div className={`mt-4 shrink-0 ${collapsed ? "px-2" : "px-2"}`}>
          <div className={`bg-gradient-to-br from-green-900/50 to-blue-900/50 border border-green-500/30 rounded-xl ${collapsed ? "p-2" : "p-4"}`}>
            {collapsed ? (
              <div className="flex justify-center" title="Premium Active">
                <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                  <Crown size={12} className="text-black" />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                  <Crown size={12} className="text-black" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-green-400">Premium Active</div>
                  <div className="text-xs text-gray-400">All features unlocked</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className={`${collapsed ? "px-2 py-2" : "px-2 py-3"} border-t border-gray-700/50 shrink-0 mt-4`}>
        <div className="space-y-1">
          <Link
            to="/help"
            className={`flex items-center rounded-lg text-sm text-gray-300 hover:text-white hover:bg-gray-800/60 h-9
                        ${collapsed ? "justify-center" : "gap-2 px-2.5"}`}
            aria-label="Help & Support"
            title={collapsed ? "Help & Support" : undefined}
          >
            <HelpCircle className="w-4 h-4" aria-hidden="true" />
            {!collapsed && <span>Help &amp; Support</span>}
          </Link>
        </div>
      </div>
    </aside>
  );
};

export default DesktopSidebar;
