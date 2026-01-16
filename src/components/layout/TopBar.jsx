import { useState, useEffect, useRef } from "react";
import { Search, Bell, MessageCircle, Plus, User, BarChart3, Settings as SettingsIcon, LogOut, ChevronDown, TrendingUp } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { getUnreadMessageCount } from "../../api/social";

export function TopBar() {
  const [searchFocused, setSearchFocused] = useState(false);
  const [liveCount, setLiveCount] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [messageUnreadCount, setMessageUnreadCount] = useState(0);
  const { unreadCount: notificationUnreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const menuRef = useRef(null);

  const isTrader = user?.account_type === 'trader' || user?.is_trader;

  useEffect(() => {
    // Simulate live count - in production, this would come from WebSocket or API
    const updateLiveCount = () => {
      setLiveCount(Math.floor(Math.random() * 500) + 2000); // 2000-2500
    };
    updateLiveCount();
    const interval = setInterval(updateLiveCount, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreatePost = () => {
    // Scroll to top of feed page to focus on create post input
    if (location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    if (!user) return; // Skip if not logged in
    const loadUnread = async () => {
      try {
        const { data } = await getUnreadMessageCount();
        const count =
          data?.count ??
          data?.unread_count ??
          data?.unread ??
          0;
        setMessageUnreadCount(count || 0);
      } catch (error) {
        setMessageUnreadCount(0);
      }
    };
    loadUnread();
  }, [user]);

  return (
    <header className="h-16 bg-card/50 backdrop-blur-lg border-b border-border sticky top-0 z-50">
      <div className="h-full px-6 flex items-center justify-between gap-4">
        {/* Search */}
        <div className="flex-1 max-w-xl">
          <div
            className={`relative flex items-center transition-all duration-300 ${
              searchFocused ? "scale-[1.02]" : ""
            }`}
          >
            <Search className="absolute left-3 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search traders, tactics, or posts..."
              className="w-full h-10 pl-10 pr-4 bg-muted/50 border border-border rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
          </div>
        </div>

        {/* Live Indicator */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-success/10 border border-success/20 rounded-full">
          <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
          <span className="text-xs font-medium text-success">{(liveCount / 1000).toFixed(1)}k Live</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {user && (
            <>
              <button
                onClick={handleCreatePost}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4" />
                Create Post
              </button>

              <button 
                onClick={() => navigate('/messages')}
                className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                {messageUnreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
                )}
              </button>

              <button 
                onClick={() => navigate('/notifications')}
                className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              >
                <Bell className="w-5 h-5" />
                {notificationUnreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-secondary rounded-full" />
                )}
              </button>
            </>
          )}

          {/* User Avatar with Dropdown */}
          {!user ? (
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-bold hover:opacity-90 transition-all shadow-glow-primary"
            >
              Login
            </button>
          ) : (
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-muted transition-colors"
            >
              <img 
                src={user?.avatar_url || "/server-logo.png"} 
                alt={user?.username}
                className="w-8 h-8 rounded-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "/server-logo.png";
                }}
              />
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-lg py-1 z-50">
                {/* User Info */}
                <div className="px-4 py-3 border-b border-border">
                  <p className="font-semibold text-foreground">{user?.username || 'User'}</p>
                  <p className="text-xs text-muted-foreground">@{user?.username?.toLowerCase() || 'user'}</p>
                </div>

                {/* Menu Items */}
                <div className="py-1">
                  <button
                    onClick={() => {
                      navigate('/profile');
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    <User className="w-4 h-4" />
                    User Profile
                  </button>

                  {isTrader && (
                    <button
                      onClick={() => {
                        navigate('/trader-dashboard');
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <BarChart3 className="w-4 h-4" />
                      Trader Dashboard
                    </button>
                  )}

                  {!isTrader && (
                    <button
                      onClick={() => {
                        navigate('/become-trader');
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <TrendingUp className="w-4 h-4" />
                      Become a Trader
                    </button>
                  )}

                  <button
                    onClick={() => {
                      navigate('/settings');
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    <SettingsIcon className="w-4 h-4" />
                    Settings
                  </button>
                </div>

                {/* Logout */}
                <div className="border-t border-border py-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
          )}
        </div>
      </div>
    </header>
  );
}
