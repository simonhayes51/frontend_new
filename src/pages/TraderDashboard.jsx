import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  Users,
  TrendingUp,
  Calendar,
  Download,
  CreditCard,
  Award,
  Zap,
  Crown,
  Star,
  ArrowUp,
  ArrowDown,
  Settings,
  Save,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../axios';

/**
 * Transfer Traders - Trader Earnings Dashboard
 * OnlyFans-style earnings overview for traders
 */
export default function TraderDashboard() {
  const [earnings, setEarnings] = useState(null);
  const [subscribers, setSubscribers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('month'); // week, month, year, all
  const [subscriptionPrices, setSubscriptionPrices] = useState({
    basic: 2.99,
    premium: 4.99,
    elite: 9.99,
  });
  const [savingPrices, setSavingPrices] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [timeRange]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load earnings summary
      const earningsRes = await api.get(`/api/traders/earnings?range=${timeRange}`);
      setEarnings(earningsRes.data);

      // Load subscriber breakdown
      const subsRes = await api.get('/api/subscriptions/my-subscribers');
      setSubscribers(subsRes.data.subscribers || []);

      // Load recent transactions
      const txRes = await api.get('/api/traders/transactions?limit=10');
      setTransactions(txRes.data.transactions || []);

      // Load subscription stats
      const statsRes = await api.get('/api/subscriptions/my-stats');
      setStats(statsRes.data);

      // Load current subscription prices
      try {
        const pricesRes = await api.get('/api/traders/subscription-prices');
        if (pricesRes.data?.prices) {
          setSubscriptionPrices(pricesRes.data.prices);
        }
      } catch (err) {
        console.log('Using default prices');
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      toast.error('Failed to load earnings data');
    } finally {
      setLoading(false);
    }
  };

  const requestPayout = async () => {
    try {
      await api.post('/api/traders/request-payout');
      toast.success('Payout request submitted!');
      loadDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to request payout');
    }
  };

  const saveSubscriptionPrices = async () => {
    setSavingPrices(true);
    try {
      await api.post('/api/traders/subscription-prices', {
        prices: subscriptionPrices,
      });
      toast.success('Subscription prices updated!');
    } catch (error) {
      toast.error('Failed to update prices');
    } finally {
      setSavingPrices(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-cyan/30 border-t-brand-cyan rounded-full animate-spin" />
      </div>
    );
  }

  const totalEarnings = earnings?.total || 0;
  const availableBalance = earnings?.available || 0;
  const pendingBalance = earnings?.pending || 0;

  return (
    <div className="min-h-screen bg-dark-bg p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-brand bg-clip-text text-transparent">
              Earnings Dashboard
            </h1>
            <p className="text-gray-400 mt-1">Track your revenue and subscribers</p>
          </div>
          
          {/* Time Range Selector */}
          <div className="flex gap-2 bg-dark-card border border-white/10 rounded-xl p-1">
            {['week', 'month', 'year', 'all'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg capitalize transition-all ${
                  timeRange === range
                    ? 'bg-gradient-brand text-white shadow-glow-cyan'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Earnings Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <EarningsCard
            title="Total Earnings"
            amount={totalEarnings}
            change={earnings?.growth || 0}
            icon={<DollarSign className="w-6 h-6" />}
            gradient="from-brand-cyan to-brand-blue"
          />
          <EarningsCard
            title="Available Balance"
            amount={availableBalance}
            subtitle="Ready for payout"
            icon={<CreditCard className="w-6 h-6" />}
            gradient="from-brand-purple to-brand-pink"
            action={
              availableBalance > 0 && (
                <button
                  onClick={requestPayout}
                  className="mt-3 w-full bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-semibold transition-all"
                >
                  Request Payout
                </button>
              )
            }
          />
          <EarningsCard
            title="Pending"
            amount={pendingBalance}
            subtitle="Processing"
            icon={<Calendar className="w-6 h-6" />}
            gradient="from-tier-elite to-yellow-500"
          />
        </div>

        {/* Subscriber Stats */}
        <div className="grid md:grid-cols-4 gap-6">
          <StatCard
            title="Total Subscribers"
            value={stats?.total || 0}
            icon={<Users />}
            color="cyan"
          />
          <StatCard
            title="Basic Tier"
            value={stats?.tier_breakdown?.basic || 0}
            icon={<Star />}
            color="blue"
          />
          <StatCard
            title="Premium Tier"
            value={stats?.tier_breakdown?.premium || 0}
            icon={<Zap />}
            color="purple"
          />
          <StatCard
            title="Elite Tier"
            value={stats?.tier_breakdown?.elite || 0}
            icon={<Crown />}
            color="elite"
          />
        </div>

        {/* Subscription Pricing Settings */}
        <div className="bg-dark-card border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Settings className="w-6 h-6 text-brand-cyan" />
            <h3 className="text-xl font-bold text-white">Subscription Pricing</h3>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* Basic Tier */}
            <div className="bg-dark-elevated border border-tier-basic/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-5 h-5 text-tier-basic" />
                <h4 className="font-bold text-white">Basic Tier</h4>
              </div>
              <div className="space-y-2">
                <label className="block text-sm text-gray-400">Monthly Price</label>
                <div className="flex items-center gap-2">
                  <span className="text-white">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={subscriptionPrices.basic}
                    onChange={(e) => setSubscriptionPrices({ ...subscriptionPrices, basic: parseFloat(e.target.value) })}
                    className="flex-1 bg-dark-bg border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-tier-basic"
                  />
                </div>
              </div>
            </div>

            {/* Premium Tier */}
            <div className="bg-dark-elevated border border-tier-premium/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-5 h-5 text-tier-premium" />
                <h4 className="font-bold text-white">Premium Tier</h4>
              </div>
              <div className="space-y-2">
                <label className="block text-sm text-gray-400">Monthly Price</label>
                <div className="flex items-center gap-2">
                  <span className="text-white">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={subscriptionPrices.premium}
                    onChange={(e) => setSubscriptionPrices({ ...subscriptionPrices, premium: parseFloat(e.target.value) })}
                    className="flex-1 bg-dark-bg border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-tier-premium"
                  />
                </div>
              </div>
            </div>

            {/* Elite Tier */}
            <div className="bg-dark-elevated border border-tier-elite/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Crown className="w-5 h-5 text-tier-elite" />
                <h4 className="font-bold text-white">Elite Tier</h4>
              </div>
              <div className="space-y-2">
                <label className="block text-sm text-gray-400">Monthly Price</label>
                <div className="flex items-center gap-2">
                  <span className="text-white">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={subscriptionPrices.elite}
                    onChange={(e) => setSubscriptionPrices({ ...subscriptionPrices, elite: parseFloat(e.target.value) })}
                    className="flex-1 bg-dark-bg border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-tier-elite"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={saveSubscriptionPrices}
            disabled={savingPrices}
            className="mt-6 w-full md:w-auto bg-gradient-brand text-white px-6 py-3 rounded-xl font-bold hover:shadow-glow-cyan transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            {savingPrices ? 'Saving...' : 'Save Pricing'}
          </button>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Transactions */}
          <div className="lg:col-span-2 bg-dark-card border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Recent Transactions</h3>
              <button className="text-brand-cyan hover:text-brand-blue transition-colors text-sm font-semibold">
                View All
              </button>
            </div>

            <div className="space-y-3">
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No transactions yet
                </div>
              ) : (
                transactions.map((tx, idx) => (
                  <TransactionItem key={idx} transaction={tx} />
                ))
              )}
            </div>
          </div>

          {/* Top Supporters */}
          <div className="bg-dark-card border border-white/10 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-6">Top Supporters</h3>
            
            <div className="space-y-4">
              {subscribers
                .sort((a, b) => (b.total_spent || 0) - (a.total_spent || 0))
                .slice(0, 5)
                .map((subscriber, idx) => (
                  <SupporterItem key={idx} supporter={subscriber} rank={idx + 1} />
                ))}
              
              {subscribers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No subscribers yet
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Subscriber List */}
        <div className="bg-dark-card border border-white/10 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">All Subscribers</h3>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subscribers.map((subscriber, idx) => (
              <SubscriberCard key={idx} subscriber={subscriber} />
            ))}
          </div>
          
          {subscribers.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p>No subscribers yet</p>
              <p className="text-sm mt-2">Share your profile to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EarningsCard({ title, amount, change, subtitle, icon, gradient, action }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-dark-card border border-white/10 rounded-2xl p-6 hover:shadow-card-hover transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient}`}>
          {icon}
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-sm font-semibold ${
            change >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {change >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
            {Math.abs(change)}%
          </div>
        )}
      </div>

      <h3 className="text-gray-400 text-sm mb-1">{title}</h3>
      <p className="text-3xl font-bold text-white mb-1">
        ${typeof amount === 'number' ? amount.toFixed(2) : '0.00'}
      </p>
      {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      {action}
    </motion.div>
  );
}

function StatCard({ title, value, icon, color }) {
  const colors = {
    cyan: 'from-brand-cyan to-brand-blue',
    blue: 'from-brand-blue to-tier-basic',
    purple: 'from-brand-purple to-brand-pink',
    elite: 'from-tier-elite to-yellow-500',
  };

  return (
    <div className="bg-dark-card border border-white/10 rounded-xl p-4">
      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colors[color]} flex items-center justify-center mb-3`}>
        {React.cloneElement(icon, { className: 'w-5 h-5 text-white' })}
      </div>
      <p className="text-gray-400 text-sm mb-1">{title}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function TransactionItem({ transaction }) {
  const typeIcons = {
    subscription: <Users className="w-5 h-5" />,
    tip: <DollarSign className="w-5 h-5" />,
    payout: <CreditCard className="w-5 h-5" />,
  };

  const typeColors = {
    subscription: 'text-brand-cyan',
    tip: 'text-tier-elite',
    payout: 'text-brand-purple',
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all">
      <div className={`p-2 rounded-lg bg-white/5 ${typeColors[transaction.type]}`}>
        {typeIcons[transaction.type]}
      </div>
      <div className="flex-1">
        <p className="font-semibold text-white">{transaction.description}</p>
        <p className="text-sm text-gray-500">{new Date(transaction.created_at).toLocaleDateString()}</p>
      </div>
      <p className="text-lg font-bold text-green-400">
        +${transaction.amount.toFixed(2)}
      </p>
    </div>
  );
}

function SupporterItem({ supporter, rank }) {
  const medals = ['🥇', '🥈', '🥉'];
  
  return (
    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
      <span className="text-2xl">{medals[rank - 1] || '👤'}</span>
      <img
        src={supporter.avatar_url || '/server-logo.png'}
        alt={supporter.username}
        className="w-10 h-10 rounded-full"
      />
      <div className="flex-1">
        <p className="font-semibold text-white">{supporter.username}</p>
        <p className="text-xs text-gray-500">{supporter.tier} tier</p>
      </div>
      <p className="text-sm font-bold text-tier-elite">
        ${supporter.total_spent?.toFixed(2) || '0.00'}
      </p>
    </div>
  );
}

function SubscriberCard({ subscriber }) {
  const tierColors = {
    basic: 'border-tier-basic',
    premium: 'border-tier-premium',
    elite: 'border-tier-elite',
  };

  return (
    <div className={`bg-white/5 border-2 ${tierColors[subscriber.tier] || 'border-white/10'} rounded-xl p-4`}>
      <div className="flex items-center gap-3 mb-3">
        <img
          src={subscriber.avatar_url || '/server-logo.png'}
          alt={subscriber.username}
          className="w-12 h-12 rounded-full"
        />
        <div className="flex-1">
          <p className="font-semibold text-white">{subscriber.username}</p>
          <p className="text-xs text-gray-500 capitalize">{subscriber.tier} Tier</p>
        </div>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">Joined</span>
        <span className="text-white">{new Date(subscriber.subscribed_at).toLocaleDateString()}</span>
      </div>
    </div>
  );
}
