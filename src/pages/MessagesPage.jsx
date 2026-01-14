import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Send,
  Image as ImageIcon,
  DollarSign,
  Smile,
  ArrowLeft,
  MoreVertical,
  Heart,
  Lock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../axios';

/**
 * Transfer Traders - OnlyFans Style Messaging
 * Private DM system for subscribers
 */
export default function MessagesPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const messagesEndRef = useRef(null);
  const normalizeArray = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (userId) {
      ensureConversation(userId);
    }
  }, [userId]);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }
      setSearching(true);
      try {
        const response = await api.get(`/api/messages/search?query=${encodeURIComponent(searchQuery)}`);
        setSearchResults(normalizeArray(response.data?.results || response.data?.users));
      } catch (error) {
        console.error('Failed to search users:', error);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    try {
      const response = await api.get('/api/messages/conversations');
      const list = normalizeArray(response.data?.conversations || response.data);
      setConversations(list);
      
      if (userId) {
        const chat = list.find(
          (c) => String(getConversationUserId(c)) === String(userId)
        );
        if (chat?.id) {
          setActiveConversationId(chat.id);
          setActiveChat(buildActiveChat(chat));
        }
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const ensureConversation = async (recipientId, initialContent) => {
    try {
      const response = await api.post('/api/messages/conversations', {
        recipient_id: recipientId,
        recipientId,
        user_id: recipientId,
        content: initialContent?.trim() ? initialContent.trim() : undefined,
      });
      const conversation = response.data || {};
      if (conversation.id) {
        setActiveConversationId(conversation.id);
        setActiveChat(buildActiveChat(conversation));
        await loadMessages(conversation.id);
        loadConversations();
      }
    } catch (error) {
      console.error('Failed to start conversation:', error);
      toast.error('Failed to start conversation');
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      const response = await api.get(`/api/messages/conversations/${conversationId}/messages`);
      setMessages(normalizeArray(response.data?.messages || response.data));
    } catch (error) {
      console.error('Failed to load messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    if (!activeConversationId) {
      if (userId) {
        await ensureConversation(userId, newMessage);
        setNewMessage('');
        return;
      }
      toast.error('Select or start a conversation first.');
      return;
    }

    try {
      await api.post(`/api/messages/conversations/${activeConversationId}/messages`, {
        content: newMessage,
      });
      
      setNewMessage('');
      loadMessages(activeConversationId);
      loadConversations();
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const selectConversation = (conversation) => {
    const active = buildActiveChat(conversation);
    setActiveChat(active);
    setActiveConversationId(conversation.id);
    if (active?.user_id) {
      navigate(`/messages/${active.user_id}`);
    }
    if (conversation.id) {
      loadMessages(conversation.id);
    }
  };

  const handleUserSelect = (user) => {
    setSearchQuery('');
    setSearchResults([]);
    ensureConversation(user.id);
  };

  const getConversationUserId = (conversation) => {
    return (
      conversation?.user_id ||
      conversation?.recipient_id ||
      conversation?.other_user_id ||
      conversation?.participant?.id ||
      conversation?.other_user?.id ||
      conversation?.recipient?.id ||
      conversation?.participants?.[0]?.id
    );
  };

  const buildActiveChat = (conversation) => {
    const participant =
      conversation?.participant ||
      conversation?.other_user ||
      conversation?.recipient ||
      conversation?.participants?.[0] ||
      {};
    return {
      user_id: getConversationUserId(conversation),
      username: conversation?.username || participant?.username || 'User',
      avatar_url: conversation?.avatar_url || participant?.avatar_url,
      is_online: conversation?.is_online || participant?.is_online,
    };
  };

  const safeConversations = normalizeArray(conversations).filter((item) => typeof item === 'object');
  const safeMessages = normalizeArray(messages).filter((item) => typeof item === 'object');
  const safeSearchResults = normalizeArray(searchResults).filter((item) => typeof item === 'object');

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-cyan/30 border-t-brand-cyan rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-dark-bg flex overflow-hidden">
      {/* Conversations List */}
      <div className={`${activeChat && userId ? 'hidden md:flex' : 'flex'} w-full md:w-80 border-r border-white/10 flex-col bg-dark-card`}>
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">Messages</h2>
          <p className="text-sm text-gray-500 mt-1">
            {safeConversations.length} conversation{safeConversations.length !== 1 ? 's' : ''}
          </p>
          <div className="mt-4">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users..."
                className="w-full bg-dark-elevated border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-cyan"
              />
              {searching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                  Searching...
                </div>
              )}
            </div>
            {safeSearchResults.length > 0 && (
              <div className="mt-2 rounded-lg border border-white/10 bg-dark-elevated max-h-56 overflow-y-auto">
                {safeSearchResults.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleUserSelect(user)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-white/5"
                  >
                    <img
                      src={user.avatar_url || '/server-logo.png'}
                      alt={user.username}
                      className="w-8 h-8 rounded-full"
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white truncate">{user.username}</div>
                      {user.global_name && (
                        <div className="text-xs text-gray-400 truncate">{user.global_name}</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {safeConversations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No messages yet</p>
              <p className="text-sm mt-2">Subscribe to traders to start chatting</p>
            </div>
          ) : (
            safeConversations.map((conversation) => (
              <ConversationItem
                key={conversation.id || getConversationUserId(conversation)}
                conversation={conversation}
                display={buildActiveChat(conversation)}
                active={activeChat?.user_id === getConversationUserId(conversation)}
                onClick={() => selectConversation(conversation)}
              />
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      {activeChat && userId ? (
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-white/10 bg-dark-card flex items-center gap-3">
            <button
              onClick={() => navigate('/messages')}
              className="md:hidden text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            
            <img
              src={activeChat.avatar_url || '/server-logo.png'}
              alt={activeChat.username}
              className="w-10 h-10 rounded-full"
            />
            <div className="flex-1">
              <h3 className="font-semibold text-white">{activeChat.username}</h3>
              {activeChat.is_online && (
                <p className="text-xs text-green-400">● Online</p>
              )}
            </div>
            <button className="text-gray-400 hover:text-white">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {safeMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <Lock className="w-12 h-12 mb-3 opacity-50" />
                <p>Start a conversation</p>
                <p className="text-sm mt-1">Send your first message</p>
              </div>
            ) : (
              safeMessages.map((message, idx) => (
                <MessageBubble
                  key={idx}
                  message={message}
                  isOwn={resolveIsOwnMessage(message, activeChat)}
                />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <form onSubmit={sendMessage} className="p-4 border-t border-white/10 bg-dark-card">
            <div className="flex items-end gap-3">
              <button
                type="button"
                className="p-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
              
              <div className="flex-1 bg-dark-elevated border border-white/10 rounded-2xl flex items-end">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(e);
                    }
                  }}
                  placeholder="Type a message..."
                  className="flex-1 bg-transparent text-white placeholder-gray-500 px-4 py-3 focus:outline-none resize-none max-h-32"
                  rows="1"
                />
                <button
                  type="button"
                  className="p-3 text-gray-400 hover:text-white transition-all"
                >
                  <Smile className="w-5 h-5" />
                </button>
              </div>

              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="p-3 bg-gradient-brand text-white rounded-xl hover:shadow-glow-cyan transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>

              <button
                type="button"
                className="p-3 text-tier-elite hover:bg-tier-elite/10 rounded-xl transition-all"
                onClick={() => toast.success('Tip feature coming soon!')}
              >
                <DollarSign className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center text-gray-500">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-brand rounded-full flex items-center justify-center mx-auto mb-4 opacity-20">
              <Send className="w-10 h-10 text-white" />
            </div>
            <p className="text-lg font-semibold">Select a conversation</p>
            <p className="text-sm mt-1">Choose a chat to start messaging</p>
          </div>
        </div>
      )}
    </div>
  );
}

function ConversationItem({ conversation, display, active, onClick }) {
  return (
    <motion.div
      whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
      className={`p-4 cursor-pointer border-b border-white/5 ${
        active ? 'bg-white/10' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <img
            src={display.avatar_url || '/server-logo.png'}
            alt={display.username}
            className="w-12 h-12 rounded-full"
          />
          {conversation.unread_count > 0 && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-brand-cyan rounded-full flex items-center justify-center text-xs font-bold text-dark-bg">
              {conversation.unread_count}
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-semibold text-white truncate">
              {display.username}
            </h4>
            {conversation.last_message_at && (
              <span className="text-xs text-gray-500">
                {formatTime(conversation.last_message_at)}
              </span>
            )}
          </div>
          {conversation.last_message && (
            <p className="text-sm text-gray-400 truncate">
              {conversation.last_message}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function MessageBubble({ message, isOwn }) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
        <div
          className={`rounded-2xl px-4 py-2 ${
            isOwn
              ? 'bg-gradient-brand text-white'
              : 'bg-white/5 text-gray-300'
          }`}
        >
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        <p className={`text-xs text-gray-500 mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
          {formatTime(message.created_at)}
        </p>
      </div>
    </div>
  );
}

function resolveIsOwnMessage(message, activeChat) {
  if (typeof message.from_me === 'boolean') return message.from_me;
  if (typeof message.is_own === 'boolean') return message.is_own;
  if (message.sender_id && activeChat?.user_id) {
    return String(message.sender_id) !== String(activeChat.user_id);
  }
  return false;
}

function formatTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;

  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  
  return date.toLocaleDateString();
}
