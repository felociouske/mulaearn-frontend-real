import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BellIcon } from "@/components/icons/Icons";
import { useNotifications } from "@/lib/notifications-context";
import {
  TYPE_META, formatSignedAmount, getNotifications, markNotificationRead, timeAgo, type Notification,
} from "@/lib/notifications";

const PREVIEW_COUNT = 6;

export default function NotificationBell() {
  const navigate = useNavigate();
  const { unreadCount, setUnreadCount, subscribe } = useNotifications();
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<Notification[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  // Fetch the latest few each time the dropdown opens (cheap, and always fresh).
  useEffect(() => {
    if (!open) return;
    getNotifications({ page: 1 }).then((d) => setPreview(d.results.slice(0, PREVIEW_COUNT))).catch(() => {});
  }, [open]);

  // Keep an open dropdown live.
  useEffect(
    () =>
      subscribe((evt) => {
        if (evt.type === "new") {
          setPreview((prev) => [evt.notification, ...prev.filter((p) => p.id !== evt.notification.id)].slice(0, PREVIEW_COUNT));
        }
      }),
    [subscribe]
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function openItem(n: Notification) {
    setOpen(false);
    if (!n.is_read) {
      setPreview((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
      setUnreadCount((c) => Math.max(0, c - 1));
      markNotificationRead(n.id).catch(() => setUnreadCount((c) => c + 1));
    }
    navigate(n.link || "/notifications");
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full bg-dash-surface text-dash-text/70 transition-colors hover:text-dash-text"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={open}
      >
        {/* key={unreadCount} remounts the icon on every change, replaying the wiggle. */}
        <span key={unreadCount} className={unreadCount > 0 ? "animate-bell-wiggle" : ""}><BellIcon size={17} /></span>
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-dash-warn-500 px-1 text-[10px] font-bold text-dash-bg">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-20 w-80 rounded-lg bg-dash-surface shadow-lg ring-1 ring-dash-border">
          <div className="flex items-center justify-between px-4 py-3">
            <p className="text-sm font-semibold text-dash-text">Notifications</p>
            {unreadCount > 0 && <span className="text-xs text-dash-text/40">{unreadCount} unread</span>}
          </div>
          <div className="max-h-80 divide-y divide-dash-border overflow-y-auto">
            {preview.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-dash-text/40">You're all caught up.</p>
            )}
            {preview.map((n) => {
              const meta = TYPE_META[n.type] ?? TYPE_META.system;
              const Icon = meta.icon;
              return (
                <button
                  key={n.id}
                  onClick={() => openItem(n)}
                  className={`flex w-full gap-3 px-4 py-3 text-left hover:bg-dash-overlay ${!n.is_read ? "bg-dash-accent-500/5" : ""}`}
                >
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ${meta.tone}`}><Icon size={15} /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium text-dash-text">{n.title}</p>
                      {n.amount !== null && (
                        <span className={`shrink-0 text-xs font-bold ${Number(n.amount) >= 0 ? "text-dash-accent-500" : "text-dash-warn-500"}`}>
                          {formatSignedAmount(n.amount, n.currency_code)}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-xs text-dash-text/50">{n.message}</p>
                    <p className="mt-1 text-[11px] text-dash-text/30">{timeAgo(n.created_at)}</p>
                  </div>
                </button>
              );
            })}
          </div>
          <Link
            to="/notifications"
            onClick={() => setOpen(false)}
            className="block px-4 py-3 text-center text-sm font-medium text-dash-accent-500 hover:bg-dash-overlay"
          >
            View all
          </Link>
        </div>
      )}
    </div>
  );
}