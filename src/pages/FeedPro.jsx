import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Bookmark, Send, MoreVertical, Image as ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../axios';

/**
 * Professional Feed - Clean, card-based design
 */
export default function FeedPro() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('recents');
  const navigate = useNavigate();

  useEffect(() => {
    loadPosts();
  }, [filter]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/feed?filter=${filter}&limit=20`);
      setPosts(response.data.posts || []);
    } catch (error) {
      console.error('Failed to load posts:', error);
      toast.error('Failed to load feed');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      await api.post(`/api/interactions/posts/${postId}/reactions`, { reaction: 'like' });
      setPosts(posts.map(p => 
        p.id === postId 
          ? { ...p, likes_count: p.likes_count + 1, user_liked: true }
          : p
      ));
    } catch (error) {
      console.error('Like failed:', error);
    }
  };

  const handleSave = async (postId) => {
    try {
      await api.post(`/api/subscriptions/save-post/${postId}`, {});
      toast.success('Post saved!');
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-3xl shadow-lg p-6 animate-pulse">
            <div className="flex gap-3 mb-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-24" />
              </div>
            </div>
            <div className="h-64 bg-gray-200 rounded-2xl" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Feeds</h1>
          <div className="flex gap-4">
            {['recents', 'friends', 'popular'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-full font-medium transition-all ${
                  filter === f
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Create Post */}
        <div className="flex gap-3">
          <img
            src="/server-logo.png"
            alt="You"
            className="w-12 h-12 rounded-full"
          />
          <div className="flex-1 bg-gray-50 rounded-2xl p-4">
            <input
              type="text"
              placeholder="Share something..."
              className="w-full bg-transparent text-gray-900 placeholder-gray-400 outline-none mb-3"
              onClick={() => navigate('/create-post')}
              readOnly
            />
            <div className="flex items-center justify-between">
              <div className="flex gap-4">
                <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                  <ImageIcon className="w-5 h-5" />
                  <span className="text-sm font-medium">Image</span>
                </button>
              </div>
              <button className="bg-gray-900 text-white px-6 py-2 rounded-full font-semibold hover:bg-gray-800 transition-all">
                Send
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Posts */}
      {posts.map((post) => (
        <motion.div
          key={post.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
        >
          {/* Post Header */}
          <div className="p-6 pb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <img
                  src={post.author_avatar || `https://i.pravatar.cc/150?u=${post.author_id}`}
                  alt={post.author_name}
                  className="w-12 h-12 rounded-full cursor-pointer hover:ring-4 ring-gray-200 transition-all"
                  onClick={() => navigate(`/trader/${post.author_id}`)}
                />
                <div>
                  <p className="font-semibold text-gray-900 cursor-pointer hover:underline" onClick={() => navigate(`/trader/${post.author_id}`)}>
                    {post.author_name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(post.created_at).toLocaleDateString()} • {post.tier || 'free'}
                  </p>
                </div>
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-full">
                <MoreVertical className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Post Content */}
            <p className="text-gray-700 mb-4 whitespace-pre-wrap">{post.content}</p>
          </div>

          {/* Post Images */}
          {post.media_urls && post.media_urls.length > 0 && (
            <div className={`grid gap-2 px-6 pb-4 ${
              post.media_urls.length === 1 ? 'grid-cols-1' : 
              post.media_urls.length === 2 ? 'grid-cols-2' :
              'grid-cols-3'
            }`}>
              {post.media_urls.slice(0, 3).map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`Post media ${i + 1}`}
                  className="w-full h-64 object-cover rounded-2xl cursor-pointer hover:opacity-90 transition-opacity"
                />
              ))}
            </div>
          )}

          {/* Post Actions */}
          <div className="px-6 py-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <button
                  onClick={() => handleLike(post.id)}
                  className={`flex items-center gap-2 transition-all ${
                    post.user_liked
                      ? 'text-pink-500'
                      : 'text-gray-500 hover:text-pink-500'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${post.user_liked ? 'fill-current' : ''}`} />
                  <span className="text-sm font-medium">{post.likes_count || 0}</span>
                </button>
                <button className="flex items-center gap-2 text-gray-500 hover:text-blue-500 transition-all">
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">{post.comments_count || 0}</span>
                </button>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleSave(post.id)}
                  className="p-2 text-gray-500 hover:text-purple-500 hover:bg-purple-50 rounded-full transition-all"
                >
                  <Bookmark className="w-5 h-5" />
                </button>
                {post.tier !== 'free' && (
                  <button className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-5 py-2 rounded-full text-sm font-semibold hover:shadow-lg transition-all flex items-center gap-2">
                    <span>🔥</span>
                    Tip
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* View Comments Link */}
          {post.comments_count > 0 && (
            <div className="px-6 pb-4">
              <button className="text-sm text-gray-500 hover:text-gray-700 font-medium">
                View all {post.comments_count} comments
              </button>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
