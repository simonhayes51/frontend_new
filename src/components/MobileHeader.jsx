import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Menu, X, ChevronDown, ChevronUp } from "lucide-react";

const MobileHeader = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const userCardRef = useRef(null);

  // Navigation items matching desktop sidebar
  const navItems = [
    { path: "/", label: "Dashboard", icon: "📊" },
    { path: "/add-trade", label: "Add Trade", icon: "➕" },
    { path: "/trades", label: "Trades", icon: "📋" },
    { path: "/player-search", label: "Player Search", icon: "🔍" },
    { path: "/player-compare", label: "Compare", icon: "⚖️" },
    { path: "/smart-buy", label: "Smart Buy", icon: "🧠" }, // 👈 NEW
    { path: "/watchlist", label: "Watchlist", icon: "👀" },
    { path: "/trending", label: "Trending", icon: "📈" },
    { path: "/squad", label: "Squad Builder", icon: "⚽" },
  ];

  const isActive = (path) => location.pathname === path;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
      if (userCardRef.current && !userCardRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close menu on navigation
  useEffect(() => {
    setIsMenuOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  return (
    <>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gray-950/95 backdrop-blur-md border-b border-gray-700/50">
        <div className="h-[env(safe-area-inset-top)]" />
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo and Brand */}
          <Link to="/" className="flex items-center gap-3">
            <div className="rounded-full p-[3px] bg-gradient-to-r from-green-400/80 to-blue-500/80 overflow-hidden w-10 h-10">
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
            <h1 className="text-lg font-bold text-white">FUT Traders Hub</h1>
          </Link>

          {/* Hamburger Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-lg bg-gray-800/40 border border-gray-700/50 hover:bg-gray-800/60 text-gray-300 transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Slide-out Menu */}
      <div
        ref={menuRef}
        className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-gray-900/95 backdrop-blur-md border-l border-gray-700/50 z-50 transform transition-transform duration-300 ease-out ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="h-[env(safe-area-inset-top)]" />

          {/* Menu Header */}
          <div className="p-4 border-b border-gray-700/50">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Menu</h2>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-800/60 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* User Card */}
          <div
            ref={userCardRef}
            className="relative bg-gray-800/40 rounded-xl m-4 p-3"
          >
            <button
              type="button"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="w-full flex items-center gap-3 text-left"
              title="Account menu"
            >
              <img
                src={user?.avatar_url}
                alt={user?.global_name}
                className="w-12 h-12 rounded-full border-2 border-purple-500"
                onError={(e) => {
                  e.currentTarget.src =
                    "https://cdn.discordapp.com/embed/avatars/0.png";
                }}
              />
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
            </button>

            {/* User Dropdown */}
            {userMenuOpen && (
              <div className="absolute left-3 right-3 top-[calc(100%+6px)] z-10">
                <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
                  <Link
                    to="/profile"
                    className="block px-3 py-2 text-sm text-gray-200 hover:bg-gray-800 transition-colors"
                  >
                    Profile
                  </Link>
                  <Link
                    to="/settings"
                    className="block px-3 py-2 text-sm text-gray-200 hover:bg-gray-800 transition-colors"
                  >
                    Settings
                  </Link>
                  <button
                    onClick={async () => {
                      try {
                        await logout();
                        setIsMenuOpen(false);
                      } catch (e) {
                        console.error(e);
                      }
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto px-4">
            <div className="space-y-1">
              <p className="px-2 pb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                Navigation
              </p>
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                    isActive(item.path)
                      ? "bg-purple-600/20 text-purple-300 border-l-4 border-purple-500"
                      : "text-gray-300 hover:text-white hover:bg-gray-800/60"
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-700/50">
            <Link
              to="/help"
              className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-gray-800/60 transition-colors"
            >
              <span className="text-lg">❓</span>
              <span>Help & Support</span>
            </Link>
          </div>

          <div className="h-[env(safe-area-inset-bottom)]" />
        </div>
      </div>

      {/* Header spacer */}
      <div className="h-[calc(60px+env(safe-area-inset-top))]" />
    </>
  );
};

export default MobileHeader;
