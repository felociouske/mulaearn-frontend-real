import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { getMyWallet, getMyTransactions, formatAmount, matchesTransactionFilter, type Wallet, type Transaction, type TransactionFilter } from "@/lib/wallet";
import WalletCard from "@/components/dashboard/WalletCard";
import WelcomeBannerBackground from "@/components/dashboard/Welcomebannerbackground";
import { ShieldCheckIcon, ArrowUpCircleIcon, ArrowDownCircleIcon } from "@/components/icons/Icons";

// Accounts with total lifetime yield above this get a verification badge
// next to their name in the welcome banner.
const VERIFICATION_THRESHOLD = 100000;

const FILTERS: { key: TransactionFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "deposits", label: "Deposits" },
  { key: "withdrawals", label: "Withdrawals" },
  { key: "tasks", label: "Tasks" },
];

export default function OverviewPage() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<TransactionFilter>("all");
  const [error, setError] = useState<string | null>(null);

  const currencySymbol = user?.country?.currency_symbol ?? "KSh";

  useEffect(() => {
    Promise.all([getMyWallet(), getMyTransactions()])
      .then(([walletData, txData]) => {
        setWallet(walletData);
        setTransactions(txData);
      })
      .catch(() => setError("Couldn't load your wallet — please refresh the page."));
  }, []);

  const isVerified = wallet ? Number(wallet.total_yield_earned) > VERIFICATION_THRESHOLD : false;

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-2xl bg-linear-to-br from-dash-surface to-dash-bg p-6 ring-1 ring-dash-border md:p-8">
        <WelcomeBannerBackground />
        <div className="relative z-10">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold text-dash-text md:text-3xl">Welcome back, {user?.username}</h1>
          {isVerified && (
            <span
              title={`Verified — total yield over ${currencySymbol} ${VERIFICATION_THRESHOLD.toLocaleString()}`}
              className="flex items-center gap-1 rounded-full bg-dash-accent-500/15 px-2.5 py-1 text-xs font-medium text-dash-accent-500"
            >
              <ShieldCheckIcon size={14} /> Verified
            </span>
          )}
        </div>

        {wallet && (
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-sm text-dash-text/50">Total yield earned</span>
            <span className="text-xl font-bold text-dash-accent-500">
              {currencySymbol} {formatAmount(wallet.total_yield_earned)}
            </span>
          </div>
        )}

        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-dash-text/70">
          EasyEarn is a platform built to turn everyday time online into real income — chat with
          real people, review apps and movies, answer surveys, and spin for extra cash, all paid
          out in your own currency. Our goal is simple: make it straightforward for anyone,
          anywhere, to earn something meaningful from the internet, with no hidden steps and no
          guesswork about how to get started.
        </p>
        </div>
      </section>

      {error && <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}

      {!wallet ? (
        <p className="text-dash-text/50">Loading your balances…</p>
      ) : (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-dash-text/40">Your wallets</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <WalletCard variant="account" amount={formatAmount(wallet.account_balance)} currencySymbol={currencySymbol} holderName={user?.username} />
            <WalletCard variant="deposit" amount={formatAmount(wallet.deposit_balance)} currencySymbol={currencySymbol} holderName={user?.username} />
            <WalletCard variant="withdrawn" amount={formatAmount(wallet.total_withdrawn)} currencySymbol={currencySymbol} holderName={user?.username} />
            <WalletCard variant="yield" amount={formatAmount(wallet.yield_balance)} currencySymbol={currencySymbol} holderName={user?.username} />
          </div>
        </section>
      )}

      <section>
        <div className="flex gap-3">
          <Link
            to="/deposit"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-dash-surface px-5 py-4 font-semibold text-dash-text transition-colors hover:bg-dash-overlay sm:flex-none sm:px-8"
          >
            <ArrowDownCircleIcon size={18} /> Deposit
          </Link>
          <Link
            to="/withdraw"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-dash-surface px-5 py-4 font-semibold text-dash-text transition-colors hover:bg-dash-overlay sm:flex-none sm:px-8"
          >
            <ArrowUpCircleIcon size={18} /> Withdraw
          </Link>
        </div>
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-dash-text/40">Recent activity</h2>
          <Link to="/wallet" className="text-sm font-medium text-dash-accent-500 hover:underline">
            View all →
          </Link>
        </div>

        <div className="mt-3 flex gap-1 rounded-md bg-dash-overlay p-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex-1 rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === f.key ? "bg-dash-accent-500 text-dash-bg" : "text-dash-text/60 hover:text-dash-text"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="mt-3 divide-y divide-dash-border rounded-xl bg-dash-surface">
          {(() => {
            const filtered = transactions.filter((tx) => matchesTransactionFilter(tx, filter));
            if (filtered.length === 0) {
              return (
                <p className="p-4 text-sm text-dash-text/50">
                  {filter === "all" ? "No activity yet — go complete a task or start a chat!" : "No matching activity yet."}
                </p>
              );
            }
            return filtered.slice(0, 8).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-4 text-sm">
                <div>
                  <p className="text-dash-text">{tx.transaction_type_display}</p>
                  <p className="text-dash-text/40">{new Date(tx.created_at).toLocaleString()}</p>
                </div>
                <p className={Number(tx.amount) >= 0 ? "text-dash-accent-500" : "text-dash-warn-500"}>
                  {Number(tx.amount) >= 0 ? "+" : ""}
                  {formatAmount(tx.amount)} {currencySymbol}
                </p>
              </div>
            ));
          })()}
        </div>
      </section>
    </div>

  );
}