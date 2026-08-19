import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { getLoanEligibility, applyForLoan, type LoanEligibility } from "@/lib/loans";
import { formatAmount } from "@/lib/wallet";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";
import { PiggyBankIcon, ShieldCheckIcon } from "@/components/icons/Icons";

export default function ApplyLoanPage() {
  const { user, refreshUser } = useAuth();

  const [eligibility, setEligibility] = useState<LoanEligibility | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [sourceOfIncome, setSourceOfIncome] = useState("");
  const [repaymentMethod, setRepaymentMethod] = useState("");
  const [security, setSecurity] = useState("");
  const [amount, setAmount] = useState("");

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function loadEligibility() {
    getLoanEligibility()
      .then(setEligibility)
      .catch(() => setLoadError("Couldn't check your loan eligibility — please refresh the page."))
      .finally(() => setIsLoading(false));
  }

  useEffect(loadEligibility, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);
    try {
      const application = await applyForLoan({
        full_name: fullName,
        age: Number(age),
        source_of_income: sourceOfIncome,
        repayment_method: repaymentMethod,
        security,
        amount,
      });
      setSuccessMessage(
        `Approved — ${application.loan_plan.currency_code} ${formatAmount(application.amount)} has been credited to your account balance. Repayment due ${application.due_date}.`,
      );
      setAmount("");
      // Balance changed — refresh the cached user/wallet summary shown
      // elsewhere in the dashboard (topbar balance, etc.), same pattern
      // ActivatePage uses after a successful BluePay confirmation.
      refreshUser();
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Couldn't submit your loan application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <p className="text-dash-text/50">Checking your eligibility…</p>;
  }

  if (loadError) {
    return <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">{loadError}</p>;
  }

  if (!eligibility?.has_plan) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-dash-text">Apply for a Loan</h1>
        <div className="mt-6 rounded-xl border border-dashed border-dash-border bg-dash-surface/50 p-6">
          <div className="flex items-center gap-2 text-dash-text">
            <PiggyBankIcon size={20} className="text-dash-accent-500" />
            <p className="text-lg font-semibold">Plan needed</p>
          </div>
          <p className="mt-2 max-w-xl text-sm text-dash-text/60">
            You'll need a loan plan before you can apply — the tier you buy sets the amount range you can
            borrow.
          </p>
          <Link
            to="/loans/plans"
            className="mt-5 inline-block rounded-md bg-dash-accent-500 px-5 py-2.5 text-sm font-semibold text-dash-bg transition-colors hover:bg-dash-accent-600"
          >
            View plans
          </Link>
        </div>
      </div>
    );
  }

  const { loan_plan, min_amount, max_amount } = eligibility;

  return (
    <div>
      <h1 className="text-2xl font-bold text-dash-text">Apply for a Loan</h1>
      <p className="mt-1 text-sm text-dash-text/50">
        Your current plan ({loan_plan.name}) lets you borrow between {loan_plan.currency_code}{" "}
        {formatAmount(min_amount)} and {formatAmount(max_amount)}. Approved instantly — no limit on how many
        times you apply.
      </p>

      {submitError && <p className="mt-4 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">{submitError}</p>}
      {successMessage && (
        <p className="mt-4 flex items-center gap-2 rounded-md bg-dash-accent-500/10 px-3 py-2 text-sm text-dash-accent-500">
          <ShieldCheckIcon size={14} /> {successMessage}
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-6 max-w-xl space-y-4">
        {/* Auto-filled account details — read-only display, never sent as
            input (the backend snapshots these from request.user itself). */}
        <div className="grid gap-3 rounded-md bg-dash-overlay/60 p-4 text-sm sm:grid-cols-3">
          <div>
            <p className="text-xs text-dash-text/50">Email</p>
            <p className="text-dash-text">{user?.email}</p>
          </div>
          <div>
            <p className="text-xs text-dash-text/50">Phone</p>
            <p className="text-dash-text">{user?.phone_number}</p>
          </div>
          <div>
            <p className="text-xs text-dash-text/50">Country</p>
            <p className="text-dash-text">{user?.country?.name}</p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-dash-text/70" htmlFor="full-name">
            Full name
          </label>
          <input
            id="full-name"
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1 w-full rounded-md border border-dash-border bg-dash-overlay px-3 py-2 text-sm text-dash-text focus:border-dash-accent-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-dash-text/70" htmlFor="age">
            Age
          </label>
          <input
            id="age"
            type="number"
            min="18"
            max="100"
            required
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="mt-1 w-full rounded-md border border-dash-border bg-dash-overlay px-3 py-2 text-sm text-dash-text focus:border-dash-accent-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-dash-text/70" htmlFor="source-of-income">
            Source of income
          </label>
          <input
            id="source-of-income"
            type="text"
            required
            placeholder="e.g. Business, employment, freelance"
            value={sourceOfIncome}
            onChange={(e) => setSourceOfIncome(e.target.value)}
            className="mt-1 w-full rounded-md border border-dash-border bg-dash-overlay px-3 py-2 text-sm text-dash-text focus:border-dash-accent-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-dash-text/70" htmlFor="repayment-method">
            Repayment method
          </label>
          <input
            id="repayment-method"
            type="text"
            required
            placeholder="e.g. M-Pesa deduction, bank transfer"
            value={repaymentMethod}
            onChange={(e) => setRepaymentMethod(e.target.value)}
            className="mt-1 w-full rounded-md border border-dash-border bg-dash-overlay px-3 py-2 text-sm text-dash-text focus:border-dash-accent-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-dash-text/70" htmlFor="security">
            Security / collateral <span className="text-dash-text/40">(optional)</span>
          </label>
          <input
            id="security"
            type="text"
            value={security}
            onChange={(e) => setSecurity(e.target.value)}
            className="mt-1 w-full rounded-md border border-dash-border bg-dash-overlay px-3 py-2 text-sm text-dash-text focus:border-dash-accent-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-dash-text/70" htmlFor="amount">
            Amount ({loan_plan.currency_code} {formatAmount(min_amount)}–{formatAmount(max_amount)})
          </label>
          <input
            id="amount"
            type="number"
            min={min_amount}
            max={max_amount}
            step="1"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 w-full rounded-md border border-dash-border bg-dash-overlay px-3 py-2 text-sm text-dash-text focus:border-dash-accent-500 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-dash-accent-500 px-4 py-2 text-sm font-semibold text-dash-bg transition-colors hover:bg-dash-accent-600 disabled:opacity-60"
        >
          {isSubmitting ? "Submitting…" : "Submit application"}
        </button>
      </form>
    </div>
  );
}