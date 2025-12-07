import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Crown, Zap, Rocket, Check, TrendingUp, Shield, MessageCircle,
  Users, Sparkles, Bot, BarChart3, Target, Award, AlertCircle
} from 'lucide-react';
import api from '../axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const PricingTiers = () => {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [loading, setLoading] = useState(null);
  const navigate = useNavigate();

  const tiers = [
    {
      id: 'basic',
      name: 'Basic',
      icon: <Shield className="w-8 h-8" />,
      color: 'slate',
      gradientFrom: 'from-slate-600',
      gradientTo: 'to-slate-500',
      borderColor: 'border-slate-500/30',
      price: {
        monthly: 0,
        yearly: 0
      },
      description: 'Essential tools to get started with FUT trading',
      features: [
        'Basic trade tracking',
        'Up to 3 watchlist items',
        '24h trending data only',
        'Basic profit/loss calculations',
        'Player search',
        'Community support'
      ],
      cta: 'Start Free',
      popular: false
    },
    {
      id: 'pro',
      name: 'Pro',
      icon: <Zap className="w-8 h-8" />,
      color: 'purple',
      gradientFrom: 'from-purple-600',
      gradientTo: 'to-purple-500',
      borderColor: 'border-purple-500/30',
      price: {
        monthly: 5,
        yearly: 50
      },
      description: 'Advanced features for serious traders',
      features: [
        'Everything in Basic',
        'AI Smart Buy suggestions',
        'Advanced analytics (Sharpe ratio, drawdown)',
        'Unlimited watchlist',
        '6h, 12h, 24h trending data',
        'Price history & charts',
        'Trade Finder',
        'Chrome extension',
        'Premium Discord role',
        'Priority support'
      ],
      cta: 'Start 7-Day Free Trial',
      popular: true,
      savings: billingCycle === 'yearly' ? 'Save £10 (17%)' : null
    },
    {
      id: 'elite',
      name: 'Elite',
      icon: <Crown className="w-8 h-8" />,
      color: 'yellow',
      gradientFrom: 'from-yellow-600',
      gradientTo: 'to-yellow-500',
      borderColor: 'border-yellow-500/30',
      price: {
        monthly: 15,
        yearly: 150
      },
      description: 'Ultimate trading power with AI copilot',
      features: [
        'Everything in Pro',
        'AI Trade Copilot (chat assistant)',
        'Portfolio Optimization Engine',
        'Market Sentiment Analysis',
        'Real-time trade alerts',
        'Market Maker Mode (bulk trading)',
        'Advanced bot configuration',
        'Leaderboard rewards & prizes',
        'Early access to new features',
        'VIP Discord access',
        'Personal trading advisor session (monthly)',
        'API access for automation'
      ],
      cta: 'Start 7-Day Free Trial',
      popular: false,
      savings: billingCycle === 'yearly' ? 'Save £30 (17%)' : null
    }
  ];

  const handleSubscribe = async (tierId) => {
    if (tierId === 'basic') {
      navigate('/');
      return;
    }

    setLoading(tierId);
    try {
      const { data } = await api.post('/api/billing/create-checkout-session', {
        tier: tierId,
        billingCycle: billingCycle
      });

      // Redirect to Stripe checkout
      window.location.href = data.checkoutUrl;
    } catch (error) {
      toast.error(error.userMessage || 'Failed to start checkout');
      setLoading(null);
    }
  };

  const getColorClasses = (tier) => {
    const colors = {
      slate: {
        bg: 'bg-slate-600',
        text: 'text-slate-400',
        border: 'border-slate-500/30',
        gradient: 'from-slate-600 to-slate-500'
      },
      purple: {
        bg: 'bg-purple-600',
        text: 'text-purple-400',
        border: 'border-purple-500/30',
        gradient: 'from-purple-600 to-purple-500'
      },
      yellow: {
        bg: 'bg-yellow-600',
        text: 'text-yellow-400',
        border: 'border-yellow-500/30',
        gradient: 'from-yellow-600 to-yellow-500'
      }
    };
    return colors[tier.color];
  };

  return (
    <div className="min-h-screen bg-[#0e1320] text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-black mb-4">
            Choose Your <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">Trading Tier</span>
          </h1>
          <p className="text-xl text-slate-400 mb-8">
            From beginner to elite trader, we have a plan for you
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-slate-900/50 p-2 rounded-xl border border-white/10">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-3 rounded-lg font-bold transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-3 rounded-lg font-bold transition-all relative ${
                billingCycle === 'yearly'
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Yearly
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                Save 17%
              </span>
            </button>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {tiers.map((tier, idx) => {
            const colors = getColorClasses(tier);
            return (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`relative bg-slate-900/50 rounded-2xl p-8 border ${
                  tier.popular ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-[#0e1320]' : 'border-white/10'
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-purple-600 to-purple-400 px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                {/* Icon */}
                <div className={`w-16 h-16 bg-gradient-to-br ${colors.gradient} rounded-2xl flex items-center justify-center mb-4`}>
                  {tier.icon}
                </div>

                {/* Name & Description */}
                <h3 className="text-2xl font-black mb-2">{tier.name}</h3>
                <p className="text-sm text-slate-400 mb-6">{tier.description}</p>

                {/* Price */}
                <div className="mb-6">
                  {tier.price[billingCycle] === 0 ? (
                    <div className="text-4xl font-black">Free</div>
                  ) : (
                    <>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black">£{tier.price[billingCycle]}</span>
                        <span className="text-slate-400">
                          /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                        </span>
                      </div>
                      {tier.savings && (
                        <p className="text-sm text-green-400 mt-1">{tier.savings}</p>
                      )}
                    </>
                  )}
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => handleSubscribe(tier.id)}
                  disabled={loading === tier.id}
                  className={`w-full bg-gradient-to-r ${colors.gradient} hover:opacity-90
                           disabled:opacity-50 disabled:cursor-not-allowed
                           rounded-xl py-3 px-6 font-bold text-white transition-all shadow-lg mb-6`}
                >
                  {loading === tier.id ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    tier.cta
                  )}
                </button>

                {/* Features */}
                <div className="space-y-3">
                  {tier.features.map((feature, fIdx) => (
                    <div key={fIdx} className="flex items-start gap-3">
                      <Check className={`w-5 h-5 ${colors.text} flex-shrink-0 mt-0.5`} />
                      <span className="text-sm text-slate-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Feature Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-slate-900/50 rounded-2xl border border-white/10 overflow-hidden mb-12"
        >
          <div className="p-6 border-b border-white/10">
            <h2 className="text-2xl font-black">Feature Comparison</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/30">
                <tr>
                  <th className="text-left p-4 font-bold">Feature</th>
                  <th className="text-center p-4 font-bold">Basic</th>
                  <th className="text-center p-4 font-bold">Pro</th>
                  <th className="text-center p-4 font-bold">Elite</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <tr>
                  <td className="p-4">Trade Tracking</td>
                  <td className="text-center p-4"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                  <td className="text-center p-4"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                  <td className="text-center p-4"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                </tr>
                <tr className="bg-slate-800/10">
                  <td className="p-4">AI Smart Buy</td>
                  <td className="text-center p-4 text-slate-600">-</td>
                  <td className="text-center p-4"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                  <td className="text-center p-4"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="p-4">Portfolio Optimizer</td>
                  <td className="text-center p-4 text-slate-600">-</td>
                  <td className="text-center p-4 text-slate-600">-</td>
                  <td className="text-center p-4"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                </tr>
                <tr className="bg-slate-800/10">
                  <td className="p-4">AI Trade Copilot</td>
                  <td className="text-center p-4 text-slate-600">-</td>
                  <td className="text-center p-4 text-slate-600">-</td>
                  <td className="text-center p-4"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="p-4">Market Sentiment</td>
                  <td className="text-center p-4 text-slate-600">-</td>
                  <td className="text-center p-4 text-slate-600">-</td>
                  <td className="text-center p-4"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-6"
        >
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-blue-400" />
            Frequently Asked Questions
          </h3>
          <div className="space-y-4">
            <div>
              <p className="font-bold text-blue-400 mb-1">Can I cancel anytime?</p>
              <p className="text-slate-300 text-sm">
                Yes! Cancel your subscription at any time from your billing page. No questions asked.
              </p>
            </div>
            <div>
              <p className="font-bold text-blue-400 mb-1">What payment methods do you accept?</p>
              <p className="text-slate-300 text-sm">
                We accept all major credit cards, debit cards, and digital wallets through Stripe.
              </p>
            </div>
            <div>
              <p className="font-bold text-blue-400 mb-1">Can I upgrade or downgrade my plan?</p>
              <p className="text-slate-300 text-sm">
                Absolutely! You can change your plan at any time. We'll prorate the difference.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PricingTiers;
