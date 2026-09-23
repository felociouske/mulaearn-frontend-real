import { useEffect, useRef, useState, type FormEvent } from "react";
import { getActivationGateways, type PaymentGateway } from "@/lib/activation";
import { createDeposit, initiateSTKPush, getDepositStatus } from "@/lib/payments";
import { useToast } from "@/lib/toast-context";
import { getFriendlyErrorMessage } from "@/lib/error-messages";
import { SmartphoneIcon, ShieldCheckIcon, LinkIcon, PhoneIcon } from "@/components/icons/Icons";

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 90000; // give up after 90s — the user likely ignored/missed the prompt

// The one bit of destination info worth surfacing as its own labeled row
// per group, on top of whatever's already written into `description`.
// Kept intentionally small — description is the source of truth for the
// actual step-by-step guide, this is just a quick-glance detail.
function GatewayDestination({ gateway }: { gateway: PaymentGateway }) {
  if (gateway.group === "kenya") {
    return gateway.till_number ? (
      <p className="text-xs text-dash-text/60">
        Till number: <span className="font-semibold text-dash-text">{gateway.till_number}</span>
      </p>
    ) : null;
  }
  if (gateway.group === "ghana_nigeria") {
    return (
      <a
        href={gateway.eversend_link}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-dash-accent-500 hover:underline"
      >
        <LinkIcon size={13} /> Open Eversend to pay {gateway.recipient_name}
      </a>
    );
  }
  // uganda_tanzania and other share the same recipient_name + recipient_phone shape.
  return (
    <p className="flex items-center gap-1.5 text-xs text-dash-text/60">
      <PhoneIcon size={13} />
      Send to <span className="font-semibold text-dash-text">{gateway.recipient_phone}</span> ({gateway.recipient_name})
    </p>
  );
}

export default function DepositForm({ currencyCode, onSuccess }: { currencyCode: string; onSuccess: () => void }) {
  const toast = useToast();

  const [gateways, setGateways] = useState<PaymentGateway[] | null>(null); // null = still loading
  const [gatewaysError, setGatewaysError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [amount, setAmount] = useState("");
  const [proofMessage, setProofMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [stkStatus, setStkStatus] = useState<"idle" | "waiting" | "success" | "failed">("idle");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  useEffect(() => {
    getActivationGateways()
      .then((list) => {
        setGateways(list);
        if (list.length > 0) setSelectedId(list[0].id);
      })
      .catch(() => setGatewaysError("Couldn't load payment methods — please refresh the page."));
  }, []);

  const selectedGateway = gateways?.find((g) => g.id === selectedId) ?? null;
  const isKenyaAutomatic = selectedGateway?.group === "kenya" && selectedGateway.is_automatic;

  async function handleManualSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedGateway) return;
    setIsSubmitting(true);
    try {
      await createDeposit({
        amount,
        currency_code: currencyCode,
        gateway_id: selectedGateway.id,
        proof_message: proofMessage,
      });
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

  if (gatewaysError) {
    return <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">{gatewaysError}</p>;
  }

  if (gateways === null) {
    return <p className="text-sm text-dash-text/50">Loading payment methods…</p>;
  }

  if (gateways.length === 0) {
    return (
      <div className="rounded-md bg-dash-overlay px-3 py-3">
        <p className="text-sm text-dash-text/60">
          Deposits aren't available for your country yet. Contact support and we'll help you top up another way.
        </p>
        <a
          href="https://wa.me/254750518501?text=Hi%2C%20I%20need%20help%20making%20a%20deposit"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Contact support on WhatsApp"
          className="relative mt-3 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-[#25D366]/30 transition-transform hover:scale-105 active:scale-95"
        >
          <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-[#25D366] opacity-75" />
          <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 fill-current" aria-hidden="true">
            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.29-1.39a9.9 9.9 0 0 0 4.75 1.21h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm5.8 14.13c-.24.68-1.4 1.3-1.93 1.36-.5.06-1.03.28-3.44-.72-2.9-1.21-4.77-4.17-4.92-4.36-.14-.2-1.18-1.57-1.18-3 0-1.42.75-2.12 1.01-2.41.26-.28.58-.35.77-.35.2 0 .39 0 .56.01.18.01.42-.07.65.5.24.58.82 2 .89 2.15.07.14.12.32.02.51-.1.2-.15.32-.29.5-.15.17-.31.39-.45.52-.15.14-.3.3-.13.6.17.28.76 1.26 1.63 2.04 1.12 1 2.06 1.31 2.35 1.46.29.15.46.13.63-.07.17-.2.72-.84.92-1.13.19-.28.38-.24.64-.14.26.1 1.65.78 1.94.92.28.14.47.21.54.33.07.13.07.71-.17 1.38Z" />
          </svg>
          WhatsApp us
        </a>
      </div>
    );
  }

  return (
    <div>
      {/* One tab per active gateway — for Kenya this is "M-Pesa (Instant)" +
          "Manual"; for every other country it's usually a single option,
          in which case the tab row still renders (so the label is visible)
          but there's nothing to switch between. */}
      {gateways.length > 1 && (
        <div className="mb-3 flex gap-1 rounded-md bg-dash-overlay p-1">
          {gateways.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setSelectedId(g.id)}
              className={`flex-1 rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                g.id === selectedId ? "bg-dash-accent-500 text-dash-bg" : "text-dash-text/60 hover:text-dash-text"
              }`}
            >
              {g.display_name}
            </button>
          ))}
        </div>
      )}

      {selectedGateway && (
        <div className="mb-3 space-y-1.5 rounded-md bg-dash-overlay/60 px-3 py-2.5">
          <p className="whitespace-pre-line text-xs text-dash-text/70">{selectedGateway.description}</p>
          <GatewayDestination gateway={selectedGateway} />
        </div>
      )}

      {isKenyaAutomatic ? (
        <form onSubmit={handleMpesaSubmit} className="space-y-3">
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
              Amount ({currencyCode})
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
              placeholder="e.g. M-Pesa/Eversend confirmation message or transaction reference"
              className="mt-1 w-full rounded-md border border-dash-border bg-dash-overlay px-3 py-2 text-sm text-dash-text focus:border-dash-accent-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting || !selectedGateway}
            className="w-full rounded-md bg-dash-accent-500 px-4 py-2 text-sm font-semibold text-dash-bg transition-colors hover:bg-dash-accent-600 disabled:opacity-60"
          >
            {isSubmitting ? "Submitting…" : "Submit deposit request"}
          </button>
        </form>
      )}
    </div>
  );
}