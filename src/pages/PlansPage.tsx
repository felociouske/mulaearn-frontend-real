import { useEffect, useState } from "react";
import {
  getPlans,
  getMyActivePlans,
  purchasePlan,
  type Plan,
  type MyActivePlansByCategory,
} from "@/lib/plans";
import { getMyWallet, formatAmount } from "@/lib/wallet";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";

export default function PlansPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [activePlans, setActivePlans] = useState<MyActivePlansByCategory | null>(null);
  const [depositBalance, setDepositBalance] = useState<string>("0.00");
  const [error, setError] = useState<string | null>(null);
  const [purchasingId, setPurchasingId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const currencySymbol = user?.country?.currency_symbol ?? "KSh";

  function loadAll() {
    Promise.all([getPlans(), getMyActivePlans(), getMyWallet()])
      .then(([plansData, activePlansData, wallet]) => {
        setPlans(plansData);
        setActivePlans(activePlansData);
        setDepositBalance(wallet.deposit_balance);
      })
      .catch(() => setError("Couldn't load plans — please refresh the page."));
  }

  useEffect(loadAll, []);

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

  const unlockSummary = (plan: Plan) => {
    const items = [
      `${plan.unlocked_item_count} ${plan.category_display.toLowerCase()} unlocked`,
    ];

    if (plan.cashback_percentage) {
      items.push(`${plan.cashback_percentage}% cashback`);
    }

    plan.features.forEach((feature) => {
      items.push(feature.description);
    });

    return items;
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Plans</h1>
      <p className="mt-1 text-sm text-white/50">
        Your deposit wallet: {currencySymbol} {formatAmount(depositBalance)}
      </p>

      {error && <p className="mt-4 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}
      {successMessage && <p className="mt-4 rounded-md bg-dash-accent-500/10 px-3 py-2 text-sm text-dash-accent-500">{successMessage}</p>}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => {
          const isActive = activePlans?.[plan.category]?.plan?.id === plan.id;
          const isPurchasing = purchasingId === plan.id;
          return (
            <div
              key={plan.id}
              className={`rounded-lg p-5 ${isActive ? "bg-dash-accent-500/10 ring-1 ring-dash-accent-500" : "bg-dash-surface"}`}
            >
              <p className="font-semibold text-white">{plan.name}</p>
              <p className="mt-1 text-2xl font-bold text-white">
                {currencySymbol} {formatAmount(plan.price)}
              </p>
              <ul className="mt-4 space-y-1.5 text-sm text-white/70">
                {unlockSummary(plan).map((item) => (
                  <li key={item}>✓ {item}</li>
                ))}
              </ul>
              <button
                onClick={() => handlePurchase(plan)}
                disabled={isActive || isPurchasing}
                className="mt-5 w-full rounded-md bg-dash-accent-500 px-4 py-2 text-sm font-semibold text-dash-bg hover:bg-dash-accent-600 disabled:opacity-60 transition-colors"
              >
                {isActive ? "Current plan" : isPurchasing ? "Purchasing…" : "Purchase"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}