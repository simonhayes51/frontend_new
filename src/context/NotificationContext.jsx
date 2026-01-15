import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification as deleteNotificationApi,
} from "../api/social";
import toast from "react-hot-toast";

const NotificationContext = createContext();

export function useNotifications() {
  return useContext(NotificationContext);
}

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Poll interval in milliseconds (e.g., 30 seconds)
  const POLL_INTERVAL = 30000;

  const fetchNotifications = useCallback(async (isBackground = false) => {
    if (!user) return;
    if (!isBackground) setLoading(true);
    try {
      const [listRes, countRes] = await Promise.all([
        getNotifications(),
        getUnreadNotificationCount(),
      ]);

      const rawList = Array.isArray(listRes.data)
        ? listRes.data
        : listRes.data?.notifications || listRes.data?.items || listRes.data?.results || [];

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

      const count =
        countRes.data?.count ??
        countRes.data?.unread_count ??
        countRes.data?.unread ??
        countRes.data?.notifications_unread ??
        0;
      setUnreadCount(count || 0);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, [user]);

  // Initial fetch and polling
  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(() => fetchNotifications(true), POLL_INTERVAL);
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user, fetchNotifications]);

  const markAsRead = async (id) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await markNotificationRead(id);
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      toast.error("Failed to update notification");
      // Revert on failure (optional, but skipping for simplicity/UX)
      fetchNotifications(true);
    }
  };

  const markAllAsRead = async () => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);

    try {
      await markAllNotificationsRead();
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Failed to mark all as read:", error);
      toast.error("Failed to update notifications");
      fetchNotifications(true);
    }
  };

  const deleteNotification = async (id) => {
    const notif = notifications.find((n) => n.id === id);
    // Optimistic update
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (notif && !notif.read) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    try {
      await deleteNotificationApi(id);
      toast.success("Notification deleted");
    } catch (error) {
      console.error("Failed to delete notification:", error);
      toast.error("Failed to delete notification");
      fetchNotifications(true);
    }
  };

  const value = {
    notifications,
    unreadCount,
    loading,
    refresh: () => fetchNotifications(false),
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}
