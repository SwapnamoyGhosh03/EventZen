import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Bell, CheckCheck, X, ExternalLink } from "lucide-react";
import { useGetNotificationsQuery, useGetUnreadCountQuery, useMarkAsReadMutation, useMarkAllAsReadMutation } from "@/store/api/notificationApi";
import { getNotificationIcon, getNotificationAccent } from "@/utils/notificationHelpers";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: unreadData } = useGetUnreadCountQuery(undefined, {
    pollingInterval: 30_000,
  });
  const { data: listData } = useGetNotificationsQuery(
    { page: 1, limit: 8 },
    { skip: !open, pollingInterval: 30_000 }
  );
  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead] = useMarkAllAsReadMutation();

  const unreadCount = unreadData?.data?.count ?? 0;
  const notifications = listData?.data ?? [];

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleMarkRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    markAsRead(id);
  };

  const handleMarkAll = () => markAllAsRead();

  const formatTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-lg text-near-black hover:bg-amber/10 hover:text-amber transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 bg-burgundy text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[360px] bg-white rounded-xl shadow-xl border border-border-light z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-light bg-cream/40">
            <div className="flex items-center gap-2">
              <Bell size={14} className="text-amber" />
              <span className="font-heading text-sm font-semibold text-near-black">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 bg-burgundy text-white text-[10px] font-bold rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAll}
                  className="flex items-center gap-1 text-[11px] font-body text-muted-gray hover:text-amber transition-colors"
                >
                  <CheckCheck size={12} /> Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="text-muted-gray hover:text-near-black transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-border-light">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell size={24} className="mx-auto text-muted-gray opacity-30 mb-2" />
                <p className="font-body text-xs text-muted-gray">No notifications yet.</p>
              </div>
            ) : (
              notifications.map((n) => {
                const isUnread = n.status !== "READ";
                const Icon = getNotificationIcon(n.type);
                const accent = getNotificationAccent(n.type);
                return (
                  <div
                    key={n.notification_id}
                    className={`flex gap-3 px-4 py-3 transition-colors ${isUnread ? "bg-amber/5" : "hover:bg-cream/40"}`}
                  >
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5 ${accent}`}>
                      <Icon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-body text-xs font-semibold text-near-black leading-snug ${isUnread ? "font-bold" : ""}`}>
                        {n.title}
                      </p>
                      <p className="font-body text-[11px] text-dark-gray mt-0.5 line-clamp-2">{n.body}</p>
                      <p className="font-body text-[10px] text-muted-gray mt-1">{formatTime(n.created_at)}</p>
                    </div>
                    {isUnread && (
                      <button
                        onClick={(e) => handleMarkRead(n.notification_id, e)}
                        className="flex-shrink-0 mt-1 text-muted-gray hover:text-amber transition-colors"
                        title="Mark as read"
                      >
                        <CheckCheck size={13} />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-border-light bg-cream/30">
            <Link
              to="/account/notifications"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-1.5 w-full text-xs font-body font-medium text-amber hover:underline"
            >
              View all notifications <ExternalLink size={11} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
