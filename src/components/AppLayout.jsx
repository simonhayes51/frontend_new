import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Compass,
  Users,
  MessageCircle,
  Bell,
  Wallet,
  Settings,
  TrendingUp,
  Bookmark,
  BarChart3,
  Crown,
  Zap,
  Plus,
  Search,
  Menu,
  X,
  ShoppingCart,
  History,
  Eye,
  GitCompare,
  Calculator,
  Trophy,
  UserPlus,
} from 'lucide-react';
import { TransferTradersLogoCompact } from './TransferTradersLogo';

/**
 * RADICAL NEW LAYOUT - OnlyFans meets Modern SaaS
 * Sidebar navigation, floating elements, immersive design
 */
export default function AppLayout({ user, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isTrader = user?.account_type === 'trader' || user?.is_trader;

  const navigation = [
    { name: 'Feed', path: '/', icon: Home },
    { name: 'Dashboard', path: '/dashboard', icon: BarChart3 },
    { name: 'Add Trade', path: '/add-trade', icon: Plus },
    { name: 'Trades', path: '/trades', icon: History },
    { name: 'Watchlist', path: '/watchlist', icon: Eye },
    { name: 'Trending', path: '/trending', icon: TrendingUp },
    { name: 'Player Search', path: '/player-search', icon: Search },
    { name: 'Compare', path: '/player-compare', icon: GitCompare },
    { name: 'Profit Calc', path: '/profit-calculator', icon: Calculator },
    { name: 'Messages', path: '/messages', icon: MessageCircle, badge: 3 },
    { name: 'Saved', path: '/saved-posts', icon: Bookmark },
    ...(isTrader ? [
      { name: 'Trader Dashboard', path: '/trader-dashboard', icon: Crown },
    ] : [
      { name: 'Subscriptions', path: '/subscriptions', icon: Users },
    ]),
  ];

  return (
    <div className="h-screen bg-dark-bg overflow-hidden flex">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 fixed lg:relative z-50 w-70 bg-dark-card border-r border-white/10 flex flex-col h-full transition-transform duration-300 ease-in-out`}
      >
            {/* Logo */}
            <div className="p-6 border-b border-white/10">
              <TransferTradersLogoCompact />
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {navigation.map((item) => (
                <NavItem
                  key={item.path}
                  item={item}
                  active={location.pathname === item.path}
                  onClick={() => navigate(item.path)}
                />
              ))}
            </nav>

            {/* Trader Balance Widget */}
            {isTrader && (
              <div className="p-4 border-t border-white/10">
                <div className="bg-gradient-brand rounded-2xl p-4 shadow-glow-cyan">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/80 text-sm">Total Earnings</span>
                    <Wallet className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-3xl font-bold text-white">$1,247.50</p>
                  <button className="mt-3 w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white py-2 rounded-xl text-sm font-semibold transition-all">
                    Withdraw
                  </button>
                </div>
              </div>
            )}

            {/* User Profile */}
            <div className="p-4 border-t border-white/10">
              <div className="flex items-center gap-3 cursor-pointer hover:bg-white/5 rounded-xl p-2 transition-all">
                <img
                  src={user?.avatar_url || '/server-logo.png'}
                  alt={user?.username}
                  className="w-10 h-10 rounded-full border-2 border-brand-cyan"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">{user?.username}</p>
                  <p className="text-xs text-gray-500">
                    {isTrader ? '⭐ Trader' : '👤 User'}
                  </p>
                </div>
                <Settings className="w-5 h-5 text-gray-400" />
              </div>
            </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header - Glassmorphism */}
        <header className="sticky top-0 z-40 backdrop-blur-xl bg-dark-card/80 border-b border-white/10">
          <div className="h-16 px-6 flex items-center justify-between">
            {/* Left */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 hover:bg-white/10 rounded-xl transition-all"
              >
                {sidebarOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
              </button>

              {/* Search Bar */}
              <div className="hidden md:flex items-center gap-3 bg-dark-elevated border border-white/10 rounded-full px-4 py-2 w-96 focus-within:border-brand-cyan/50 transition-all">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search traders, posts..."
                  className="flex-1 bg-transparent text-white placeholder-gray-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-3">
              {/* Post Button (Traders only) */}
              {isTrader && (
                <button
                  onClick={() => navigate('/create-post')}
                  className="bg-gradient-brand text-white px-6 py-2 rounded-full font-semibold hover:shadow-glow-cyan transition-all flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  <span className="hidden sm:inline">Post</span>
                </button>
              )}

              {/* Notifications */}
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 hover:bg-white/10 rounded-xl transition-all"
              >
                <Bell className="w-6 h-6 text-white" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              </button>
            </div>
          </div>

          {/* Notifications Dropdown */}
          <AnimatePresence>
            {notificationsOpen && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute right-6 top-20 w-96 bg-dark-card border border-white/10 rounded-2xl shadow-card-hover overflow-hidden"
              >
                <div className="p-4 border-b border-white/10">
                  <h3 className="font-bold text-white">Notifications</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {/* Placeholder notifications */}
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-all">
                      <div className="flex gap-3">
                        <div className="w-10 h-10 bg-gradient-brand rounded-full" />
                        <div className="flex-1">
                          <p className="text-white text-sm">New subscriber to your Elite tier</p>
                          <p className="text-gray-500 text-xs mt-1">2 minutes ago</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto">
          {children || <Outlet />}
        </main>
      </div>

      {/* Floating Action Button (Mobile) */}
      {isTrader && (
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/create-post')}
          className="lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-gradient-brand rounded-full shadow-glow-cyan flex items-center justify-center z-50"
        >
          <Plus className="w-6 h-6 text-white" />
        </motion.button>
      )}
    </div>
  );
}

function NavItem({ item, active, onClick }) {
  const Icon = item.icon;

  return (
    <motion.button
      whileHover={{ x: 4 }}
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative ${
        active
          ? 'bg-gradient-brand text-white shadow-glow-cyan'
          : 'text-gray-400 hover:text-white hover:bg-white/5'
      }`}
    >
      <Icon className="w-6 h-6" />
      <span className="font-semibold">{item.name}</span>
      
      {item.badge && (
        <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
          {item.badge}
        </span>
      )}

      {active && (
        <motion.div
          layoutId="activeNav"
          className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full"
        />
      )}
    </motion.button>
  );
}
