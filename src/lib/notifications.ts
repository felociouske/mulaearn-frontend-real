import { apiFetch } from "@/lib/api";
import {
  ArrowDownCircleIcon, ArrowUpCircleIcon, WalletIcon, ClipboardIcon, FilmIcon, SmartphoneIcon,
  WheelIcon, ChatBubbleIcon, LinkIcon, PiggyBankIcon, ShieldCheckIcon, BellIcon, StarIcon,
} from "@/components/icons/Icons";

// Mirrors notifications.models.NotificationType on the backend.
export type NotificationType =
  | "deposit" | "withdrawal" | "refund" | "survey" | "movie_review" | "app_review"
  | "wheel" | "chat" | "referral" | "loan" | "plan" | "system" | "promo";

export type Notification = {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  amount: string | null; // DRF sends decimals as strings; signed (+ money in, - money out), null for system/promo
  currency_code: string;
  link: string;
  is_read: boolean;
  created_at: string;
};

type Page<T> = { count: number; next: string | null; previous: string | null; results: T[] };

// ---- REST -------------------------------------------------------------

export function getNotifications(opts: { types?: NotificationType[] | null; unread?: boolean; page?: number } = {}) {
  const params = new URLSearchParams({ page: String(opts.page ?? 1) });
  if (opts.types?.length) params.set("type", opts.types.join(","));
  if (opts.unread) params.set("unread", "true");
  return apiFetch<Page<Notification>>(`/api/notifications/?${params}`);
}

export const getUnreadCount = () =>
  apiFetch<{ unread_count: number }>("/api/notifications/unread-count/").then((r) => r.unread_count);

export const markNotificationRead = (id: number) =>
  apiFetch<Notification>(`/api/notifications/${id}/read/`, { method: "POST" });

export const markAllNotificationsRead = () =>
  apiFetch<{ marked_read: number }>("/api/notifications/mark-all-read/", { method: "POST" });

export const deleteNotification = (id: number) =>
  apiFetch<null>(`/api/notifications/${id}/`, { method: "DELETE" });

// ---- WebSocket URL ------------------------------------------------------
// Same base URL and token key as lib/api.ts. VITE_API_URL has no /api suffix
// in this project, so http(s)://host  ->  ws(s)://host.
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export function buildNotificationsWsUrl(): string | null {
  const token = window.localStorage.getItem("easyearn_access");
  if (!token) return null;
  return `${API_BASE_URL.replace(/^http/, "ws")}/ws/notifications/?token=${encodeURIComponent(token)}`;
}

// ---- Presentation -------------------------------------------------------
// Tailwind needs complete class strings (it can't see dynamically built
// ones), so each tone is spelled out. The 500 shades read well on both the
// dark and light themes; "system" uses the dash-* tokens so it adapts.
export const TYPE_META: Record<NotificationType, { label: string; icon: typeof BellIcon; tone: string }> = {
  deposit:      { label: "Deposit",      icon: ArrowDownCircleIcon, tone: "text-emerald-500 bg-emerald-500/10 ring-emerald-500/30" },
  withdrawal:   { label: "Withdrawal",   icon: ArrowUpCircleIcon,   tone: "text-orange-500 bg-orange-500/10 ring-orange-500/30" },
  refund:       { label: "Refund",       icon: WalletIcon,          tone: "text-sky-500 bg-sky-500/10 ring-sky-500/30" },
  survey:       { label: "Survey",       icon: ClipboardIcon,       tone: "text-violet-500 bg-violet-500/10 ring-violet-500/30" },
  movie_review: { label: "Movie review", icon: FilmIcon,            tone: "text-pink-500 bg-pink-500/10 ring-pink-500/30" },
  app_review:   { label: "App review",   icon: SmartphoneIcon,      tone: "text-cyan-500 bg-cyan-500/10 ring-cyan-500/30" },
  wheel:        { label: "Wheel spin",   icon: WheelIcon,           tone: "text-amber-500 bg-amber-500/10 ring-amber-500/30" },
  chat:         { label: "Chat",         icon: ChatBubbleIcon,      tone: "text-green-500 bg-green-500/10 ring-green-500/30" },
  referral:     { label: "Referral",     icon: LinkIcon,            tone: "text-fuchsia-500 bg-fuchsia-500/10 ring-fuchsia-500/30" },
  loan:         { label: "Loan",         icon: PiggyBankIcon,       tone: "text-yellow-600 bg-yellow-500/10 ring-yellow-500/30" },
  plan:         { label: "Plan",         icon: ShieldCheckIcon,     tone: "text-indigo-500 bg-indigo-500/10 ring-indigo-500/30" },
  system:       { label: "System",       icon: BellIcon,            tone: "text-dash-text/70 bg-dash-overlay ring-dash-border" },
  promo:        { label: "Promotion",    icon: StarIcon,            tone: "text-rose-500 bg-rose-500/10 ring-rose-500/30" },
};

// Filter tabs. `types` is sent as ?type=a,b,c so each tab is ONE request.
export const FILTERS: { key: string; label: string; types: NotificationType[] | null; unread?: boolean }[] = [
  { key: "all",      label: "All",      types: null },
  { key: "unread",   label: "Unread",   types: null, unread: true },
  { key: "earnings", label: "Earnings", types: ["survey", "movie_review", "app_review", "wheel", "chat", "referral"] },
  { key: "money",    label: "Money",    types: ["deposit", "withdrawal", "refund", "plan"] },
  { key: "loans",    label: "Loans",    types: ["loan"] },
  { key: "promo",    label: "Promos",   types: ["promo"] },
  { key: "system",   label: "System",   types: ["system"] },
];

// "+KES 20.00" / "-KES 100.00" using the currency the server stored with the notification.
export function formatSignedAmount(amount: string, code: string) {
  const n = Number(amount);
  const body = Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${n >= 0 ? "+" : "-"}${code || "KES"} ${body}`;
}

export function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "short" });
}

// Timeline buckets for the page.
export function dayBucket(iso: string): "Today" | "Yesterday" | "Earlier" {
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diff = Math.round((startOf(new Date()) - startOf(new Date(iso))) / 86_400_000);
  return diff <= 0 ? "Today" : diff === 1 ? "Yesterday" : "Earlier";
}