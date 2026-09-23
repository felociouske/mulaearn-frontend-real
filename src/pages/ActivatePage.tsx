import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  getActivationGateways,
  getActivationSubmissions,
  getActivationSubmissionStatus,
  initiateActivationBluepayPush,
  submitActivation,
  type ActivationSubmission,
  type PaymentGateway,
} from "@/lib/activation";
import { ApiError } from "@/lib/api";
import { SmartphoneIcon, ShieldCheckIcon } from "@/components/icons/Icons";

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 90000; // give up after 90s — mirrors DepositForm's STK poll timeout

// Full destination details for a gateway — the same idea as
// DepositForm's compact GatewayDestination, but expanded to a labeled
// list since this page shows one gateway at a time, fully expanded,
// rather than a tab strip. `description` (the step-by-step guide) is
// rendered separately below this, shared verbatim with the deposit page.
function GatewayDetails({ gateway }: { gateway: PaymentGateway }) {
  if (gateway.group === "kenya") {
    return (
      <div className="space-y-1 text-sm text-dash-text/70">
        {gateway.till_number && <p>Till Number: <span className="text-dash-text">{gateway.till_number}</span></p>}
        {gateway.paybill_number && <p>Paybill: <span className="text-dash-text">{gateway.paybill_number}</span></p>}
        {gateway.account_reference && <p>Account: <span className="text-dash-text">{gateway.account_reference}</span></p>}
      </div>
    );
  }
  if (gateway.group === "ghana_nigeria") {
    return (
      <div className="space-y-1 text-sm text-dash-text/70">
        <p>Recipient name: <span className="text-dash-text">{gateway.recipient_name}</span></p>
        <a
          href={gateway.eversend_link}
          target="_blank"
          rel="noreferrer"
          className="inline-block font-medium text-dash-accent-500 hover:underline"
        >
          Open Eversend to pay →
        </a>
      </div>
    );
  }
  // uganda_tanzania and other share the same recipient_name + recipient_phone shape.
  return (
    <div className="space-y-1 text-sm text-dash-text/70">
      <p>Send to: <span className="text-dash-text">{gateway.recipient_phone}</span></p>
      <p>Recipient name: <span className="text-dash-text">{gateway.recipient_name}</span></p>
    </div>
  );
}

