import { useState, useEffect } from "react";
import { Bell, Heart, MessageCircle, UserPlus, TrendingUp, DollarSign, CheckCircle, X } from "lucide-react";
import toast from "react-hot-toast";
import { useNotifications } from "../context/NotificationContext";

export default function Notifications() {
  const {
    notifications,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification: deleteNotificationApi,
  } = useNotifications();
  const [filter, setFilter] = useState("all");

  const handleDeleteNotification = async (id) => {
    // Wrapper to match previous interface if needed, but context handles toast
    await deleteNotificationApi(id);
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
