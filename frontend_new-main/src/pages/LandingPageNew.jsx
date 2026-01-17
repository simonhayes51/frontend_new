import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Users,
  DollarSign,
  Zap,
  Star,
  Crown,
  MessageCircle,
  Shield,
  ArrowRight,
  Play,
  Check,
} from 'lucide-react';
import TransferTradersLogo from '../components/TransferTradersLogo';

/**
 * RADICAL LANDING PAGE - Immersive, modern, premium
 * OnlyFans meets high-end SaaS
 */
export default function LandingPage() {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-dark-bg text-white overflow-x-hidden">
      {/* Floating particles background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 bg-brand-cyan/20 rounded-full blur-3xl -top-48 -left-48 animate-float" />
        <div className="absolute w-96 h-96 bg-brand-purple/20 rounded-full blur-3xl top-1/2 -right-48 animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute w-96 h-96 bg-brand-pink/20 rounded-full blur-3xl bottom-0 left-1/3 animate-float" style={{ animationDelay: '4s' }} />
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6">
        {/* Animated gradient orbs */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute w-[600px] h-[600px] bg-gradient-brand opacity-10 rounded-full blur-3xl"
        />

        <div className="relative z-10 max-w-7xl mx-auto text-center">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center mb-8"
          >
            <TransferTradersLogo size="xl" />
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-6xl md:text-8xl font-black mb-6"
          >
            <span className="bg-gradient-brand bg-clip-text text-transparent">
              Trade Smarter.
            </span>
            <br />
            <span className="text-white">
              Earn Bigger.
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-12"
          >
            The premium platform where elite FIFA traders share exclusive insights,
            build communities, and <span className="text-brand-cyan font-semibold">monetize their expertise</span>.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
          >
            <button
              onClick={() => navigate('/feed')}
              className="group bg-gradient-brand text-white px-12 py-5 rounded-full text-xl font-bold shadow-glow-cyan hover:shadow-glow-purple transition-all flex items-center gap-3"
            >
              View Feed
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <button
              onClick={() => navigate('/discover')}
              className="bg-white/10 backdrop-blur-sm border-2 border-white/20 hover:bg-white/20 text-white px-12 py-5 rounded-full text-xl font-bold transition-all"
            >
              Discover Traders
            </button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="grid grid-cols-3 gap-8 max-w-4xl mx-auto"
          >
            <StatCard number="500+" label="Active Traders" />
            <StatCard number="$2.5M+" label="Earnings Paid" />
            <StatCard number="50K+" label="Subscribers" />
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center p-2">
            <div className="w-1 h-3 bg-gradient-brand rounded-full" />
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="relative py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-black mb-6">
              Why <span className="bg-gradient-brand bg-clip-text text-transparent">Transfer Traders</span>?
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              The only platform built specifically for FIFA Ultimate Team traders
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Users className="w-12 h-12" />}
              title="Exclusive Content"
              description="Subscribe to top traders for premium market insights, trade alerts, and investment strategies."
              gradient="from-brand-cyan to-brand-blue"
            />
            <FeatureCard
              icon={<DollarSign className="w-12 h-12" />}
              title="Monetize Skills"
              description="Turn your trading expertise into income. Set your own subscription tiers and earn from tips."
              gradient="from-brand-purple to-brand-pink"
            />
            <FeatureCard
              icon={<MessageCircle className="w-12 h-12" />}
              title="Private Messaging"
              description="Direct access to your favorite traders. Get personalized advice and build relationships."
              gradient="from-tier-elite to-yellow-500"
            />
          </div>
        </div>
      </section>

      {/* Trader Tiers Preview */}
      <section className="relative py-32 px-6 bg-gradient-to-b from-transparent via-dark-card/50 to-transparent">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-black mb-6">
              Subscription <span className="bg-gradient-purple bg-clip-text text-transparent">Tiers</span>
            </h2>
            <p className="text-xl text-gray-400">
              Choose the level that fits your trading journey
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <TierCard
              name="Basic"
              price="$4.99"
              features={[
                'All trader posts',
                'Comment access',
                'Trading tips',
                'Community chat',
              ]}
              color="basic"
            />
            <TierCard
              name="Premium"
              price="$9.99"
              features={[
                'Everything in Basic',
                'Priority DM access',
                'Weekly market reports',
                'Content requests',
                'Early trade alerts',
              ]}
              color="premium"
              popular
            />
            <TierCard
              name="Elite"
              price="$19.99"
              features={[
                'Everything in Premium',
                '1-on-1 consultations',
                'Portfolio reviews',
                'Private Discord',
                'Exclusive signals',
              ]}
              color="elite"
            />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-black mb-6">
              Trader <span className="bg-gradient-brand bg-clip-text text-transparent">Success Stories</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <TestimonialCard
              quote="Made $5K in my first month. The Premium tier is worth every penny!"
              author="@FUTKingTrader"
              role="Elite Trader"
              earnings="$12,450"
            />
            <TestimonialCard
              quote="Best trading community I've found. Subscribers actually engage and tip!"
              author="@CoinsFlipMaster"
              role="Premium Trader"
              earnings="$8,920"
            />
            <TestimonialCard
              quote="The DM feature is game-changing. Direct connection with my audience."
              author="@SBCInvestPro"
              role="Elite Trader"
              earnings="$15,330"
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-gradient-brand rounded-3xl p-16 shadow-glow-cyan"
          >
            <h2 className="text-5xl font-black text-white mb-6">
              Ready to Level Up?
            </h2>
            <p className="text-xl text-white/80 mb-10">
              Join thousands of traders building their empire
            </p>
            <button
              onClick={() => navigate('/feed')}
              className="bg-white text-brand-purple px-12 py-5 rounded-full text-xl font-bold hover:scale-105 transition-transform shadow-xl"
            >
              Start Trading Today
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto text-center text-gray-500">
          <TransferTradersLogo size="sm" className="justify-center mb-4" />
          <p>© 2026 Transfer Traders. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function StatCard({ number, label }) {
  return (
    <div className="text-center">
      <p className="text-5xl font-black bg-gradient-brand bg-clip-text text-transparent mb-2">
        {number}
      </p>
      <p className="text-gray-400">{label}</p>
    </div>
  );
}

function FeatureCard({ icon, title, description, gradient }) {
  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      className="bg-dark-card border border-white/10 rounded-3xl p-8 hover:border-white/20 transition-all cursor-pointer"
    >
      <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-6 shadow-glow-cyan`}>
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-white mb-4">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{description}</p>
    </motion.div>
  );
}

function TierCard({ name, price, features, color, popular }) {
  const colors = {
    basic: 'from-tier-basic to-tier-basic/50',
    premium: 'from-tier-premium to-tier-premium/50',
    elite: 'from-tier-elite to-tier-elite/50',
  };

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      className={`relative bg-dark-card border ${
        popular ? 'border-tier-premium shadow-glow-purple' : 'border-white/10'
      } rounded-3xl p-8 transition-all`}
    >
      {popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-purple text-white px-6 py-2 rounded-full text-sm font-bold">
          ⭐ MOST POPULAR
        </div>
      )}

      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${colors[color]} flex items-center justify-center mb-6`}>
        <Crown className="w-8 h-8 text-white" />
      </div>

      <h3 className="text-3xl font-bold text-white mb-2">{name}</h3>
      <p className="text-5xl font-black bg-gradient-brand bg-clip-text text-transparent mb-2">
        {price}
      </p>
      <p className="text-gray-500 mb-8">/month</p>

      <ul className="space-y-4 mb-8">
        {features.map((feature, idx) => (
          <li key={idx} className="flex items-start gap-3 text-gray-300">
            <Check className="w-5 h-5 text-brand-cyan flex-shrink-0 mt-0.5" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <button className="w-full bg-gradient-brand text-white py-4 rounded-xl font-bold hover:shadow-glow-cyan transition-all">
        Get Started
      </button>
    </motion.div>
  );
}

function TestimonialCard({ quote, author, role, earnings }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-dark-card border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-all"
    >
      <div className="flex items-center gap-2 mb-6">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="w-5 h-5 fill-tier-elite text-tier-elite" />
        ))}
      </div>
      
      <p className="text-lg text-gray-300 mb-6 italic">"{quote}"</p>
      
      <div className="flex items-center justify-between">
        <div>
          <p className="font-bold text-white">{author}</p>
          <p className="text-sm text-gray-500">{role}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold bg-gradient-brand bg-clip-text text-transparent">
            {earnings}
          </p>
          <p className="text-xs text-gray-500">earned</p>
        </div>
      </div>
    </motion.div>
  );
}
