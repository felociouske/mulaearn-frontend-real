import { useEffect, useRef, useState, type FormEvent } from "react";
import { createDeposit, initiateSTKPush, getDepositStatus } from "@/lib/payments";
import { useToast } from "@/lib/toast-context";
import { getFriendlyErrorMessage } from "@/lib/error-messages";
import { SmartphoneIcon, ShieldCheckIcon } from "@/components/icons/Icons";

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 90000; // give up after 90s — the user likely ignored/missed the prompt

type Mode = "mpesa" | "manual";

export default function DepositForm({ currencyCode, onSuccess }: { currencyCode: string; onSuccess: () => void }) {
  const toast = useToast();
  // M-Pesa STK push is Kenya-only (Daraja doesn't support other currencies) —
  // other countries only ever see the manual tab.
  const [mode, setMode] = useState<Mode>(currencyCode === "KES" ? "mpesa" : "manual");

  const [amount, setAmount] = useState("");
  const [proofMessage, setProofMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [stkStatus, setStkStatus] = useState<"idle" | "waiting" | "success" | "failed">("idle");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  async function handleManualSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createDeposit({ amount, currency_code: currencyCode, proof_message: proofMessage });
      toast.success("Deposit request submitted — an admin will review it shortly.");
      setAmount("");
      setProofMessage("");
      onSuccess();
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleMpesaSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setStkStatus("idle");
    try {
      const { deposit_id } = await initiateSTKPush(Math.round(Number(amount)));
      setStkStatus("waiting");

      const startedAt = Date.now();
      pollRef.current = setInterval(async () => {
        if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
          if (pollRef.current) clearInterval(pollRef.current);
          setStkStatus("failed");
          toast.info("Didn't receive confirmation in time — if you completed the payment, it'll still be credited once M-Pesa confirms.");
          return;
        }
        try {
          const status = await getDepositStatus(deposit_id);
          if (status.status === "approved") {
            if (pollRef.current) clearInterval(pollRef.current);
            setStkStatus("success");
            toast.success(`You've been credited ${currencyCode} ${status.amount}!`);
            setAmount("");
            onSuccess();
          } else if (status.status === "rejected") {
            if (pollRef.current) clearInterval(pollRef.current);
            setStkStatus("failed");
            toast.error("Oops! That payment wasn't completed — it may have been cancelled on your phone.");
          }
        } catch {
          /* a missed poll tick isn't worth surfacing as an error */
        }
      }, POLL_INTERVAL_MS);
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err));
      setStkStatus("idle");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      {currencyCode === "KES" && (
        <div className="mb-3 flex gap-1 rounded-md bg-dash-overlay p-1">
          <button
            type="button"
            onClick={() => setMode("mpesa")}
            className={`flex-1 rounded px-3 py-1.5 text-xs font-medium transition-colors ${
              mode === "mpesa" ? "bg-dash-accent-500 text-dash-bg" : "text-dash-text/60 hover:text-dash-text"
            }`}
          >
            M-Pesa (instant)
          </button>
          <button
            type="button"
            onClick={() => setMode("manual")}
            className={`flex-1 rounded px-3 py-1.5 text-xs font-medium transition-colors ${
              mode === "manual" ? "bg-dash-accent-500 text-dash-bg" : "text-dash-text/60 hover:text-dash-text"
            }`}
          >
            Manual
          </button>
        </div>
      )}

      {mode === "mpesa" ? (
        <form onSubmit={handleMpesaSubmit} className="space-y-3">
          <p className="text-xs text-dash-text/50">
            Enter an amount and you'll get an M-Pesa prompt on your phone — enter your PIN there to complete it.
            Your deposit wallet is credited automatically, instantly.
          </p>

          {stkStatus === "waiting" && (
            <p className="flex items-center gap-2 rounded-md bg-dash-accent-500/10 px-3 py-2 text-xs text-dash-accent-500">
              <SmartphoneIcon size={14} /> Check your phone and enter your M-Pesa PIN…
            </p>
          )}
          {stkStatus === "success" && (
            <p className="flex items-center gap-2 rounded-md bg-dash-accent-500/10 px-3 py-2 text-xs text-dash-accent-500">
              <ShieldCheckIcon size={14} /> Payment received — your deposit wallet has been credited.
            </p>
          )}

          <div>
            <label className="block text-xs font-medium text-dash-text/70" htmlFor="mpesa-amount">
              Amount (KES)
            </label>
            <input
              id="mpesa-amount"
              type="number"
              min="1"
              step="1"
              required
              disabled={stkStatus === "waiting"}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 w-full rounded-md border border-dash-border bg-dash-overlay px-3 py-2 text-sm text-dash-text focus:border-dash-accent-500 focus:outline-none disabled:opacity-50"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting || stkStatus === "waiting"}
            className="w-full rounded-md bg-dash-accent-500 px-4 py-2 text-sm font-semibold text-dash-bg transition-colors hover:bg-dash-accent-600 disabled:opacity-60"
          >
            {stkStatus === "waiting" ? "Waiting for confirmation…" : isSubmitting ? "Sending prompt…" : "Pay with M-Pesa"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleManualSubmit} className="space-y-3">
          <p className="text-xs text-dash-text/50">
            Submit your payment confirmation message below — an admin will review and credit your deposit wallet.
          </p>
          <div>
            <label className="block text-xs font-medium text-dash-text/70" htmlFor="deposit-amount">
              Amount ({currencyCode})
            </label>
            <input
              id="deposit-amount"
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 w-full rounded-md border border-dash-border bg-dash-overlay px-3 py-2 text-sm text-dash-text focus:border-dash-accent-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-dash-text/70" htmlFor="proof">
              Payment confirmation message
            </label>
            <textarea
              id="proof"
              required
              rows={3}
              value={proofMessage}
              onChange={(e) => setProofMessage(e.target.value)}
              placeholder="e.g. M-Pesa confirmation SMS text"
              className="mt-1 w-full rounded-md border border-dash-border bg-dash-overlay px-3 py-2 text-sm text-dash-text focus:border-dash-accent-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-dash-accent-500 px-4 py-2 text-sm font-semibold text-dash-bg transition-colors hover:bg-dash-accent-600 disabled:opacity-60"
          >
            {isSubmitting ? "Submitting…" : "Submit deposit request"}
          </button>
        </form>
      )}
    </div>
  );
}