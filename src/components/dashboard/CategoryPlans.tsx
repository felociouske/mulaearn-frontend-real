import { useEffect, useState } from "react";
import {
  getPlansByCategory,
  getMyActivePlans,
  purchasePlan,
  type Plan,
  type PlanCategory,
  type PlanPurchase,
} from "@/lib/plans";
import { getMyWallet, formatAmount } from "@/lib/wallet";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";

export default function CategoryPlans({
  category,
  title,
  description,
}: {
  category: PlanCategory;
  title: string;
  description: string;
}) {
  const { user } = useAuth();
  const currencySymbol = user?.country?.currency_symbol ?? "";
  const [plans, setPlans] = useState<Plan[]>([]);
  const [activePlan, setActivePlan] = useState<PlanPurchase | null>(null);
  const [depositBalance, setDepositBalance] = useState<string>("0.00");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [purchasingId, setPurchasingId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  function loadAll() {
    Promise.all([getPlansByCategory(category), getMyActivePlans(), getMyWallet()])
      .then(([plansData, activePlans, wallet]) => {
        setPlans(plansData);
        setActivePlan(activePlans[category]);
        setDepositBalance(wallet.deposit_balance);
      })
      .catch(() => setError("Couldn't load plans — please refresh the page."))
      .finally(() => setIsLoading(false));
  }

  useEffect(loadAll, [category]);

  async function handlePurchase(plan: Plan) {
    setPurchasingId(plan.id);
    setError(null);
    setSuccessMessage(null);
    try {
      await purchasePlan(plan.id);
      setSuccessMessage(`You're now on the ${plan.name} plan!`);
      loadAll();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't purchase that plan.");
    } finally {
      setPurchasingId(null);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-dash-text">{title}</h1>
      <p className="mt-1 text-sm text-dash-text/50">{description}</p>
      <p className="mt-1 text-xs text-dash-text/40">
        Deposit wallet balance: {currencySymbol} {formatAmount(depositBalance)}
      </p>

      {error && <p className="mt-4 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}
      {successMessage && (
        <p className="mt-4 rounded-md bg-dash-accent-500/10 px-3 py-2 text-sm text-dash-accent-500">
          {successMessage}
        </p>
      )}

      {isLoading ? (
        <p className="mt-8 text-dash-text/50">Loading plans…</p>
      ) : plans.length === 0 ? (
        <div className="mt-8 rounded-lg bg-dash-surface p-6 text-dash-text/70">
          No plans are available for this category yet.
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const isActive = activePlan?.plan.id === plan.id;
            return (
              <div
                key={plan.id}
                className={`flex flex-col rounded-xl border p-5 ${
                  isActive ? "border-dash-accent-500 bg-dash-accent-500/5" : "border-dash-border bg-dash-surface"
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-lg font-semibold text-dash-text">{plan.name}</p>
                  {isActive && (
                    <span className="rounded-full bg-dash-accent-500/15 px-2 py-0.5 text-xs font-medium text-dash-accent-500">
                      Active
                    </span>
                  )}
                </div>
                <p className="mt-2 text-2xl font-bold text-dash-text">
                  {plan.currency_code} {formatAmount(plan.price_local)}
                </p>
                {plan.cashback_percentage && (
                  <p className="mt-1 text-xs font-medium text-dash-warn-500">
                    {plan.cashback_percentage}% cashback
                  </p>
                )}

                <ul className="mt-4 flex-1 space-y-1.5 text-sm text-dash-text/70">
                  <li>• Unlocks {plan.unlocked_item_count} items</li>
                  {plan.features.map((f) => (
                    <li key={f.id}>• {f.description}</li>
                  ))}
                </ul>

                <button
                  onClick={() => handlePurchase(plan)}
                  disabled={isActive || purchasingId === plan.id}
                  className="mt-5 w-full rounded-md bg-dash-accent-500 px-4 py-2 text-sm font-semibold text-dash-bg transition-colors hover:bg-dash-accent-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isActive ? "Current plan" : purchasingId === plan.id ? "Purchasing…" : "Purchase plan"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}