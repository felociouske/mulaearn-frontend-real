import type { ReactNode } from "react";
import { WalletIcon, PiggyBankIcon, ArrowUpCircleIcon, TrendingUpIcon } from "@/components/icons/Icons";

export type WalletCardVariant = "account" | "deposit" | "withdrawn" | "yield";

const VARIANT_CONFIG: Record<
  WalletCardVariant,
  { label: string; icon: ReactNode; gradient: string }
> = {
  account: {
    label: "Account Balance",
    icon: <WalletIcon size={20} />,
    gradient: "from-slate-700 to-slate-900",
  },
  deposit: {
    label: "Deposit Wallet",
    icon: <PiggyBankIcon size={20} />,
    gradient: "from-indigo-600 to-indigo-900",
  },
  withdrawn: {
    label: "Total Withdrawn",
    icon: <ArrowUpCircleIcon size={20} />,
    gradient: "from-amber-600 to-amber-800",
  },
  yield: {
    label: "Yield Wallet",
    icon: <TrendingUpIcon size={20} />,
    gradient: "from-dash-accent-500 to-dash-accent-600",
  },
};

// Styled like a physical bank/debit card rather than a plain stat tile —
// gradient face, embossed-style balance, a faint chip icon, and a
// cardholder-style footer row. No real card number is shown anywhere
// (there isn't one) — the dotted group is purely decorative texture, not
// meant to be read as an actual account/card number.
export default function WalletCard({
  variant,
  amount,
  currencySymbol,
  holderName,
}: {
  variant: WalletCardVariant;
  amount: string;
  currencySymbol: string;
  holderName?: string;
}) {
  const config = VARIANT_CONFIG[variant];

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${config.gradient} p-5 text-white shadow-lg`}
    >
      {/* Decorative texture — faint diagonal sheen, purely visual */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-black/10 blur-2xl" />

      <div className="relative flex items-center justify-between">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white/15">
          {config.icon}
        </div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/60">EasyEarn</p>
      </div>

      <p className="relative mt-5 text-xs font-medium uppercase tracking-wide text-white/60">
        {config.label}
      </p>
      <p className="relative mt-1 text-2xl font-bold tracking-tight">
        {currencySymbol} {amount}
      </p>

      <div className="relative mt-6 flex items-center justify-between">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span key={i} className="flex gap-0.5">
              {[0, 1, 2, 1].map((_, j) => (
                <span key={j} className="h-1 w-1 rounded-full bg-white/30" />
              ))}
              {i < 2 && <span className="mx-1 h-1 w-1" />}
            </span>
          ))}
        </div>
        {holderName && (
          <p className="text-[11px] font-medium uppercase tracking-wide text-white/70">@{holderName}</p>
        )}
      </div>
    </div>
  );
}