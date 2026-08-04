import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { getMyWallet, getMyTransactions, formatAmount, matchesTransactionFilter, type Wallet, type Transaction, type TransactionFilter } from "@/lib/wallet";
import WalletCard from "@/components/dashboard/WalletCard";
import { ArrowDownCircleIcon, ArrowUpCircleIcon } from "@/components/icons/Icons";

const FILTERS: { key: TransactionFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "deposits", label: "Deposits" },
  { key: "withdrawals", label: "Withdrawals" },
  { key: "tasks", label: "Tasks" },
];

export default function WalletPage() {
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

  const filteredTransactions = transactions.filter((tx) => matchesTransactionFilter(tx, filter));

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dash-text">Wallet</h1>
        <div className="flex gap-2">
          <Link
            to="/deposit"
            className="flex items-center gap-1.5 rounded-md bg-dash-surface px-3 py-1.5 text-sm font-medium text-dash-text transition-colors hover:bg-dash-overlay"
          >
            <ArrowDownCircleIcon size={16} /> Deposit
          </Link>
          <Link
            to="/withdraw"
            className="flex items-center gap-1.5 rounded-md bg-dash-surface px-3 py-1.5 text-sm font-medium text-dash-text transition-colors hover:bg-dash-overlay"
          >
            <ArrowUpCircleIcon size={16} /> Withdraw
          </Link>
        </div>
      </div>

      {error && <p className="mt-4 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}

      {wallet && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <WalletCard variant="account" amount={formatAmount(wallet.account_balance)} currencySymbol={currencySymbol} holderName={user?.username} />
          <WalletCard variant="deposit" amount={formatAmount(wallet.deposit_balance)} currencySymbol={currencySymbol} holderName={user?.username} />
          <WalletCard variant="withdrawn" amount={formatAmount(wallet.total_withdrawn)} currencySymbol={currencySymbol} holderName={user?.username} />
          <WalletCard variant="yield" amount={formatAmount(wallet.yield_balance)} currencySymbol={currencySymbol} holderName={user?.username} />
        </div>
      )}

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-dash-text/40">Transaction history</h2>
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

      <div className="mt-3 divide-y divide-dash-border rounded-lg bg-dash-surface">
        {filteredTransactions.length === 0 && (
          <p className="p-4 text-sm text-dash-text/50">
            {filter === "all" ? "No transactions yet." : "No matching transactions."}
          </p>
        )}
        {filteredTransactions.map((tx) => (
          <div key={tx.id} className="flex items-center justify-between p-4 text-sm">
            <div>
              <p className="text-dash-text">{tx.transaction_type_display}</p>
              <p className="text-dash-text/40">{new Date(tx.created_at).toLocaleString()}</p>
              {tx.description && <p className="text-dash-text/40">{tx.description}</p>}
            </div>
            <p className={Number(tx.amount) >= 0 ? "text-dash-accent-500" : "text-dash-warn-500"}>
              {Number(tx.amount) >= 0 ? "+" : ""}
              {formatAmount(tx.amount)} {currencySymbol}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}