import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  BarChart2,
  PieChart,
  Layout,
  Check,
  AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../axios';
import { getTraderMe, updateTraderMe, getTraderAnalytics } from '../api/traders';
import { getPaymentAccountsStatus } from '../api/billing';

/**
 * Transfer Traders - Trader Earnings Dashboard
 * OnlyFans-style earnings overview for traders
 */
export default function TraderDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview'); // overview, analytics, settings
  const [earnings, setEarnings] = useState(null);
  const [subscribers, setSubscribers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('month'); // week, month, year, all
  const [profileError, setProfileError] = useState('');
  const [paymentSetupCompleted, setPaymentSetupCompleted] = useState(false);
  
  // Settings State
  const [profileData, setProfileData] = useState({
    bio: '',
    specialties: [],
    pricing: {
      basic: 2.99,
      premium: 4.99,
      elite: 9.99
    }
  });
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [timeRange]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const earningsRes = await api.get(`/api/traders/analytics?range=${timeRange}`);
      setEarnings(earningsRes.data);

      const subsRes = await api.get('/api/subscriptions/my-subscribers');
      setSubscribers(subsRes.data.subscribers || []);

      try {
        const txRes = await api.get('/api/traders/transactions?limit=10');
        setTransactions(txRes.data.transactions || []);
      } catch (error) {
        console.error('Failed to load transactions:', error);
        setTransactions([]);
      }

      const statsRes = await api.get('/api/subscriptions/my-stats');
      setStats(statsRes.data);

      try {
        const paymentRes = await getPaymentAccountsStatus();
        if (paymentRes?.data) {
          setPaymentSetupCompleted(
            paymentRes.data.payment_setup_completed === true
          );
        } else {
          setPaymentSetupCompleted(false);
        }
      } catch (error) {
        console.error('Failed to load payment status:', error);
        setPaymentSetupCompleted(false);
      }

      try {
        const profileRes = await getTraderMe();
        if (profileRes.data) {
          setProfileError('');
          setProfileData({
            bio: profileRes.data.bio || '',
            specialties: profileRes.data.specialties || [],
            pricing: profileRes.data.subscription_prices || {
              basic: 2.99,
              premium: 4.99,
              elite: 9.99
            }
          });
        }
      } catch (err) {
        if (err?.response?.status === 403 || err?.response?.status === 404) {
          setProfileError('Trader profile not found. Make sure your trader role has been approved by an admin.');
        } else {
          console.log('Using default profile settings');
        }
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      toast.error('Failed to load dashboard data');
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

  const handleSaveSettings = async () => {
    if (profileError) {
      toast.error('You need an approved trader profile before saving settings.');
      return;
    }
    setSavingSettings(true);
    try {
      await updateTraderMe({
        bio: profileData.bio,
        specialties: profileData.specialties,
        subscription_prices: profileData.pricing
      });
      toast.success('Settings updated successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to update settings');
    } finally {
      setSavingSettings(false);
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

  const specialtiesList = [
    'Flipping', 'Investments', 'SBC Solutions', 'Gameplay Tips', 
    'Icon Trading', 'Live Sniping', 'Market Analysis', 'Low Budget'
  ];

  const handleSpecialtyToggle = (spec) => {
    setProfileData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(spec)
        ? prev.specialties.filter(s => s !== spec)
        : [...prev.specialties, spec]
    }));
  };

  const pricingDisabled = !paymentSetupCompleted;

  return (
    <div className="min-h-screen bg-dark-bg p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-brand bg-clip-text text-transparent">
              Trader Dashboard
            </h1>
            <p className="text-gray-400 mt-1">Manage your business</p>
          </div>
          
          {/* Tabs */}
          <div className="flex bg-dark-card border border-white/10 rounded-xl p-1">
            {[
              { id: 'overview', label: 'Overview', icon: Layout },
              { id: 'analytics', label: 'Analytics', icon: BarChart2 },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-brand text-white shadow-glow-cyan'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fade-in">
             <div className="flex items-center justify-end">
              <div className="flex gap-2 bg-dark-card border border-white/10 rounded-xl p-1">
                {['week', 'month', 'year', 'all'].map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-4 py-2 rounded-lg capitalize transition-all ${
                      timeRange === range
                        ? 'bg-white/10 text-white'
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
          </div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === 'analytics' && (
          <div className="space-y-6 animate-fade-in">
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

            <div className="bg-dark-card border border-white/10 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-6">Audience Growth</h3>
              <div className="h-64 flex items-center justify-center text-gray-500">
                Chart placeholder (Add Chart.js or Recharts here)
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
                </div>
              )}
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
             <div className="bg-dark-card border border-white/10 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-white mb-6">Profile Settings</h3>
              {profileError && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/40 text-red-200 text-sm">
                  {profileError}
                </div>
              )}
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Trader Bio</label>
                  <textarea
                    value={profileData.bio}
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-brand-cyan transition-colors h-32 resize-none"
                    placeholder="Tell subscribers about your trading style..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Specialties</label>
                  <div className="flex flex-wrap gap-2">
                    {specialtiesList.map(spec => (
                      <button
                        key={spec}
                        onClick={() => handleSpecialtyToggle(spec)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          profileData.specialties.includes(spec)
                            ? 'bg-brand-cyan text-dark-bg'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                        disabled={!profileData.specialties.includes(spec) && profileData.specialties.length >= 3}
                      >
                        {spec}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
             </div>

             {pricingDisabled && (
              <div className="bg-yellow-500/10 border border-yellow-500/40 rounded-2xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-300 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-yellow-100">
                    Connect a payment account to enable subscription pricing.
                  </p>
                  <p className="text-xs text-yellow-100/80 mt-1">
                    Set up Stripe or PayPal in payment settings so subscribers can pay you.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('/settings/payments')}
                    className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-400 text-black text-xs font-semibold hover:bg-yellow-300 transition-colors"
                  >
                    Go to payment settings
                  </button>
                </div>
              </div>
             )}

             <div className="bg-dark-card border border-white/10 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-white mb-6">Subscription Pricing</h3>
              <p className="text-gray-400 mb-2 text-sm">Set the monthly price for each subscription tier.</p>
              <p className="text-gray-500 mb-6 text-xs">
                Subscribers pay the listed price. You receive approximately 90% after a 10% platform fee.
              </p>
              
              <div className="grid md:grid-cols-3 gap-6">
                {['basic', 'premium', 'elite'].map(tier => {
                  const priceValue = Number(profileData.pricing[tier]) || 0;
                  const netValue = priceValue * 0.9;
                  return (
                  <div key={tier} className="bg-dark-elevated border border-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3 capitalize">
                      {tier === 'basic' && <Star className="w-5 h-5 text-tier-basic" />}
                      {tier === 'premium' && <Zap className="w-5 h-5 text-tier-premium" />}
                      {tier === 'elite' && <Crown className="w-5 h-5 text-tier-elite" />}
                      <h4 className="font-bold text-white">{tier} Tier</h4>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-white">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0.99"
                          value={profileData.pricing[tier]}
                          onChange={(e) => setProfileData({
                            ...profileData,
                            pricing: { ...profileData.pricing, [tier]: parseFloat(e.target.value) }
                          })}
                          className="w-full bg-dark-bg border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-brand-cyan disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={pricingDisabled}
                        />
                      </div>
                      <div className="text-[11px] text-gray-500">
                        You receive ${netValue.toFixed(2)}{" "}
                        per month after fees.
                      </div>
                    </div>
                  </div>
                )})}
              </div>
             </div>

             <button
              onClick={handleSaveSettings}
              disabled={savingSettings}
              className="w-full bg-gradient-brand text-white font-bold py-4 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              {savingSettings ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5" /> Save Changes
                </>
              )}
            </button>
          </div>
        )}
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
