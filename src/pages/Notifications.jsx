import { useState, useEffect } from "react";
import { Bell, Heart, MessageCircle, UserPlus, TrendingUp, DollarSign, CheckCircle, X } from "lucide-react";
import toast from "react-hot-toast";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification as deleteNotificationApi,
} from "../api/social";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const { data } = await getNotifications();
      const rawList = Array.isArray(data)
        ? data
        : data?.notifications || data?.items || data?.results || [];

      const mapped = (rawList || []).map((n) => ({
        id: n.id,
        type: n.type || n.category || "general",
        title: n.title || "Notification",
        message: n.message || n.text || "",
        time: n.time_ago || n.time || n.created_at || "",
        read: !!(n.read || n.is_read || n.seen),
        avatar: n.actor_avatar || n.avatar_url || n.user_avatar || n.user_image || "",
      }));

      setNotifications(mapped);
    } catch (error) {
      console.error("Failed to load notifications:", error);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error("Failed to mark as read:", error);
      toast.error("Failed to mark notification as read");
    }
  };

  const markAllAsRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Failed to mark all as read:", error);
      toast.error("Failed to mark all as read");
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      await deleteNotificationApi(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success("Notification deleted");
    } catch (error) {
      console.error("Failed to delete notification:", error);
      toast.error("Failed to delete notification");
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

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications = (() => {
    if (filter === "unread") {
      return notifications.filter((n) => !n.read);
    }
    if (filter === "likes") {
      return notifications.filter((n) => n.type === "like");
    }
    if (filter === "comments") {
      return notifications.filter((n) => n.type === "comment");
    }
    if (filter === "follows") {
      return notifications.filter(
        (n) => n.type === "follow" || n.type === "subscription"
      );
    }
    return notifications;
  })();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  You have {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
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

        <div className="divide-y divide-border">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">
              Loading notifications...
            </div>
          ) : filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-muted/50 transition-colors ${
                  !notification.read ? "bg-primary/5" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    {getIcon(notification.type)}
                  </div>

                  <img
                    src={notification.avatar}
                    alt=""
                    className="w-10 h-10 rounded-full flex-shrink-0"
                  />

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
                      onClick={() => handleDeleteNotification(notification.id)}
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
