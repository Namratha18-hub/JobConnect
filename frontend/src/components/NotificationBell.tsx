import { useCallback, useEffect, useState } from "react";
import {
  Bell,
  CheckCheck,
  RefreshCw,
  X,
  Circle,
} from "lucide-react";

import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type AppNotification,
} from "../services/notificationService";

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [items, unread] = await Promise.all([
        getNotifications(),
        getUnreadNotificationCount(),
      ]);

      setNotifications(items);
      setUnreadCount(unread);
    } catch (err) {
      console.error("Notification loading failed:", err);
      setError("Unable to load notifications. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  async function handleMarkAsRead(item: AppNotification) {
    if (item.isRead) return;

    try {
      setUpdatingId(item.id);
      setError("");

      const updated = await markNotificationAsRead(item.id);

      setNotifications((previous) =>
        previous.map((notification) =>
          notification.id === updated.id ? updated : notification
        )
      );

      setUnreadCount((previous) => Math.max(0, previous - 1));
    } catch (err) {
      console.error("Mark as read failed:", err);
      setError("Unable to update notification.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleMarkAllAsRead() {
    if (unreadCount === 0) return;

    try {
      setMarkingAll(true);
      setError("");

      await markAllNotificationsAsRead();
      await loadNotifications();
    } catch (err) {
      console.error("Mark all as read failed:", err);
      setError("Unable to mark all notifications as read.");
    } finally {
      setMarkingAll(false);
    }
  }

  function toggleNotifications() {
    const next = !isOpen;
    setIsOpen(next);

    if (next) {
      void loadNotifications();
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggleNotifications}
        aria-label={`Notifications, ${unreadCount} unread`}
        aria-expanded={isOpen}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      >
        <Bell className="h-5 w-5" />

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 z-[100] w-[min(90vw,400px)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b p-4">
            <div>
              <h3 className="font-bold text-slate-900">Notifications</h3>
              <p className="mt-1 text-xs text-slate-500">
                {unreadCount} unread notifications
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close notifications"
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex justify-between border-b px-4 py-3">
            <button
              type="button"
              onClick={() => void loadNotifications()}
              disabled={loading}
              className="flex items-center gap-2 text-xs font-semibold text-indigo-600 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={() => void handleMarkAllAsRead()}
              disabled={unreadCount === 0 || markingAll}
              className="flex items-center gap-2 text-xs font-semibold text-slate-600 disabled:opacity-40"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all as read
            </button>
          </div>

          {error && (
            <div className="m-3 rounded-lg bg-red-50 p-3 text-xs text-red-700">
              {error}
            </div>
          )}

          <div className="max-h-[420px] overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <p className="p-8 text-center text-sm text-slate-500">
                Loading notifications...
              </p>
            ) : notifications.length === 0 ? (
              <div className="p-10 text-center">
                <Bell className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-3 font-semibold text-slate-700">
                  No notifications yet
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  New updates will appear here.
                </p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  className={`border-b border-slate-100 p-4 ${
                    item.isRead ? "bg-white" : "bg-indigo-50/60"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {!item.isRead && (
                      <Circle className="mt-1 h-2.5 w-2.5 shrink-0 fill-indigo-600 text-indigo-600" />
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900">
                        {item.title}
                      </p>

                      <p className="mt-1 break-words text-sm text-slate-600">
                        {item.message}
                      </p>

                      <p className="mt-2 text-xs text-slate-400">
                        {formatDate(item.createdAt)}
                      </p>

                      {!item.isRead && (
                        <button
                          type="button"
                          onClick={() => void handleMarkAsRead(item)}
                          disabled={updatingId === item.id}
                          className="mt-2 text-xs font-semibold text-indigo-600 hover:underline"
                        >
                          {updatingId === item.id
                            ? "Updating..."
                            : "Mark as read"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t bg-slate-50 px-4 py-3 text-center">
            <span className="text-xs text-slate-500">
              JobConnect Notifications
            </span>
          </div>
        </div>
      )}
    </div>
  );
}