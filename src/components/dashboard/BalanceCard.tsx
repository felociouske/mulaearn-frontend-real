import type { ReactNode } from "react";

export default function BalanceCard({
  label,
  amount,
  currencySymbol,
  icon,
  accent = false,
}: {
  label: string;
  amount: string;
  currencySymbol: string;
  icon?: ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl border p-5 transition-transform hover:-translate-y-0.5 ${
        accent
          ? "border-dash-accent-500/40 bg-gradient-to-br from-dash-accent-500 to-dash-accent-600 text-dash-bg"
          : "border-dash-border bg-dash-surface text-dash-text"
      }`}
    >
      {/* Decorative corner glow — purely visual, no layout impact */}
      <div
        className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full blur-2xl ${
          accent ? "bg-white/20" : "bg-dash-accent-500/10"
        }`}
      />

      <div className="relative flex items-center justify-between">
        <p
          className={`text-xs font-medium uppercase tracking-wide ${
            accent ? "text-dash-bg/70" : "text-dash-text/50"
          }`}
        >
          {label}
        </p>
        {icon && <span className={accent ? "text-dash-bg/80" : "text-dash-text/50"}>{icon}</span>}
      </div>
      <p className="relative mt-2 text-2xl font-bold">
        {currencySymbol} {amount}
      </p>
    </div>
  );
}
