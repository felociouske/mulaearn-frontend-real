import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { formatAmount } from "@/lib/wallet";
import { getMyDeposits, type DepositRequest } from "@/lib/payments";
import DepositForm from "@/components/dashboard/DepositForm";

const statusColor = (status: string) =>
  status === "approved" ? "text-dash-accent-500" : status === "rejected" ? "text-red-400" : "text-dash-warn-500";

export default function DepositPage() {
  const { user } = useAuth();
  const currencyCode = user?.country?.currency_code ?? "KES";
  const currencySymbol = user?.country?.currency_symbol ?? "KSh";
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [error, setError] = useState<string | null>(null);

  function loadDeposits() {
    getMyDeposits()
      .then(setDeposits)
      .catch(() => setError("Couldn't load your deposit history — please refresh the page."));
  }

  useEffect(loadDeposits, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-dash-text">Deposit</h1>
      <p className="mt-1 text-sm text-dash-text/50">Top up your deposit wallet to purchase plans.</p>

      {error && <p className="mt-4 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg bg-dash-surface p-5">
          <DepositForm currencyCode={currencyCode} onSuccess={loadDeposits} />
        </div>
        <div className="divide-y divide-dash-border rounded-lg bg-dash-surface">
          <p className="p-4 text-xs font-semibold uppercase tracking-wide text-dash-text/40">Your deposit requests</p>
          {deposits.length === 0 && <p className="p-4 text-sm text-dash-text/50">No deposit requests yet.</p>}
          {deposits.map((d) => (
            <div key={d.id} className="flex items-center justify-between p-4 text-sm">
              <div>
                <p className="text-dash-text">{currencySymbol} {formatAmount(d.amount)}</p>
                <p className="text-dash-text/40">{new Date(d.created_at).toLocaleString()}</p>
              </div>
              <p className={`capitalize ${statusColor(d.status)}`}>{d.status}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}