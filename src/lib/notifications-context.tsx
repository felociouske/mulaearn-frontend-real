import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
  type Dispatch, type ReactNode, type SetStateAction,
} from "react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { buildNotificationsWsUrl, getUnreadCount, type Notification } from "@/lib/notifications";

export type NotificationEvent = { type: "new"; notification: Notification } | { type: "refresh" };

type NotificationsContextValue = {
  unreadCount: number;
  setUnreadCount: Dispatch<SetStateAction<number>>;
  // Pages/dropdowns call this to hear about live events; returns an unsubscribe fn.
  subscribe: (listener: (event: NotificationEvent) => void) => () => void;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

const PING_MS = 30_000;      // idle sockets get dropped by proxies; the server answers each ping
const MAX_BACKOFF_MS = 30_000;

/**
 * Mounted ONCE inside DashboardLayout (so only for logged-in users). Owns the
 * single WebSocket and the bell's unread count; list state stays in the
 * components that render lists.
 */
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const toast = useToast();
  const [unreadCount, setUnreadCount] = useState(0);
  const listeners = useRef(new Set<(e: NotificationEvent) => void>());

  // The socket effect must not re-run (and reconnect) just because the toast
  // helper got a new identity, so reach it through a ref.
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const subscribe = useCallback((fn: (e: NotificationEvent) => void) => {
    listeners.current.add(fn);
    return () => { listeners.current.delete(fn); };
  }, []);

  const userId = user?.id;
  useEffect(() => {
    if (!userId) return;

    let ws: WebSocket | null = null;
    let pingTimer: number | undefined;
    let retryTimer: number | undefined;
    let attempts = 0;
    let stopped = false;

    const emit = (e: NotificationEvent) => listeners.current.forEach((fn) => fn(e));
    const refreshCount = () => getUnreadCount().then(setUnreadCount).catch(() => {});

    const connect = () => {
      const url = buildNotificationsWsUrl();
      if (!url || stopped) return;
      ws = new WebSocket(url);

      ws.onopen = () => {
        attempts = 0;
        pingTimer = window.setInterval(() => {
          if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ action: "ping" }));
        }, PING_MS);
      };

      ws.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.event === "connected") {
          setUnreadCount(msg.unread_count);
        } else if (msg.event === "notification") {
          setUnreadCount(msg.unread_count);
          // Reuses your existing toast banner — no second toast system.
          toastRef.current.info(`${msg.notification.title}: ${msg.notification.message}`);
          emit({ type: "new", notification: msg.notification });
        } else if (msg.event === "refresh") {
          refreshCount(); // an all-users broadcast just landed
          emit({ type: "refresh" });
        }
      };

      ws.onclose = async (e) => {
        window.clearInterval(pingTimer);
        if (stopped) return;
        // 4401 = our "bad/expired token" code. Any apiFetch call that gets a 401
        // refreshes the access token (lib/api.ts), so make one before retrying
        // and the reconnect below picks up the fresh token from localStorage.
        if (e.code === 4401) await getUnreadCount().then(setUnreadCount).catch(() => {});
        attempts += 1;
        retryTimer = window.setTimeout(connect, Math.min(1000 * 2 ** attempts, MAX_BACKOFF_MS));
      };
    };

    refreshCount();
    connect();
    return () => {
      stopped = true;
      window.clearInterval(pingTimer);
      window.clearTimeout(retryTimer);
      ws?.close();
    };
  }, [userId]);

  const value = useMemo(() => ({ unreadCount, setUnreadCount, subscribe }), [unreadCount, subscribe]);
  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within a NotificationsProvider");
  return ctx;
}