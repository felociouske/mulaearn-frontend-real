import { useEffect, useState } from "react";
import { getLoanPlans, purchaseLoanPlan, getLoanEligibility, type LoanPlan, type LoanEligibility } from "@/lib/loans";
import { getMyWallet, formatAmount } from "@/lib/wallet";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";

export default function LoanPlansPage() {
  const { user } = useAuth();
  const currencySymbol = user?.country?.currency_symbol ?? "";

  const [plans, setPlans] = useState<LoanPlan[]>([]);
  const [eligibility, setEligibility] = useState<LoanEligibility | null>(null);
  const [depositBalance, setDepositBalance] = useState("0.00");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [purchasingId, setPurchasingId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  function loadAll() {
    Promise.all([getLoanPlans(), getLoanEligibility(), getMyWallet()])
      .then(([plansData, eligibilityData, wallet]) => {
        setPlans(plansData);
        setEligibility(eligibilityData);
        setDepositBalance(wallet.deposit_balance);
      })
      .catch(() => setError("Couldn't load loan plans — please refresh the page."))
      .finally(() => setIsLoading(false));
  }

  useEffect(loadAll, []);

  async function handlePurchase(plan: LoanPlan) {
    setPurchasingId(plan.id);
    setError(null);
    setSuccessMessage(null);
    try {
      await purchaseLoanPlan(plan.id);
      setSuccessMessage(`Purchased ${plan.name} — you can now apply for a loan of ${currencySymbol} ${formatAmount(plan.min_amount)}–${formatAmount(plan.max_amount)}.`);
      loadAll();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't purchase that loan plan.");
    } finally {
      setPurchasingId(null);
    }
  }

  // Every tier at or below the highest one owned counts as "owned" for
  // display — buying Tier 3 makes Tier 1/2's cards show as owned too
  // (their range is just superseded, not lost — see get_loan_eligibility()
  // in loans/models.py). Only this — the eligible tier itself — drives
  // what range the Apply page will accept.
  const highestOwnedOrder = eligibility?.has_plan ? eligibility.loan_plan.order : 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-dash-text">Loan Plans</h1>
      <p className="mt-1 text-sm text-dash-text/50">
        Buy a tier to unlock the matching loan range. Tiers stack — buying a higher tier while you own a
        lower one just widens what you're eligible for; it doesn't reset anything.
      </p>
      <p className="mt-1 text-xs text-dash-text/40">
        Deposit wallet balance: {currencySymbol} {formatAmount(depositBalance)}
      </p>

      {error && <p className="mt-4 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}
      {successMessage && (
        <p className="mt-4 rounded-md bg-dash-accent-500/10 px-3 py-2 text-sm text-dash-accent-500">{successMessage}</p>
      )}

      {isLoading ? (
        <p className="mt-8 text-dash-text/50">Loading loan plans…</p>
      ) : plans.length === 0 ? (
        <div className="mt-8 rounded-lg bg-dash-surface p-6 text-dash-text/70">No loan plans are available yet.</div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const isOwned = plan.order <= highestOwnedOrder;
            const isCurrentEligibility = eligibility?.has_plan && eligibility.loan_plan.id === plan.id;
            return (
              <div
                key={plan.id}
                className={`flex flex-col rounded-xl border p-5 ${
                  isCurrentEligibility ? "border-dash-accent-500 bg-dash-accent-500/5" : "border-dash-border bg-dash-surface"
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-lg font-semibold text-dash-text">{plan.name}</p>
                  {isOwned && (
                    <span className="rounded-full bg-dash-accent-500/15 px-2 py-0.5 text-xs font-medium text-dash-accent-500">
                      {isCurrentEligibility ? "Your current range" : "Owned"}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-2xl font-bold text-dash-text">
                  {plan.currency_code} {formatAmount(plan.price_local)}
                </p>
                <p className="mt-3 text-sm text-dash-text/70">
                  Loan range: {plan.currency_code} {formatAmount(plan.min_amount)}–{formatAmount(plan.max_amount)}
                </p>
                <p className="mt-1 text-xs text-dash-text/40">{plan.repayment_period_days}-day repayment term</p>

                <button
                  onClick={() => handlePurchase(plan)}
                  disabled={purchasingId === plan.id}
                  className="mt-5 w-full rounded-md bg-dash-accent-500 px-4 py-2 text-sm font-semibold text-dash-bg transition-colors hover:bg-dash-accent-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {purchasingId === plan.id ? "Purchasing…" : isOwned ? "Purchase again" : "Purchase plan"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}