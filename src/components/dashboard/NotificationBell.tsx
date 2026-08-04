import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getNotifications, type Notification } from "@/lib/notifications";
import { PiggyBankIcon, ChatBubbleIcon, StarIcon, BellIcon } from "@/components/icons/Icons";

const typeIcon: Record<Notification["type"], typeof BellIcon> = {
  credit: PiggyBankIcon,
  chat: ChatBubbleIcon,
  review: StarIcon,
  system: BellIcon,
};

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getNotifications().then(setNotifications);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full bg-dash-surface text-dash-text/70 transition-colors hover:text-dash-text"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <BellIcon size={17} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-dash-warn-500 text-[10px] font-bold text-dash-bg">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-20 w-80 rounded-lg bg-dash-surface shadow-lg ring-1 ring-dash-border">
          <div className="flex items-center justify-between px-4 py-3">
            <p className="text-sm font-semibold text-dash-text">Notifications</p>
            {unreadCount > 0 && (
              <span className="text-xs text-dash-text/40">{unreadCount} unread</span>
            )}
          </div>
          <div className="max-h-80 divide-y divide-dash-border overflow-y-auto">
            {notifications.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-dash-text/40">You're all caught up.</p>
            )}
            {notifications.map((n) => {
              const Icon = typeIcon[n.type];
              return (
                <div key={n.id} className={`flex gap-3 px-4 py-3 ${!n.read ? "bg-dash-accent-500/5" : ""}`}>
                  <span className="text-dash-text/60"><Icon size={18} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-dash-text">{n.title}</p>
                    <p className="mt-0.5 text-xs text-dash-text/50">{n.body}</p>
                    <p className="mt-1 text-[11px] text-dash-text/30">{timeAgo(n.created_at)}</p>
                  </div>
                </div>
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
