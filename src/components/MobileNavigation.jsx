import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

const MobileNavigation = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const navigationItems = [
    { 
      path: "/", 
      label: "Dashboard", 
      icon: "🏠",
      description: "Overview & stats"
    },
    { 
      path: "/add-trade", 
      label: "Add Trade", 
      icon: "➕",
      description: "Record new trade",
      isSpecial: true
    },
    { 
      path: "/trades", 
      label: "All Trades", 
      icon: "📋",
      description: "View trade history"
    },
    { 
      path: "/analytics", 
      label: "Analytics", 
      icon: "📊",
      description: "Performance insights"
    },
    { 
      path: "/player-search", 
      label: "Player Search", 
      icon: "🔍",
      description: "Find players to trade"
    },
    { 
      path: "/watchlist", 
      label: "Watchlist", 
      icon: "👁️",
      description: "Tracked players"
    },
    { 
      path: "/settings", 
      label: "Settings", 
      icon: "⚙️",
      description: "App preferences"
    },
    { 
      path: "/profile", 
      label: "Profile", 
      icon: "👤",
      description: "Your account"
    },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Menu Toggle Button - Fixed position */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed top-4 left-4 z-50 p-2.5 rounded-full shadow-lg transition-all duration-300 ${
          isOpen 
            ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white' 
            : 'bg-gray-900 text-white hover:bg-gray-800'
        }`}
        aria-label="Toggle menu"
      >
        <div className="relative w-4 h-4">
          {/* Hamburger/Close Icon Animation */}
          <span className={`absolute h-0.5 w-4 bg-current transform transition-all duration-300 ${
            isOpen ? 'rotate-45 top-1.5' : 'top-0'
          }`}></span>
          <span className={`absolute h-0.5 w-4 bg-current transform transition-all duration-300 top-1.5 ${
            isOpen ? 'opacity-0' : 'opacity-100'
          }`}></span>
          <span className={`absolute h-0.5 w-4 bg-current transform transition-all duration-300 ${
            isOpen ? '-rotate-45 top-1.5' : 'top-3'
          }`}></span>
        </div>
      </button>

      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Slide Menu */}
      <div className={`fixed top-0 left-0 h-full w-72 bg-white dark:bg-gray-900 shadow-2xl z-50 transform transition-transform duration-300 ease-out overflow-hidden ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        
        {/* Menu Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 pt-12">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-xl">⚡</span>
            </div>
            <div>
              <h2 className="text-white font-bold text-base">Trading App</h2>
              <p className="text-white/80 text-xs">EA FC Trading Dashboard</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 py-4 overflow-y-auto max-h-[calc(100vh-180px)]">
          <nav className="px-3 space-y-1">
            {navigationItems.map(({ path, label, icon, description, isSpecial }) => {
              const active = isActive(path);
              return (
                <Link
                  key={path}
                  to={path}
                  className={`group flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                    isSpecial
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md hover:shadow-lg hover:scale-[1.01]'
                      : active
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 shadow-sm'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {/* Icon Container */}
                  <div className={`p-2 rounded-lg transition-all duration-200 ${
                    isSpecial
                      ? 'bg-white/20'
                      : active 
                        ? 'bg-purple-200 dark:bg-purple-800' 
                        : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-gray-200 dark:group-hover:bg-gray-600'
                  }`}>
                    <span className="text-base">{icon}</span>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm truncate ${isSpecial ? 'text-white' : ''}`}>
                      {label}
                    </p>
                    <p className={`text-xs truncate ${
                      isSpecial 
                        ? 'text-white/80' 
                        : active 
                          ? 'text-purple-600 dark:text-purple-400' 
                          : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {description}
                    </p>
                  </div>

                  {/* Active Indicator */}
                  {active && !isSpecial && (
                    <div className="w-1.5 h-1.5 bg-purple-600 dark:bg-purple-400 rounded-full"></div>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Menu Footer */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">U</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white text-xs truncate">User Profile</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Manage account</p>
              </div>
              <button className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileNavigation;
