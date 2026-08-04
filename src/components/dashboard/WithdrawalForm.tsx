import { useState, type FormEvent } from "react";
import { createWithdrawal } from "@/lib/payments";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { getFriendlyErrorMessage } from "@/lib/error-messages";
import { PhoneIcon } from "@/components/icons/Icons";

export default function WithdrawalForm({ currencyCode, onSuccess }: { currencyCode: string; onSuccess: () => void }) {
  const { user } = useAuth();
  const toast = useToast();
  const [walletType, setWalletType] = useState<"account" | "yield">("account");
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // No destination_details sent — the backend always uses the user's
      // own registered phone_number, regardless of what's in this form.
      await createWithdrawal({ wallet_type: walletType, amount, currency_code: currencyCode });
      toast.success("Withdrawal request submitted — an admin will review it shortly.");
      setAmount("");
      onSuccess();
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-dash-text/70">Withdraw from</label>
        <div className="mt-1 flex gap-2">
          {(["account", "yield"] as const).map((type) => (
            <button
              type="button"
              key={type}
              onClick={() => setWalletType(type)}
              className={`flex-1 rounded-md px-3 py-2 text-sm capitalize transition-colors ${
                walletType === type ? "bg-dash-accent-500 text-dash-bg" : "bg-dash-overlay text-dash-text/70"
              }`}
            >
              {type === "account" ? "Account Balance" : "Yield Wallet"}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-dash-text/70" htmlFor="withdraw-amount">
          Amount ({currencyCode})
        </label>
        <input
          id="withdraw-amount"
          type="number"
          step="0.01"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mt-1 w-full rounded-md bg-dash-overlay border border-dash-border px-3 py-2 text-sm text-dash-text focus:border-dash-accent-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-dash-text/70">M-Pesa number</label>
        <div className="mt-1 flex items-center gap-2 rounded-md border border-dash-border bg-dash-overlay px-3 py-2 text-sm text-dash-text/70">
          <PhoneIcon size={16} className="shrink-0" />
          {user?.phone_number || "No phone number on file"}
        </div>
        <p className="mt-1 text-xs text-dash-text/30">
          Withdrawals always go to your registered number. Contact customer care to change it.
        </p>
      </div>

      <button
        type="submit"
        disabled={isSubmitting || !user?.phone_number}
        className="w-full rounded-md bg-dash-accent-500 px-4 py-2 text-sm font-semibold text-dash-bg hover:bg-dash-accent-600 disabled:opacity-60 transition-colors"
      >
        {isSubmitting ? "Submitting…" : "Request withdrawal"}
      </button>
    </form>
  );
}