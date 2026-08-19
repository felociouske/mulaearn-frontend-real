import { useEffect, useState } from "react";
import { getMyLoanApplications, type LoanApplication, type RepaymentStatus } from "@/lib/loans";
import { formatAmount } from "@/lib/wallet";

const STATUS_STYLES: Record<RepaymentStatus, string> = {
  owing: "bg-dash-warn-500/15 text-dash-warn-500",
  paid: "bg-dash-accent-500/15 text-dash-accent-500",
  written_off: "bg-red-500/15 text-red-400",
};

const STATUS_LABELS: Record<RepaymentStatus, string> = {
  owing: "Owing",
  paid: "Paid",
  written_off: "Written off",
};

export default function LoanHistoryPage() {
  const [applications, setApplications] = useState<LoanApplication[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMyLoanApplications()
      .then(setApplications)
      .catch(() => setError("Couldn't load your loan history — please refresh the page."));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-dash-text">Loan History</h1>
      <p className="mt-1 text-sm text-dash-text/50">Every loan you've applied for, most recent first.</p>

      {error && <p className="mt-4 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}

      {applications === null && !error ? (
        <p className="mt-8 text-dash-text/50">Loading…</p>
      ) : applications && applications.length === 0 ? (
        <div className="mt-8 rounded-lg bg-dash-surface p-6 text-dash-text/70">
          You haven't applied for a loan yet.
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-dash-border">
          <table className="min-w-full divide-y divide-dash-border text-sm">
            <thead className="bg-dash-overlay/60 text-left text-xs font-medium uppercase tracking-wide text-dash-text/50">
              <tr>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Owed</th>
                <th className="px-4 py-3">Due date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Applied</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dash-border">
              {applications?.map((app) => (
                <tr key={app.id}>
                  <td className="px-4 py-3 text-dash-text">{app.loan_plan.name}</td>
                  <td className="px-4 py-3 text-dash-text">
                    {app.loan_plan.currency_code} {formatAmount(app.amount)}
                  </td>
                  <td className="px-4 py-3 text-dash-text">
                    {app.loan_plan.currency_code} {formatAmount(app.amount_owed)}
                  </td>
                  <td className="px-4 py-3 text-dash-text/70">{app.due_date}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[app.repayment_status]}`}>
                      {STATUS_LABELS[app.repayment_status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-dash-text/50">{new Date(app.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}