import React, { useState } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const MobileDashboard = () => {
  const { netProfit, taxPaid, startingBalance, trades } = useDashboard();
  const { formatCurrency, formatDate } = useSettings();
  const { user } = useAuth();
  
  const grossProfit = netProfit + taxPaid;
  const profitPercentage = startingBalance > 0 ? ((netProfit / startingBalance) * 100) : 0;
  const avgProfit = trades.length > 0 ? netProfit / trades.length : 0;

  const stats = [
    { 
      title: 'Net Profit', 
      value: formatCurrency(netProfit), 
      color: netProfit >= 0 ? 'text-green-400' : 'text-red-400',
      bg: netProfit >= 0 ? 'bg-green-500/10' : 'bg-red-500/10',
      border: netProfit >= 0 ? 'border-green-500/20' : 'border-red-500/20',
      subtitle: `${profitPercentage >= 0 ? '+' : ''}${profitPercentage.toFixed(1)}%`,
      icon: netProfit >= 0 ? '📈' : '📉'
    },
    { 
      title: 'EA Tax Paid', 
      value: formatCurrency(taxPaid), 
      color: 'text-orange-400',
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/20',
      subtitle: grossProfit > 0 ? `${((taxPaid / grossProfit) * 100).toFixed(1)}% of gross` : '0%',
      icon: '🏛️'
    },
    { 
      title: 'Total Trades', 
      value: trades.length.toString(), 
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      subtitle: `Avg: ${formatCurrency(avgProfit)}`,
      icon: '🎯'
    }
  ];

  const quickActions = [
    { label: 'Add Trade', icon: '➕', path: '/add-trade', color: 'bg-green-500', darkColor: 'bg-green-600' },
    { label: 'View All Trades', icon: '📋', path: '/trades', color: 'bg-blue-500', darkColor: 'bg-blue-600' },
    { label: 'Analytics', icon: '📊', path: '/analytics', color: 'bg-purple-500', darkColor: 'bg-purple-600' },
    { label: 'Search Players', icon: '🔍', path: '/player-search', color: 'bg-indigo-500', darkColor: 'bg-indigo-600' }
  ];

  const recentTrades = trades.slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Status Bar Spacer */}
      <div className="h-4 bg-gray-900"></div>
      
      {/* Header */}
      <header className="bg-gray-900 px-6 py-4 pl-16">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <img 
                src={user?.avatar_url} 
                alt={user?.global_name}
                className="w-12 h-12 rounded-full border-2 border-purple-400"
              />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-gray-900"></div>
            </div>
            <div>
              <p className="text-white font-semibold text-lg">{user?.global_name}</p>
              <p className="text-gray-300 text-sm">Trading Dashboard</p>
            </div>
          </div>
          <button className="p-3 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors">
            <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
            </svg>
          </button>
        </div>
      </header>

      <div className="px-6 py-6 space-y-8">
        {/* Main Stats Cards */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Portfolio Overview</h2>
          {stats.map((stat, index) => (
            <div key={index} className={`${stat.bg} ${stat.border} rounded-2xl p-5 border-2 shadow-sm dark:shadow-none`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <span className="text-xl">{stat.icon}</span>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">{stat.title}</p>
                    <p className={`text-2xl font-bold ${stat.color} leading-tight`}>{stat.value}</p>
                    {stat.subtitle && (
                      <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">{stat.subtitle}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                to={action.path}
                className={`${action.color} hover:${action.darkColor} text-white rounded-2xl p-4 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 active:scale-95`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{action.icon}</span>
                  <div>
                    <p className="font-semibold text-sm">{action.label}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Trades</h3>
            <Link 
              to="/trades" 
              className="text-purple-600 dark:text-purple-400 text-sm font-medium hover:underline"
            >
              View All
            </Link>
          </div>
          
          {recentTrades.length > 0 ? (
            <div className="space-y-3">
              {recentTrades.map((trade, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center">
                          <span className="text-white text-xs font-bold">
                            {trade.player.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white text-sm">{trade.player}</p>
                          <p className="text-gray-500 dark:text-gray-400 text-xs">
                            {trade.version} • {trade.platform}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-sm ${trade.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {trade.profit >= 0 ? '+' : ''}{formatCurrency(trade.profit)}
                      </p>
                      <p className="text-gray-400 text-xs">
                        {formatDate(trade.timestamp).split(',')[0]}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📈</span>
              </div>
              <p className="text-gray-500 dark:text-gray-400 mb-4">No trades yet</p>
              <Link 
                to="/add-trade"
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
              >
                <span className="mr-2">➕</span>
                Add Your First Trade
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileDashboard;
