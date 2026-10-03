import { TYPE_META, formatSignedAmount, timeAgo, type Notification } from "@/lib/notifications";
import { XIcon } from "@/components/icons/Icons";

type Props = {
  n: Notification;
  onOpen: (n: Notification) => void;
  onDelete: (n: Notification) => void;
};

export default function NotificationCard({ n, onOpen, onDelete }: Props) {
  const meta = TYPE_META[n.type] ?? TYPE_META.system;
  const Icon = meta.icon;
  const hasAmount = n.amount !== null;
  const positive = hasAmount && Number(n.amount) >= 0;

  const deleteBtn = (
    <button
      onClick={(e) => { e.stopPropagation(); onDelete(n); }}
      aria-label="Delete notification"
      className="shrink-0 rounded-md p-1.5 text-dash-text/40 transition hover:bg-dash-overlay-strong hover:text-red-500 sm:opacity-0 sm:group-hover:opacity-100"
    >
      <XIcon size={14} />
    </button>
  );

  // Promotions get a bold banner instead of a plain row.
  if (n.type === "promo") {
    return (
      <div
        onClick={() => onOpen(n)}
        className={`group cursor-pointer rounded-xl bg-gradient-to-br from-rose-500/20 via-fuchsia-500/10 to-indigo-500/20 p-4 ring-1 ring-rose-500/30 transition hover:ring-rose-500/60 ${n.is_read ? "opacity-70" : ""}`}
      >
        <div className="flex items-start gap-3">
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ${meta.tone}`}><Icon size={20} /></span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-500">Promo</span>
              {!n.is_read && <span className="h-2 w-2 rounded-full bg-rose-500" />}
            </div>
            <h3 className="mt-1 font-semibold text-dash-text">{n.title}</h3>
            <p className="mt-0.5 text-sm text-dash-text/70">{n.message}</p>
            <p className="mt-2 text-xs text-dash-text/40">{timeAgo(n.created_at)}</p>
          </div>
          {deleteBtn}
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => onOpen(n)}
      className={`group relative flex cursor-pointer items-center gap-3 rounded-xl p-3.5 ring-1 transition ${
        n.is_read
          ? "bg-dash-surface/50 ring-dash-border hover:bg-dash-surface"
          : "bg-dash-surface ring-dash-border hover:bg-dash-overlay"
      }`}
    >
      {/* Unread marker: a green bar on the left edge, readable at a glance while scrolling. */}
      {!n.is_read && <span className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-dash-accent-500" />}

      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ${meta.tone}`}><Icon size={20} /></span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className={`truncate text-sm ${n.is_read ? "font-medium text-dash-text/70" : "font-semibold text-dash-text"}`}>{n.title}</h3>
          <span className="shrink-0 text-[11px] text-dash-text/40">{timeAgo(n.created_at)}</span>
        </div>
        <p className="mt-0.5 line-clamp-2 text-xs text-dash-text/50">{n.message}</p>
      </div>

      {hasAmount && (
        <span className={`shrink-0 rounded-lg px-2.5 py-1 text-sm font-bold tabular-nums ${
          positive ? "bg-dash-accent-500/10 text-dash-accent-500" : "bg-dash-warn-500/10 text-dash-warn-500"
        }`}>
          {formatSignedAmount(n.amount as string, n.currency_code)}
        </span>
      )}
      {deleteBtn}
    </div>
  );
}