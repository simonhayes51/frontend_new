import { useState, useEffect } from "react";
import { Bell, Heart, MessageCircle, UserPlus, TrendingUp, DollarSign, CheckCircle, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    loadNotifications();
  }, [filter]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call when endpoint is ready
      // const { data } = await api.get('/api/notifications');
      
      // Mock data for now
      const mockNotifications = [
        {
          id: 1,
          type: "like",
          title: "New like on your post",
          message: "JohnTrader liked your trade signal",
          time: "2 minutes ago",
          read: false,
          avatar: "https://i.pravatar.cc/150?u=1",
        },
        {
          id: 2,
          type: "comment",
          title: "New comment",
          message: "SarahPro commented on your prediction",
          time: "15 minutes ago",
          read: false,
          avatar: "https://i.pravatar.cc/150?u=2",
        },
        {
          id: 3,
          type: "follow",
          title: "New follower",
          message: "MikeTrader started following you",
          time: "1 hour ago",
          read: true,
          avatar: "https://i.pravatar.cc/150?u=3",
        },
        {
          id: 4,
          type: "subscription",
          title: "New subscriber",
          message: "Emma joined your Elite tier",
          time: "3 hours ago",
          read: true,
          avatar: "https://i.pravatar.cc/150?u=4",
        },
      ];
      
      setNotifications(mockNotifications);
    } catch (error) {
      console.error("Failed to load notifications:", error);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      // TODO: API call to mark as read
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      // TODO: API call to mark all as read
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const deleteNotification = async (id) => {
    try {
      // TODO: API call to delete
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success("Notification deleted");
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const getIcon = (type) => {
    const iconMap = {
      like: <Heart className="w-5 h-5 text-red-400" />,
      comment: <MessageCircle className="w-5 h-5 text-blue-400" />,
      follow: <UserPlus className="w-5 h-5 text-green-400" />,
      subscription: <DollarSign className="w-5 h-5 text-yellow-400" />,
      trade: <TrendingUp className="w-5 h-5 text-cyan-400" />,
    };
    return iconMap[type] || <Bell className="w-5 h-5 text-gray-400" />;
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-primary hover:underline font-medium"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 mt-4">
            {["all", "unread", "likes", "comments", "follows"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-sm rounded-lg capitalize transition-colors ${
                  filter === f
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        <div className="divide-y divide-border">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">
              Loading notifications...
            </div>
          ) : notifications.length > 0 ? (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-muted/50 transition-colors ${
                  !notification.read ? "bg-primary/5" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    {getIcon(notification.type)}
                  </div>

                  {/* Avatar */}
                  <img
                    src={notification.avatar}
                    alt=""
                    className="w-10 h-10 rounded-full flex-shrink-0"
                  />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground">
                      {notification.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {notification.time}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        title="Mark as read"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center">
              <Bell className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No notifications yet
              </h3>
              <p className="text-sm text-muted-foreground">
                When you get notifications, they'll show up here
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
