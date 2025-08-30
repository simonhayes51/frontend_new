import React, { useEffect, useState, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const DesktopSidebar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  // collapsed state (persisted)
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("sidebarCollapsed") || "false");
    } catch {
      return false;
    }
  });

  // keep a CSS variable for main layout to consume
  useEffect(() => {
    const width = collapsed ? "4rem" : "16rem"; // w-16 vs w-64
    document.documentElement.style.setProperty("--sidebar-width", width);
    localStorage.setItem("sidebarCollapsed", JSON.stringify(collapsed));
  }, [collapsed]);

  // ▼ User dropdown
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  useEffect(() => {
    const onDocClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // Sidebar nav (Profile/Settings/Logout removed; they’re in the dropdown)
  const navItems = [
    {
      path: "/",
      label: "Dashboard",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
        </svg>
      ),
    },
    {
      path: "/add-trade",
      label: "Add Trade",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
    },
    {
      path: "/trades",
      label: "Trades",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      path: "/player-search",
      label: "Player Search",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
    },
    {
      path: "/squad",
      label: "Squad Builder",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4l4 4-4 4-4-4 4-4z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l4 4-4 4-4-4 4-4z" />
        </svg>
      ),
    },
    {
      path: "/watchlist",
      label: "Watchlist",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
          <circle cx="12" cy="12" r="3" strokeWidth={2} />
        </svg>
      ),
    },
    {
      path: "/analytics",
      label: "Analytics",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
  ];

  const isActive = (p) => location.pathname === p;

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-gray-900/95 backdrop-blur-sm border-r border-gray-700/50
                  flex flex-col overflow-hidden transition-all duration-200
                  ${collapsed ? "w-16 px-2" : "w-64 p-4"}`}
    >
      {/* Header / brand + toggle */}
      <div className="flex items-center mb-3 shrink-0">
        <div
          className={`rounded-full p-[2px] bg-gradient-to-r from-green-400/80 to-blue-500/80 
                overflow-hidden shrink-0 aspect-square 
                ${collapsed ? "w-8 mx-auto" : "w-10 mr-2"}`}
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
          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-white truncate">FUT Dashboard</h1>
            <p className="text-[11px] text-gray-400 truncate">Trading Platform</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className={`ml-auto p-1.5 rounded-md hover:bg-gray-800/70 text-gray-300 ${collapsed ? "mr-1" : ""}`}
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

      {/* User card with arrow + dropdown */}
      <div className={`relative bg-gray-800/40 rounded-xl ${collapsed ? "p-2 mb-3" : "p-3 mb-4"} shrink-0`} ref={menuRef}>
        <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
          <img
            src={user?.avatar_url}
            alt={user?.global_name}
            className={`${collapsed ? "w-8 h-8" : "w-10 h-10"} rounded-full border-2 border-purple-500`}
            onError={(e) => {
              e.currentTarget.src = "https://cdn.discordapp.com/embed/avatars/0.png";
            }}
          />
          {!collapsed && (
            <>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.global_name || user?.username}
                </p>
                <p className="text-xs text-gray-400">Trader</p>
              </div>

              {/* Little arrow on the right */}
              <button
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Open user menu"
                className={`ml-auto p-1.5 rounded-md hover:bg-gray-700/60 text-gray-300 transition-transform ${menuOpen ? "rotate-180" : ""}`}
                title="User menu"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* Dropdown box (appears under the card) */}
        {menuOpen && !collapsed && (
          <div className="absolute left-0 right-0 mt-2 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-50">
            <Link
              to="/profile"
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-800"
            >
              Profile
            </Link>
            <Link
              to="/settings"
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-800"
            >
              Settings
            </Link>
            <button
              onClick={() => {
                setMenuOpen(false);
                logout();
              }}
              className="w-full text-left block px-4 py-2 text-sm text-red-400 hover:bg-gray-800"
            >
              Logout
            </button>
          </div>
        )}
      </div>

      {/* Scrollable middle (nav + stats) */}
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
              {item.icon}
              {!collapsed && <span className="text-sm font-medium truncate">{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* (Optional) Quick Stats block left as-is; wire up later if you want live numbers */}
      </div>

      {/* Footer (Help only) */}
      <div className={`${collapsed ? "px-2 py-2" : "px-2 py-3"} border-t border-gray-700/50 shrink-0`}>
        <Link
          to="/help"
          title="Help & Support"
          className={`flex items-center rounded-lg text-sm text-gray-300 hover:text-white hover:bg-gray-800/60 h-9
                      ${collapsed ? "justify-center" : "gap-2 px-2.5"}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {!collapsed && <span>Help & Support</span>}
        </Link>
      </div>
    </aside>
  );
};

export default DesktopSidebar;
