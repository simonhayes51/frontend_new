import { useState, useEffect } from "react";
import { Search, Bell, MessageCircle, Plus, Zap } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export function TopBar() {
  const [searchFocused, setSearchFocused] = useState(false);
  const [liveCount, setLiveCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    // Simulate live count - in production, this would come from WebSocket or API
    const updateLiveCount = () => {
      setLiveCount(Math.floor(Math.random() * 500) + 2000); // 2000-2500
    };
    updateLiveCount();
    const interval = setInterval(updateLiveCount, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const handleCreatePost = () => {
    // Scroll to top of feed page to focus on create post input
    if (location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/');
    }
  };

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
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
          </button>

          <button 
            onClick={() => navigate('/notifications')}
            className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-secondary rounded-full" />
          </button>

          {/* User Avatar */}
          <button 
            onClick={() => navigate('/settings')}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-muted transition-colors"
          >
            {user?.avatar_url ? (
              <img 
                src={user.avatar_url} 
                alt={user.username} 
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Zap className="w-4 h-4 text-primary-foreground" />
              </div>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
