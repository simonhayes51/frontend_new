import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, Users, DollarSign, Check, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { upgradeToTrader } from '../api/traders';

export default function BecomeTrader() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    bio: '',
    specialties: [],
    pricing: {
      basic: 2.99,
      premium: 4.99,
      elite: 9.99
    }
  });

  const specialtiesList = [
    'Flipping', 'Investments', 'SBC Solutions', 'Gameplay Tips', 
    'Icon Trading', 'Live Sniping', 'Market Analysis', 'Low Budget'
  ];

  const handleSpecialtyToggle = (spec) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(spec)
        ? prev.specialties.filter(s => s !== spec)
        : [...prev.specialties, spec]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await upgradeToTrader({
        bio: formData.bio,
        specialties: formData.specialties,
        initial_pricing: formData.pricing
      });
      toast.success('Application submitted successfully!');
      navigate('/trader-dashboard');
    } catch (error) {
      console.error('Upgrade failed:', error);
      toast.error(error.response?.data?.detail || 'Failed to upgrade account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg p-6 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-dark-card border border-white/10 rounded-3xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-brand rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow-cyan">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Become a Pro Trader</h1>
          <p className="text-gray-400">Share your expertise, build a following, and earn revenue.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Trader Bio</label>
            <textarea
              required
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-brand-cyan transition-colors h-32 resize-none"
              placeholder="Tell subscribers about your trading style and experience..."
            />
          </div>

          {/* Specialties */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Specialties (Select up to 3)</label>
            <div className="flex flex-wrap gap-2">
              {specialtiesList.map(spec => (
                <button
                  key={spec}
                  type="button"
                  onClick={() => handleSpecialtyToggle(spec)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    formData.specialties.includes(spec)
                      ? 'bg-brand-cyan text-dark-bg'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                  disabled={!formData.specialties.includes(spec) && formData.specialties.length >= 3}
                >
                  {spec}
                </button>
              ))}
            </div>
          </div>

          {/* Pricing */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-4">Set Your Monthly Subscription Prices</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['basic', 'premium', 'elite'].map(tier => (
                <div key={tier} className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <div className="text-sm text-gray-400 capitalize mb-1">{tier} Tier</div>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="number"
                      step="0.01"
                      min="0.99"
                      required
                      value={formData.pricing[tier]}
                      onChange={(e) => setFormData({
                        ...formData,
                        pricing: { ...formData.pricing, [tier]: parseFloat(e.target.value) }
                      })}
                      className="w-full bg-black/20 border border-white/10 rounded-lg py-2 pl-9 pr-4 text-white focus:outline-none focus:border-brand-cyan"
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Platform fee of 10% applies to all earnings
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-brand text-white font-bold py-4 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Launch Trader Profile <Check className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
