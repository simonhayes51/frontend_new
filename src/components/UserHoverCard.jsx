import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, 
  Users, 
  TrendingUp, 
  Lock,
  Check,
  MessageCircle,
  DollarSign 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getTraderProfile, subscribeToTrader, unsubscribeFromTrader } from '../api/social';

/**
 * User Hover Card - OnlyFans Style Profile Preview
 * Shows when hovering over a username
 */
export default function UserHoverCard({ userId, username, children, placement = "bottom" }) {
  const [isHovered, setIsHovered] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let timeout;
    if (isHovered && !profile && userId) {
      timeout = setTimeout(async () => {
        setLoading(true);
        try {
          const response = await getTraderProfile(userId);
          setProfile(response.data);
          setIsSubscribed(response.data.is_subscribed || false);
        } catch (error) {
          console.error('Failed to load profile:', error);
        } finally {
          setLoading(false);
        }
      }, 300); // Delay to avoid loading on quick hovers
    }
    return () => clearTimeout(timeout);
  }, [isHovered, userId, profile]);

  const handleSubscribe = async (e) => {
    e.stopPropagation();
    try {
      if (isSubscribed) {
        await unsubscribeFromTrader(userId);
        setIsSubscribed(false);
      } else {
        await subscribeToTrader(userId);
        setIsSubscribed(true);
      }
    } catch (error) {
      console.error('Subscribe error:', error);
    }
  };

  const handleViewProfile = () => {
    navigate(`/trader/${userId}`);
  };

  const handleMessage = (e) => {
    e.stopPropagation();
    navigate(`/messages/${userId}`);
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}

      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: placement === "bottom" ? -10 : 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: placement === "bottom" ? -10 : 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`absolute z-50 ${
              placement === "bottom" ? "top-full mt-2" : "bottom-full mb-2"
            } left-0 w-80`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div className="bg-dark-card border border-white/10 rounded-2xl shadow-card-hover overflow-hidden backdrop-blur-xl">
              {loading ? (
                <div className="p-6 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-brand-cyan/30 border-t-brand-cyan rounded-full animate-spin" />
                </div>
              ) : profile ? (
                <>
                  {/* Cover Image */}
                  <div className="h-24 bg-gradient-brand relative">
                    {profile.verified && (
                      <div className="absolute top-2 right-2 bg-brand-cyan text-dark-bg text-xs px-2 py-1 rounded-full font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Verified
                      </div>
                    )}
                  </div>

                  {/* Profile Info */}
                  <div className="p-4 -mt-10">
                    {/* Avatar */}
                    <div className="flex items-end justify-between mb-3">
                      <img
                        src={profile.avatar_url || '/server-logo.png'}
                        alt={profile.username}
                        className="w-20 h-20 rounded-full border-4 border-dark-card shadow-glow-cyan"
                      />
                      {profile.subscription_tier && (
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          profile.subscription_tier === 'elite' ? 'bg-tier-elite/20 text-tier-elite' :
                          profile.subscription_tier === 'premium' ? 'bg-tier-premium/20 text-tier-premium' :
                          'bg-tier-basic/20 text-tier-basic'
                        }`}>
                          {profile.subscription_tier.toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Username & Bio */}
                    <h3 className="text-lg font-bold text-white mb-1">{profile.username}</h3>
                    {profile.bio && (
                      <p className="text-sm text-gray-400 mb-3 line-clamp-2">{profile.bio}</p>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="text-center">
                        <div className="text-white font-bold">{profile.total_followers || 0}</div>
                        <div className="text-xs text-gray-500">Subscribers</div>
                      </div>
                      <div className="text-center">
                        <div className="text-white font-bold">{profile.total_posts || 0}</div>
                        <div className="text-xs text-gray-500">Posts</div>
                      </div>
                      <div className="text-center">
                        <div className="text-white font-bold flex items-center justify-center gap-1">
                          <Star className="w-3 h-3 text-brand-cyan fill-brand-cyan" />
                          {profile.avg_rating ? profile.avg_rating.toFixed(1) : '—'}
                        </div>
                        <div className="text-xs text-gray-500">Rating</div>
                      </div>
                    </div>

                    {/* Specialties */}
                    {profile.specialties && profile.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {profile.specialties.slice(0, 3).map((specialty, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2 py-1 bg-white/5 text-gray-400 rounded-full"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      {isSubscribed ? (
                        <>
                          <button
                            onClick={handleMessage}
                            className="flex-1 bg-gradient-brand text-white px-4 py-2 rounded-xl font-semibold hover:shadow-glow-cyan transition-all flex items-center justify-center gap-2"
                          >
                            <MessageCircle className="w-4 h-4" />
                            Message
                          </button>
                          <button
                            onClick={handleSubscribe}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={handleSubscribe}
                          className="flex-1 bg-gradient-brand text-white px-4 py-2 rounded-xl font-semibold hover:shadow-glow-cyan transition-all flex items-center justify-center gap-2"
                        >
                          <Users className="w-4 h-4" />
                          Subscribe
                        </button>
                      )}
                      <button
                        onClick={handleViewProfile}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all"
                      >
                        View
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-6 text-center text-gray-500">
                  Profile not found
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
