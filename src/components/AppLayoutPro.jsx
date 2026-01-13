import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home,
  MessageCircle,
  Users,
  Bookmark,
  TrendingUp,
  BarChart3,
  Plus,
  History,
  Eye,
  Search,
  GitCompare,
  Calculator,
  Settings,
  Crown,
  Bell,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * Professional Social Trading Layout
 * Clean, modern, Behance/Dribbble inspired design
 */
export default function AppLayoutPro() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isTrader = user?.account_type === 'trader' || user?.is_trader;

  const navigation = [
    { name: 'Feed', path: '/', icon: Home },
    { name: 'Dashboard', path: '/dashboard', icon: BarChart3 },
    { name: 'Messages', path: '/messages', icon: MessageCircle, badge: 3 },
    { name: 'Trades', path: '/trades', icon: History },
    { name: 'Watchlist', path: '/watchlist', icon: Eye },
    { name: 'Trending', path: '/trending', icon: TrendingUp },
    { name: 'Saved', path: '/saved-posts', icon: Bookmark },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/20 z-40 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Container */}
      <div className="max-w-[1400px] mx-auto flex gap-6 p-6">
        {/* Left Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 fixed lg:sticky top-6 left-0 z-50 w-72 h-fit bg-white rounded-3xl shadow-xl lg:shadow-lg p-6 transition-all duration-300`}
        >
          {/* Close button (mobile) */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Profile */}
          <div className="text-center mb-8">
            <div className="relative inline-block mb-4">
              <img
                src={user?.avatar_url || '/server-logo.png'}
                alt={user?.username}
                className="w-20 h-20 rounded-full border-4 border-white shadow-lg"
              />
              {isTrader && (
                <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full flex items-center justify-center border-2 border-white">
                  <Crown className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
            <h3 className="font-bold text-gray-900 text-lg">{user?.username || 'User'}</h3>
            <p className="text-gray-500 text-sm">@{user?.username?.toLowerCase() || 'user'}</p>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-gray-900 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                  {item.badge && (
                    <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Premium CTA */}
          {!user?.is_premium && (
            <div className="mt-6 p-4 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-2xl text-white">
              <Crown className="w-8 h-8 mb-2" />
              <h4 className="font-bold mb-1">Upgrade to Premium</h4>
              <p className="text-xs text-white/80 mb-3">Unlock advanced tools & insights</p>
              <button 
                onClick={() => navigate('/pricing')}
                className="w-full bg-white text-purple-600 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-gray-100 transition-all"
              >
                Upgrade Now
              </button>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {/* Mobile Header */}
          <div className="lg:hidden bg-white rounded-2xl shadow-lg p-4 mb-6 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="font-bold text-xl bg-gradient-to-r from-cyan-500 to-purple-500 bg-clip-text text-transparent">
              Transfer Traders
            </h1>
            <button className="p-2 hover:bg-gray-100 rounded-full relative">
              <Bell className="w-6 h-6" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
          </div>

          {/* Page Content */}
          <Outlet />
        </main>

        {/* Right Sidebar - Stories & Suggestions */}
        <aside className="hidden xl:block w-80 sticky top-6 h-fit space-y-6">
          {/* Stories */}
          <div className="bg-white rounded-3xl shadow-lg p-6">
            <h3 className="font-bold text-gray-900 mb-4">Stories</h3>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {[
                { name: 'Your Story', color: 'from-cyan-500 to-blue-500', add: true },
                { name: 'John Doe', color: 'from-pink-500 to-rose-500' },
                { name: 'Jane Smith', color: 'from-purple-500 to-pink-500' },
                { name: 'Mike Wilson', color: 'from-orange-500 to-red-500' },
              ].map((story, i) => (
                <div key={i} className="flex flex-col items-center gap-2 min-w-fit">
                  <div className={`p-0.5 bg-gradient-to-br ${story.color} rounded-2xl`}>
                    <div className="w-16 h-16 bg-white rounded-2xl p-0.5">
                      {story.add ? (
                        <div className="w-full h-full bg-gradient-to-br from-cyan-500 to-purple-500 rounded-xl flex items-center justify-center">
                          <Plus className="w-6 h-6 text-white" />
                        </div>
                      ) : (
                        <img
                          src={`https://i.pravatar.cc/150?img=${i}`}
                          alt={story.name}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-gray-600 font-medium text-center max-w-[70px] truncate">
                    {story.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Suggestions */}
          <div className="bg-white rounded-3xl shadow-lg p-6">
            <h3 className="font-bold text-gray-900 mb-4">Suggestions</h3>
            <div className="space-y-4">
              {[
                { name: 'EliteTrader_FC', role: 'Pro Trader', img: 1 },
                { name: 'CoinMaster', role: 'Market Expert', img: 2 },
                { name: 'SniperTrading', role: 'Flip Specialist', img: 3 },
              ].map((suggestion, i) => (
                <div key={i} className="flex items-center gap-3">
                  <img
                    src={`https://i.pravatar.cc/150?img=${suggestion.img + 10}`}
                    alt={suggestion.name}
                    className="w-12 h-12 rounded-full"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{suggestion.name}</p>
                    <p className="text-xs text-gray-500">{suggestion.role}</p>
                  </div>
                  <button className="px-4 py-1.5 bg-gray-900 text-white rounded-full text-xs font-semibold hover:bg-gray-800 transition-all">
                    Follow
                  </button>
                </div>
              ))}
              <button className="text-gray-500 text-sm font-medium hover:text-gray-700">
                See all
              </button>
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-white rounded-3xl shadow-lg p-6">
            <h3 className="font-bold text-gray-900 mb-4">Recommendations</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: 'Flipping', color: 'from-blue-400 to-cyan-400', icon: '💰' },
                { name: 'Sniping', color: 'from-purple-400 to-pink-400', icon: '🎯' },
                { name: 'Mass Bid', color: 'from-orange-400 to-red-400', icon: '📊' },
                { name: 'Investing', color: 'from-green-400 to-emerald-400', icon: '📈' },
              ].map((rec, i) => (
                <div
                  key={i}
                  className={`p-4 bg-gradient-to-br ${rec.color} rounded-2xl text-white cursor-pointer hover:scale-105 transition-transform`}
                >
                  <div className="text-2xl mb-2">{rec.icon}</div>
                  <p className="font-semibold text-sm">{rec.name}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
