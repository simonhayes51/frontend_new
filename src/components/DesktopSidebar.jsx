import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ChevronDown, ChevronUp } from "lucide-react";

const DesktopSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

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

// Update to src/components/DesktopSidebar.jsx - Add Smart Buy to navigation

  const navItems = [
    { path: "/", label: "Dashboard" },
    { path: "/add-trade", label: "Add Trade" },
    { path: "/trades", label: "Trades" },
    { path: "/player-search", label: "Player Search" },
    { path: "/player-compare", label: "Compare" },    
    { path: "/smart-buy", label: "Smart Buy" }, // 👈 NEW
    { path: "/watchlist", label: "Watchlist" },
    { path: "/trending", label: "Trending" },
    { path: "/squad", label: "Squad Builder" },
  ];

  const isActive = (p) => location.pathname === p;

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-gray-900/95 backdrop-blur-sm border-r border-gray-700/50
                  flex flex-col transition-all duration-200
                  ${collapsed ? "w-16 px-2" : "w-64 p-4"}`}
      // allow the edge toggle to “stick out”
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

        {/* Title (only when expanded) */}
        {!collapsed && (
          <h1 className="mt-2 text-lg font-bold text-white text-center">FUT Traders Hub</h1>
        )}

        {/* Toggle button on sidebar edge */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="absolute top-1/2 -right-3 -translate-y-1/2 
                     p-1.5 rounded-md bg-gray-900 border border-gray-700
                     hover:bg-gray-800 text-gray-300 shadow-lg"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label="Toggle sidebar"
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
                {userMenuOpen ? (
                  <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                )}
              </p>
              <p className="text-xs text-gray-400">Trader</p>
            </div>
          )}
        </button>

        {/* Dropdown menu */}
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
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              title={collapsed ? item.label : undefined}
              className={`flex items-center rounded-lg transition-colors h-9
                          ${collapsed ? "justify-center" : "gap-2 px-2.5"}
                          ${
                            isActive(item.path)
                              ? "bg-purple-600/20 text-purple-300 border-r-2 border-purple-500"
                              : "text-gray-300 hover:text-white hover:bg-gray-800/60"
                          }`}
            >
              <span className="text-sm font-medium truncate">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* Footer (no Logout here anymore) */}
      <div className={`${collapsed ? "px-2 py-2" : "px-2 py-3"} border-t border-gray-700/50 shrink-0`}>
        <div className="space-y-1">
          <Link
            to="/help"
            className={`flex items-center rounded-lg text-sm text-gray-300 hover:text-white hover:bg-gray-800/60 h-9
                        ${collapsed ? "justify-center" : "gap-2 px-2.5"}`}
          >
            Help &amp; Support
          </Link>
        </div>
      </div>
    </aside>
  );
};

export default DesktopSidebar;
