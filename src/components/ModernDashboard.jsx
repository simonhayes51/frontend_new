import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { useDashboard } from "../context/DashboardContext";
import { useSettings } from "../context/SettingsContext";
import { useAuth } from "../context/AuthContext";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import api from "../utils/axios";

const ModernDashboard = () => {
  const {
    netProfit,
    taxPaid,
    startingBalance,
    trades,
    isLoading,
    error
  } = useDashboard();

  const {
    formatCurrency,
    formatDate,
    isLoading: settingsLoading
  } = useSettings();

  const { user } = useAuth();

  const [analyticsData, setAnalyticsData] = useState(null);
  const [goals, setGoals] = useState([]);

  useEffect(() => {
    fetchAdvancedAnalytics();
    fetchGoals();
  }, []);

  const fetchAdvancedAnalytics = async () => {
    try {
      const response = await api.get("/api/analytics/advanced");
      setAnalyticsData(response.data);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    }
  };

  const fetchGoals = async () => {
    try {
      const response = await api.get("/api/goals");
      setGoals(response.data.goals);
    } catch (error) {
      console.error("Failed to fetch goals:", error);
    }
  };

  if (isLoading || settingsLoading) {
    return <ModernLoadingState />;
  }

  if (error) return <div className="text-red-400 p-6">{error}</div>;

  const stats = [
    {
      title: "Total Profit",
      value: formatCurrency(netProfit),
      change: "+12.5%",
      changeType: "positive",
      icon: "💰"
    },
    {
      title: "Amount Deposit",
      value: formatCurrency(startingBalance),
      change: "0%",
      changeType: "neutral",
      icon: "🏦"
    },
    {
      title: "Amount Spent",
      value: formatCurrency(taxPaid),
      change: "+3.2%",
      changeType: "negative",
      icon: "💸"
    },
    {
      title: "Expected Amount",
      value: formatCurrency(netProfit + startingBalance),
      change: "+8.1%",
      changeType: "positive",
      icon: "📈"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      {/* Header */}
      <header className="flex items-center justify-between p-6 border-b border-gray-700/50">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
            <img
              src="/server-logo.png"
              alt="Server Logo"
              className="w-8 h-8 rounded-full"
              onError={(e) => {
                e.currentTarget.src =
                  'https://cdn.discordapp.com/embed/avatars/0.png';
              }}
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-gray-400 text-sm">Your Personal Dashboard</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              className="bg-gray-800/50 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-purple-500"
            />
            <svg
              className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          <div className="flex items-center space-x-3">
            <img
              src={user?.avatar_url}
              alt={user?.global_name}
              className="w-10 h-10 rounded-full border-2 border-purple-500"
              onError={(e) => {
                e.currentTarget.src =
                  "https://cdn.discordapp.com/embed/avatars/0.png";
              }}
            />
            <div className="text-right">
              <p className="text-sm font-medium">
                {user?.global_name || user?.username}
              </p>
              <p className="text-xs text-gray-400">Trader</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar
            If Layout.jsx already renders DesktopSidebar/MobileNavigation,
            remove this <aside> to avoid duplicate nav. */}
        <aside className="w-64 p-6 border-r border-gray-700/50 hidden md:block">
          <nav className="space-y-2">
            {[
              { path: "/",          label: "Dashboard",  icon: "📊" },
              { path: "/add-trade", label: "Add Trade",  icon: "➕" },
              { path: "/trades",    label: "Trades",     icon: "📋" },
              { path: "/profile",   label: "Profile",    icon: "👤" },
              { path: "/analytics", label: "Analytics",  icon: "📈" },
              { path: "/settings",  label: "Settings",   icon: "⚙️" }
            ].map(({ path, label, icon }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-purple-600/20 text-purple-300 border-r-2 border-purple-500"
                      : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                  }`
                }
                end={path === "/"} // exact match for root
              >
                <span>{icon}</span>
                <span className="text-sm">{label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="text-2xl">{stat.icon}</div>
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-gray-400 text-sm font-medium mb-2">
                  {stat.title}
                </h3>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {stat.value}
                    </p>
                    <p
                      className={`text-sm flex items-center space-x-1 ${
                        stat.changeType === "positive"
                          ? "text-green-400"
                          : stat.changeType === "negative"
                          ? "text-red-400"
                          : "text-gray-400"
                      }`}
                    >
                      <span>{stat.change}</span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart Section */}
            <div className="lg:col-span-2 bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Spent</h2>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full" />
                    <span className="text-sm text-gray-400">Daily Expenses</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                    <span className="text-sm text-gray-400">Car Insurance</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full" />
                    <span className="text-sm text-gray-400">Health</span>
                  </div>
                </div>
                <select className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1 text-sm">
                  <option>Last 7 Days</option>
                  <option>Last 30 Days</option>
                  <option>Last 90 Days</option>
                </select>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analyticsData?.daily_profits || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1F2937",
                        border: "1px solid #374151",
                        borderRadius: "12px"
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="daily_profit"
                      stroke="#EF4444"
                      strokeWidth={3}
                      dot={{ fill: "#EF4444", strokeWidth: 2, r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="trades_count"
                      stroke="#10B981"
                      strokeWidth={3}
                      dot={{ fill: "#10B981", strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Activity Sidebar */}
            <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">History</h2>
                <button className="text-purple-400 text-sm hover:text-purple-300">
                  View All
                </button>
              </div>

              <div className="space-y-4">
                {trades.slice(0, 8).map((trade, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold">
                          {trade.player.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{trade.player}</p>
                        <p className="text-xs text-gray-400">{trade.version}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm font-medium ${
                          trade.profit >= 0 ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {trade.profit >= 0 ? "+" : ""}
                        {formatCurrency(trade.profit)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDate(trade.timestamp).split(",")[0]}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Upcoming Section */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Upcoming</h3>
                <div className="space-y-3">
                  {goals.slice(0, 3).map((goal, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-3 p-3 bg-gray-900/30 rounded-lg"
                    >
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{goal.title}</p>
                        <p className="text-xs text-gray-400">
                          Target: {formatCurrency(goal.target_amount)}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400">
                        {goal.target_date}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

const ModernLoadingState = () => (
  <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white flex items-center justify-center">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4" />
      <p className="text-gray-400">Loading your dashboard...</p>
    </div>
  </div>
);

export default ModernDashboard;
