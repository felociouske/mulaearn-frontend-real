import { useEffect, useState } from "react";
import { getNotifications, type Notification } from "@/lib/notifications";
import { PiggyBankIcon, ChatBubbleIcon, StarIcon, BellIcon } from "@/components/icons/Icons";

const typeIcon: Record<Notification["type"], typeof BellIcon> = {
  credit: PiggyBankIcon,
  chat: ChatBubbleIcon,
  review: StarIcon,
  system: BellIcon,
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getNotifications()
      .then(setNotifications)
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-dash-text">Notifications</h1>
      <p className="mt-1 text-sm text-dash-text/50">Credits, review approvals, and platform updates.</p>

      {isLoading ? (
        <p className="mt-8 text-dash-text/50">Loading…</p>
      ) : notifications.length === 0 ? (
        <div className="mt-8 rounded-lg bg-dash-surface p-6 text-dash-text/70">You're all caught up.</div>
      ) : (
        <div className="mt-6 divide-y divide-dash-border rounded-lg bg-dash-surface">
          {notifications.map((n) => {
            const Icon = typeIcon[n.type];
            return (
              <div key={n.id} className={`flex gap-4 p-4 ${!n.read ? "bg-dash-accent-500/5" : ""}`}>
                <span className="text-dash-text/60"><Icon size={20} /></span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-dash-text">{n.title}</p>
                    <p className="text-xs text-dash-text/30">{new Date(n.created_at).toLocaleString()}</p>
                  </div>
                  <p className="mt-1 text-sm text-dash-text/60">{n.body}</p>
                </div>
                {!n.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-dash-accent-500" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