export default function ActivatePage() {
  const { user, logout, refreshUser } = useAuth();

  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [submissions, setSubmissions] = useState<ActivationSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway | null>(null);
  const [referenceCode, setReferenceCode] = useState("");
  const [proofMessage, setProofMessage] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [stkStatus, setStkStatus] = useState<"idle" | "waiting" | "success" | "failed">("idle");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const currencySymbol = user?.country?.currency_symbol ?? "";
  const currencyCode = user?.country?.currency_code ?? "";
  const activationFee = user?.country?.activation_fee ?? "0.00";

  function loadData() {
    setIsLoading(true);
    setLoadError(null);
    Promise.all([getActivationGateways(), getActivationSubmissions()])
      .then(([gatewayData, submissionData]) => {
        setGateways(gatewayData);
        setSubmissions(submissionData);
      })
      .catch(() => setLoadError("Couldn't load activation options — please refresh the page."))
      .finally(() => setIsLoading(false));
  }

  useEffect(loadData, []);

  const latestSubmission = submissions[0] ?? null;
  const isPending = latestSubmission?.status === "pending";
  const wasRejected = latestSubmission?.status === "rejected";

  async function handleRefreshStatus() {
    setIsRefreshing(true);
    try {
      await refreshUser();
      loadData();
    } finally {
      setIsRefreshing(false);
    }
  }

  async function handleMpesaActivate() {
    setSubmitError(null);
    setIsSubmitting(true);
    setStkStatus("idle");
    try {
      const { submission_id } = await initiateActivationBluepayPush();
      setStkStatus("waiting");

      const startedAt = Date.now();
      pollRef.current = setInterval(async () => {
        if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
          if (pollRef.current) clearInterval(pollRef.current);
          setStkStatus("failed");
          setSubmitError(
            "Didn't receive confirmation in time — if you completed the payment, your account will still be activated once M-Pesa confirms. Check back here or use \"Check status\" below.",
          );
          return;
        }
        try {
          const status = await getActivationSubmissionStatus(submission_id);
          if (status.status === "approved") {
            if (pollRef.current) clearInterval(pollRef.current);
            setStkStatus("success");
            await refreshUser();
            loadData();
          } else if (status.status === "rejected") {
            if (pollRef.current) clearInterval(pollRef.current);
            setStkStatus("failed");
            setSubmitError("That payment wasn't completed — it may have been cancelled on your phone. You can try again.");
          }
        } catch {
          /* a missed poll tick isn't worth surfacing as an error — next tick will retry */
        }
      }, POLL_INTERVAL_MS);
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      setStkStatus("idle");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedGateway) return;
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      await submitActivation({
        gateway_id: selectedGateway.id,
        reference_code: referenceCode,
        proof_message: proofMessage || undefined,
      });
      setSelectedGateway(null);
      setReferenceCode("");
      setProofMessage("");
      loadData();
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-dash-bg px-4 py-10 md:py-16">
      <div className="mx-auto w-full max-w-2xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-dash-text md:text-3xl">Activate your account</h1>
          <button onClick={logout} className="text-sm text-dash-text/40 hover:text-dash-text/70">
            Log out
          </button>
        </div>
        <p className="mt-2 text-sm text-dash-text/50">
          Hi {user?.username}, complete a one-time activation payment of{" "}
          <span className="font-semibold text-dash-text">
            {currencySymbol} {activationFee} {currencyCode}
          </span>{" "}
          to unlock your dashboard, surveys, and the spin wheel.
        </p>

        {loadError && (
          <p className="mt-4 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">{loadError}</p>
        )}

        {isPending && (
          <div className="mt-6 rounded-xl bg-dash-surface p-5 ring-1 ring-dash-accent-500/30">
            <p className="font-semibold text-dash-text">⏳ Your activation payment is under review</p>
            <p className="mt-1 text-sm text-dash-text/60">
              Submitted {new Date(latestSubmission!.created_at).toLocaleString()} via{" "}
              {latestSubmission!.gateway_display_name}. We'll unlock your dashboard as soon as it's approved —
              this is usually quick, but you can check back here anytime.
            </p>
            <button
              onClick={handleRefreshStatus}
              disabled={isRefreshing}
              className="mt-3 rounded-md bg-dash-accent-500 px-4 py-2 text-sm font-semibold text-dash-bg hover:bg-dash-accent-600 disabled:opacity-60"
            >
              {isRefreshing ? "Checking…" : "Check status"}
            </button>
          </div>
        )}

        {wasRejected && !isPending && (
          <div className="mt-6 rounded-xl bg-red-500/10 p-5 ring-1 ring-red-500/30">
            <p className="font-semibold text-red-400">Your last submission wasn't approved</p>
            {latestSubmission?.admin_notes && (
              <p className="mt-1 text-sm text-dash-text/70">{latestSubmission.admin_notes}</p>
            )}
            <p className="mt-1 text-sm text-dash-text/60">
              Double-check the details below and submit again.
            </p>
          </div>
        )}

        {isLoading ? (
          <p className="mt-8 text-dash-text/50">Loading payment options…</p>
        ) : !isPending && (
          <div className="mt-6">
            {gateways.length === 0 ? (
                <div className="rounded-xl bg-dash-surface p-6 ring-1 ring-dash-border">
                  <p className="font-semibold text-dash-text">Coming soon for {user?.country?.name ?? "your country"}</p>
                  <p className="mt-2 text-sm text-dash-text/60">
                    We don't have an automated activation option set up for your country yet. Contact our support team by tapping on the Whatsapp
                    icon for a quick guide on how to activate your account.
                  </p>
                  <a
                    href="https://wa.me/254750518501?text=Hi%2C%20I%20need%20help%20activating%20my%20MulaEarn%20account"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Contact support on WhatsApp"
                    className="relative mt-4 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#25D366]/30 transition-transform hover:scale-105 active:scale-95"
                  >
                    <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-[#25D366] opacity-75" />
                    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 fill-current" aria-hidden="true">
                      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.29-1.39a9.9 9.9 0 0 0 4.75 1.21h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm5.8 14.13c-.24.68-1.4 1.3-1.93 1.36-.5.06-1.03.28-3.44-.72-2.9-1.21-4.77-4.17-4.92-4.36-.14-.2-1.18-1.57-1.18-3 0-1.42.75-2.12 1.01-2.41.26-.28.58-.35.77-.35.2 0 .39 0 .56.01.18.01.42-.07.65.5.24.58.82 2 .89 2.15.07.14.12.32.02.51-.1.2-.15.32-.29.5-.15.17-.31.39-.45.52-.15.14-.3.3-.13.6.17.28.76 1.26 1.63 2.04 1.12 1 2.06 1.31 2.35 1.46.29.15.46.13.63-.07.17-.2.72-.84.92-1.13.19-.28.38-.24.64-.14.26.1 1.65.78 1.94.92.28.14.47.21.54.33.07.13.07.71-.17 1.38Z" />
                    </svg>
                    WhatsApp us
                  </a>
                </div>
            ) : (
              <>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-dash-text/40">
                  Choose a payment method
                </h2>
                <div className="mt-3 space-y-3">
                  {gateways.map((gateway) => {
                    const isSelected = selectedGateway?.id === gateway.id;
                    const isKenyaAutomatic = gateway.group === "kenya" && gateway.is_automatic;
                    return (
                      <div key={gateway.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedGateway(isSelected ? null : gateway)}
                          className={`w-full rounded-xl p-4 text-left ring-1 transition-colors ${
                            isSelected
                              ? "bg-dash-accent-500/10 ring-dash-accent-500"
                              : "bg-dash-surface ring-dash-border hover:bg-dash-overlay"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-dash-text">{gateway.display_name}</span>
                            {isKenyaAutomatic ? (
                              <span className="text-xs text-dash-accent-500">Instant — pay with M-Pesa</span>
                            ) : (
                              <span className="text-xs text-dash-text/40">Manual — instant on approval</span>
                            )}
                          </div>
                        </button>

                        {isSelected && isKenyaAutomatic && (
                          <div className="mt-2 rounded-xl bg-dash-surface p-5 ring-1 ring-dash-border">
                            <pre className="whitespace-pre-wrap rounded-lg bg-dash-overlay p-3 text-sm text-dash-text/80 font-sans">
                              {gateway.description}
                            </pre>

                            <div className="mt-4 space-y-3">
                              {submitError && (
                                <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">{submitError}</p>
                              )}
                              {stkStatus === "waiting" && (
                                <p className="flex items-center gap-2 rounded-md bg-dash-accent-500/10 px-3 py-2 text-xs text-dash-accent-500">
                                  <SmartphoneIcon size={14} /> Check your phone and enter your M-Pesa PIN…
                                </p>
                              )}
                              {stkStatus === "success" && (
                                <p className="flex items-center gap-2 rounded-md bg-dash-accent-500/10 px-3 py-2 text-xs text-dash-accent-500">
                                  <ShieldCheckIcon size={14} /> Payment received — your account is now activated!
                                </p>
                              )}
                              <button
                                type="button"
                                onClick={handleMpesaActivate}
                                disabled={isSubmitting || stkStatus === "waiting" || stkStatus === "success"}
                                className="w-full rounded-md bg-dash-accent-500 px-5 py-2.5 text-sm font-semibold text-dash-bg hover:bg-dash-accent-600 disabled:opacity-60 transition-colors"
                              >
                                {stkStatus === "waiting"
                                  ? "Waiting for confirmation…"
                                  : isSubmitting
                                    ? "Sending prompt…"
                                    : `Pay ${currencySymbol} ${activationFee} ${currencyCode} with M-Pesa`}
                              </button>
                            </div>
                          </div>
                        )}

                        {isSelected && !isKenyaAutomatic && (
                          <div className="mt-2 rounded-xl bg-dash-surface p-5 ring-1 ring-dash-border">
                            <GatewayDetails gateway={gateway} />
                            <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-dash-overlay p-3 text-sm text-dash-text/80 font-sans">
                              {gateway.description}
                            </pre>

                            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
                              {submitError && (
                                <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">{submitError}</p>
                              )}
                              <div>
                                <label className="block text-sm font-medium text-dash-text/70" htmlFor="reference">
                                  Transaction reference / M-Pesa code
                                </label>
                                <input
                                  id="reference"
                                  type="text"
                                  required
                                  value={referenceCode}
                                  onChange={(e) => setReferenceCode(e.target.value)}
                                  className="mt-1 w-full rounded-md bg-dash-overlay border border-dash-border px-3 py-2 text-sm text-dash-text focus:border-dash-accent-500 focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-dash-text/70" htmlFor="proof">
                                  Confirmation message <span className="text-dash-text/30">(optional)</span>
                                </label>
                                <textarea
                                  id="proof"
                                  rows={3}
                                  value={proofMessage}
                                  onChange={(e) => setProofMessage(e.target.value)}
                                  placeholder="Paste the full confirmation SMS here, if you have it"
                                  className="mt-1 w-full rounded-md bg-dash-overlay border border-dash-border px-3 py-2 text-sm text-dash-text focus:border-dash-accent-500 focus:outline-none"
                                />
                              </div>
                              <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full rounded-md bg-dash-accent-500 px-5 py-2.5 text-sm font-semibold text-dash-bg hover:bg-dash-accent-600 disabled:opacity-60 transition-colors"
                              >
                                {isSubmitting ? "Submitting…" : "I've paid — submit for review"}
                              </button>
                            </form>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}