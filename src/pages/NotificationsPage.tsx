import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import NotificationCard from "@/components/dashboard/NotificationCard";
import { BellIcon } from "@/components/icons/Icons";
import { useNotifications } from "@/lib/notifications-context";
import {
  FILTERS, dayBucket, deleteNotification, getNotifications, markAllNotificationsRead,
  markNotificationRead, type Notification,
} from "@/lib/notifications";

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { unreadCount, setUnreadCount, subscribe } = useNotifications();

  const [filterKey, setFilterKey] = useState("all");
  const [items, setItems] = useState<Notification[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const filter = useMemo(() => FILTERS.find((f) => f.key === filterKey) ?? FILTERS[0], [filterKey]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await getNotifications({ types: filter.types, unread: filter.unread, page: 1 });
      setItems(data.results);
      setPage(1);
      setHasMore(Boolean(data.next));
    } catch {
      setError("Couldn't load your notifications.");
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => { void load(); }, [load]);

  // Live updates. Refs let the single subscription always see the latest
  // filter/load without unsubscribing and resubscribing on every tab change.
  const loadRef = useRef(load);
  loadRef.current = load;
  const filterRef = useRef(filter);
  filterRef.current = filter;

  useEffect(
    () =>
      subscribe((evt) => {
        if (evt.type === "refresh") {
          void loadRef.current();
          return;
        }
        const f = filterRef.current;
        const matches = (f.types ? f.types.includes(evt.notification.type) : true) && (f.unread ? !evt.notification.is_read : true);
        if (matches) {
          setItems((prev) => (prev.some((p) => p.id === evt.notification.id) ? prev : [evt.notification, ...prev]));
        }
      }),
    [subscribe]
  );

  async function loadMore() {
    setIsLoadingMore(true);
    try {
      const data = await getNotifications({ types: filter.types, unread: filter.unread, page: page + 1 });
      // De-dupe: an item that arrived live can also appear in the next server page.
      setItems((prev) => [...prev, ...data.results.filter((r) => !prev.some((p) => p.id === r.id))]);
      setPage((p) => p + 1);
      setHasMore(Boolean(data.next));
    } finally {
      setIsLoadingMore(false);
    }
  }

  async function open(n: Notification) {
    if (!n.is_read) {
      // Optimistic: flip locally first so it feels instant; roll back if the call fails.
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
      setUnreadCount((c) => Math.max(0, c - 1));
      try {
        await markNotificationRead(n.id);
      } catch {
        setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: false } : x)));
        setUnreadCount((c) => c + 1);
      }
    }
    if (n.link) {
      if (n.link.startsWith("http")) window.open(n.link, "_blank", "noopener");
      else navigate(n.link);
    }
  }

  async function remove(n: Notification) {
    const snapshot = items;
    setItems((prev) => prev.filter((x) => x.id !== n.id));
    if (!n.is_read) setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await deleteNotification(n.id);
    } catch {
      setItems(snapshot);
      if (!n.is_read) setUnreadCount((c) => c + 1);
    }
  }

  async function readAll() {
    setItems((prev) => (filter.unread ? [] : prev.map((x) => ({ ...x, is_read: true }))));
    setUnreadCount(0);
    try {
      await markAllNotificationsRead();
    } catch {
      void load();
    }
  }

  // Timeline grouping, keeping the server's newest-first order.
  const groups = useMemo(() => {
    const map = new Map<string, Notification[]>();
    for (const n of items) {
      const key = dayBucket(n.created_at);
      map.set(key, [...(map.get(key) ?? []), n]);
    }
    return [...map.entries()];
  }, [items]);

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-dash-text">Notifications</h1>
          <p className="mt-1 text-sm text-dash-text/50">
            {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
          </p>
        </div>
        <button
          onClick={readAll}
          disabled={unreadCount === 0}
          className="rounded-lg bg-dash-accent-500/10 px-3 py-2 text-sm font-medium text-dash-accent-500 ring-1 ring-dash-accent-500/30 transition hover:bg-dash-accent-500/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Mark all read
        </button>
      </div>

      {/* Filter chips — scroll sideways on phones */}
      <div className="-mx-1 mt-5 flex gap-2 overflow-x-auto px-1 pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilterKey(f.key)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium ring-1 transition ${
              filterKey === f.key
                ? "bg-dash-text text-dash-bg ring-dash-text"
                : "bg-dash-surface text-dash-text/70 ring-dash-border hover:text-dash-text"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-6">
        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => <div key={i} className="h-18 animate-pulse rounded-xl bg-dash-surface" />)}
          </div>
        ) : error ? (
          <div className="rounded-xl bg-red-500/10 p-4 text-center text-sm text-red-500 ring-1 ring-red-500/30">
            {error} <button onClick={() => void load()} className="font-semibold underline">Retry</button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-dash-border py-16 text-center">
            <span className="text-dash-text/30"><BellIcon size={40} /></span>
            <p className="mt-3 font-medium text-dash-text/80">Nothing here yet</p>
            <p className="mt-1 text-sm text-dash-text/40">New activity shows up the moment it happens.</p>
          </div>
        ) : (
          groups.map(([label, list]) => (
            <section key={label}>
              <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-dash-text/40">{label}</h2>
              <div className="space-y-2">
                {list.map((n) => <NotificationCard key={n.id} n={n} onOpen={open} onDelete={remove} />)}
              </div>
            </section>
          ))
        )}

        {hasMore && !isLoading && (
          <button
            onClick={loadMore}
            disabled={isLoadingMore}
            className="mx-auto block rounded-lg bg-dash-surface px-5 py-2.5 text-sm font-medium text-dash-text/70 ring-1 ring-dash-border hover:text-dash-text disabled:opacity-60"
          >
            {isLoadingMore ? "Loading…" : "Load more"}
          </button>
        )}
      </div>
    </div>
  );
}