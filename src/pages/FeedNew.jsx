import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  MessageCircle,
  Bookmark,
  Send,
  DollarSign,
  Lock,
  MoreVertical,
  TrendingUp,
  Zap,
  Crown,
  Play,
  Image as ImageIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import UserHoverCard from '../components/UserHoverCard';
import api from '../api/social';

/**
 * RADICAL FEED REDESIGN - OnlyFans/Instagram hybrid
 * Stories carousel, infinite scroll, premium content blur
 */
export default function FeedNew() {
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeStory, setActiveStory] = useState(null);
  const observerRef = useRef();

  useEffect(() => {
    loadStories();
    loadPosts(1);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadPosts(page + 1);
        }
      },
      { threshold: 0.5 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [page, hasMore, loading]);

  const loadStories = async () => {
    try {
      const response = await api.get('/api/stories');
      setStories(response.data.stories || []);
    } catch (error) {
      console.error('Failed to load stories:', error);
    }
  };

  const loadPosts = async (pageNum) => {
    setLoading(true);
    try {
      const response = await api.get(`/api/feed?page=${pageNum}&limit=10`);
      const newPosts = response.data.posts || [];
      
      if (pageNum === 1) {
        setPosts(newPosts);
      } else {
        setPosts(prev => [...prev, ...newPosts]);
      }
      
      setHasMore(newPosts.length === 10);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to load posts:', error);
      toast.error('Failed to load feed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Stories Carousel */}
      <div className="sticky top-16 z-30 bg-dark-card/95 backdrop-blur-xl border-b border-white/10 py-4">
        <div className="max-w-3xl mx-auto px-6">
          <div className="flex gap-4 overflow-x-auto scrollbar-hide">
            {/* Your Story */}
            <AddStoryButton />
            
            {/* Other Stories */}
            {stories.map((story) => (
              <StoryCircle
                key={story.id}
                story={story}
                onClick={() => setActiveStory(story)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="max-w-3xl mx-auto px-6 py-8">
        <AnimatePresence>
          {posts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <PostCard post={post} />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading / End */}
        <div ref={observerRef} className="py-8 text-center">
          {loading ? (
            <div className="w-12 h-12 border-4 border-brand-cyan/30 border-t-brand-cyan rounded-full animate-spin mx-auto" />
          ) : !hasMore ? (
            <p className="text-gray-500">You're all caught up! 🎉</p>
          ) : null}
        </div>
      </div>

      {/* Story Viewer */}
      {activeStory && (
        <StoryViewer
          story={activeStory}
          onClose={() => setActiveStory(null)}
        />
      )}
    </div>
  );
}

function AddStoryButton() {
  return (
    <button className="flex-shrink-0 flex flex-col items-center gap-2 group">
      <div className="w-16 h-16 rounded-full bg-gradient-brand flex items-center justify-center shadow-glow-cyan group-hover:scale-110 transition-transform">
        <Zap className="w-8 h-8 text-white" />
      </div>
      <span className="text-xs text-gray-400 group-hover:text-white transition-colors">Your Story</span>
    </button>
  );
}

function StoryCircle({ story, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 flex flex-col items-center gap-2 group"
    >
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-brand rounded-full p-[2px] group-hover:p-[3px] transition-all">
          <div className="w-full h-full bg-dark-bg rounded-full" />
        </div>
        <img
          src={story.avatar_url || '/server-logo.png'}
          alt={story.username}
          className="relative w-16 h-16 rounded-full border-2 border-dark-bg object-cover"
        />
        {story.unread && (
          <div className="absolute bottom-0 right-0 w-4 h-4 bg-brand-cyan border-2 border-dark-bg rounded-full" />
        )}
      </div>
      <span className="text-xs text-gray-400 group-hover:text-white transition-colors max-w-[64px] truncate">
        {story.username}
      </span>
    </button>
  );
}

function PostCard({ post }) {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [isBlurred, setIsBlurred] = useState(post.is_premium && !post.has_access);

  const handleLike = async () => {
    try {
      await api.post(`/api/interactions/posts/${post.id}/reactions`, {
        reaction_type: liked ? null : 'like',
      });
      setLiked(!liked);
    } catch (error) {
      toast.error('Failed to like post');
    }
  };

  const handleSave = async () => {
    try {
      if (saved) {
        await api.delete(`/api/subscriptions/save-post/${post.id}`);
      } else {
        await api.post(`/api/subscriptions/save-post/${post.id}`);
      }
      setSaved(!saved);
      toast.success(saved ? 'Removed from saved' : 'Saved!');
    } catch (error) {
      toast.error('Failed to save post');
    }
  };

  const handleSubscribe = () => {
    navigate(`/trader/${post.user_id}`);
  };

  return (
    <div className="bg-dark-card border border-white/10 rounded-3xl overflow-hidden mb-6 hover:border-white/20 transition-all">
      {/* Header */}
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UserHoverCard userId={post.user_id} username={post.author_username}>
            <img
              src={post.author_avatar || '/server-logo.png'}
              alt={post.author_username}
              className="w-12 h-12 rounded-full cursor-pointer border-2 border-transparent hover:border-brand-cyan transition-all"
            />
          </UserHoverCard>
          
          <div>
            <UserHoverCard userId={post.user_id} username={post.author_username}>
              <h4 className="font-bold text-white cursor-pointer hover:text-brand-cyan transition-colors flex items-center gap-2">
                {post.author_username}
                {post.verified && <Crown className="w-4 h-4 text-tier-elite" />}
              </h4>
            </UserHoverCard>
            <p className="text-sm text-gray-500">
              {new Date(post.created_at).toLocaleDateString()} • {post.post_type}
            </p>
          </div>
        </div>

        {post.is_premium && (
          <div className="bg-gradient-purple text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1 shadow-glow-purple">
            <Lock className="w-3 h-3" />
            PREMIUM
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-6 pb-4">
        <div className={`relative ${isBlurred ? 'filter blur-md select-none' : ''}`}>
          <p className="text-gray-200 whitespace-pre-wrap leading-relaxed mb-4">
            {post.content}
          </p>

          {/* Trading Card */}
          {post.player_name && (
            <div className="bg-gradient-to-br from-dark-elevated to-dark-bg border border-white/10 rounded-2xl p-6 mb-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Player</p>
                  <p className="font-bold text-white">{post.player_name}</p>
                </div>
                {post.buy_range_min && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Buy Range</p>
                    <p className="font-bold text-green-400">
                      {post.buy_range_min}
                      {post.buy_range_max && ` - ${post.buy_range_max}`}
                    </p>
                  </div>
                )}
                {post.sell_target && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Sell Target</p>
                    <p className="font-bold text-blue-400">{post.sell_target}</p>
                  </div>
                )}
                {post.confidence_level && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Confidence</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-dark-bg rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-brand"
                          style={{ width: `${post.confidence_level}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-white">{post.confidence_level}%</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Premium Unlock Overlay */}
        {isBlurred && (
          <div className="absolute inset-0 flex items-center justify-center bg-dark-bg/50 backdrop-blur-sm rounded-2xl">
            <div className="text-center p-8">
              <Lock className="w-16 h-16 text-brand-cyan mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">Premium Content</h3>
              <p className="text-gray-400 mb-6">Subscribe to unlock exclusive insights</p>
              <button
                onClick={handleSubscribe}
                className="bg-gradient-brand text-white px-8 py-3 rounded-full font-bold hover:shadow-glow-cyan transition-all"
              >
                Subscribe Now
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-6 pb-6">
        <div className="flex items-center gap-6 mb-4">
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 transition-all group ${
              liked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'
            }`}
          >
            <Heart className={`w-7 h-7 ${liked ? 'fill-current' : 'group-hover:scale-110'} transition-transform`} />
            <span className="font-semibold">{post.likes_count || 0}</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-2 text-gray-400 hover:text-brand-cyan transition-all group"
          >
            <MessageCircle className="w-7 h-7 group-hover:scale-110 transition-transform" />
            <span className="font-semibold">{post.comments_count || 0}</span>
          </button>

          <button
            onClick={handleSave}
            className={`flex items-center gap-2 transition-all ${
              saved ? 'text-brand-purple' : 'text-gray-400 hover:text-brand-purple'
            }`}
          >
            <Bookmark className={`w-7 h-7 ${saved ? 'fill-current' : ''}`} />
          </button>

          <div className="flex-1" />

          <button className="flex items-center gap-2 text-gray-400 hover:text-tier-elite transition-all group">
            <DollarSign className="w-7 h-7 group-hover:scale-110 transition-transform" />
            <span className="font-semibold">Tip</span>
          </button>
        </div>

        {/* View all comments */}
        {post.comments_count > 0 && !showComments && (
          <button
            onClick={() => setShowComments(true)}
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            View all {post.comments_count} comments
          </button>
        )}
      </div>

      {/* Comments Section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/10 px-6 py-4 bg-dark-elevated"
          >
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Add a comment..."
                className="flex-1 bg-dark-bg border border-white/10 rounded-full px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-brand-cyan transition-all"
              />
              <button className="text-brand-cyan hover:text-brand-blue transition-colors">
                <Send className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StoryViewer({ story, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div className="relative w-full max-w-md h-full bg-dark-card">
        {/* Story content placeholder */}
        <div className="w-full h-full flex items-center justify-center">
          <p className="text-white text-2xl">Story: {story.username}</p>
        </div>
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-all"
        >
          ✕
        </button>
      </div>
    </motion.div>
  );
}
