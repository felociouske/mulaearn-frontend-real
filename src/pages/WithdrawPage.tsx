import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { formatAmount } from "@/lib/wallet";
import { getMyWithdrawals, type WithdrawalRequest } from "@/lib/payments";
import WithdrawalForm from "@/components/dashboard/WithdrawalForm";

const statusColor = (status: string) =>
  status === "approved" ? "text-dash-accent-500" : status === "rejected" ? "text-red-400" : "text-dash-warn-500";

export default function WithdrawPage() {
  const { user } = useAuth();
  const currencyCode = user?.country?.currency_code ?? "KES";
  const currencySymbol = user?.country?.currency_symbol ?? "KSh";
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [error, setError] = useState<string | null>(null);

  function loadWithdrawals() {
    getMyWithdrawals()
      .then(setWithdrawals)
      .catch(() => setError("Couldn't load your withdrawal history — please refresh the page."));
  }

  useEffect(loadWithdrawals, []);

  // This page only handles Account Balance withdrawals. Yield Wallet
  // withdrawals have their own form on the Referrals page.
  const accountWithdrawals = withdrawals.filter((w) => w.wallet_type === "account");

  return (
    <div>
      <h1 className="text-2xl font-bold text-dash-text">Withdraw</h1>
      {error && <p className="mt-4 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg bg-dash-surface p-5">
          <WithdrawalForm walletType="account" currencyCode={currencyCode} onSuccess={loadWithdrawals} />
        </div>
        <div className="divide-y divide-dash-border rounded-lg bg-dash-surface">
          <p className="p-4 text-xs font-semibold uppercase tracking-wide text-dash-text/40">Your withdrawal requests</p>
          {accountWithdrawals.length === 0 && <p className="p-4 text-sm text-dash-text/50">No withdrawal requests yet.</p>}
          {accountWithdrawals.map((w) => (
            <div key={w.id} className="flex items-center justify-between p-4 text-sm">
              <div>
                <p className="text-dash-text">
                  {currencySymbol} {formatAmount(w.amount)} <span className="text-dash-text/40">({w.wallet_type})</span>
                </p>
                <p className="text-dash-text/40">{new Date(w.created_at).toLocaleString()}</p>
              </div>
              <p className={`capitalize ${statusColor(w.status)}`}>{w.status}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}