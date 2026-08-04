import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  getActivationGateways,
  getActivationSubmissions,
  submitActivation,
  type ActivationSubmission,
  type PaymentGateway,
} from "@/lib/activation";
import { ApiError } from "@/lib/api";

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
              {latestSubmission!.gateway?.display_name ?? latestSubmission!.method_type}. We'll unlock your
              dashboard as soon as it's approved — this is usually quick, but you can check back here anytime.
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
                  We don't have an automated activation option set up for your country yet. Please contact
                  support for a quick deposit guide and we'll activate your account manually.
                </p>
              </div>
            ) : (
              <>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-dash-text/40">
                  Choose a payment method
                </h2>
                <div className="mt-3 space-y-3">
                  {gateways.map((gateway) => {
                    const isSelected = selectedGateway?.id === gateway.id;
                    const isDisabled = gateway.is_automatic; // Daraja STK push not wired up yet — manual works today
                    return (
                      <div key={gateway.id}>
                        <button
                          type="button"
                          disabled={isDisabled}
                          onClick={() => setSelectedGateway(isSelected ? null : gateway)}
                          className={`w-full rounded-xl p-4 text-left ring-1 transition-colors ${
                            isSelected
                              ? "bg-dash-accent-500/10 ring-dash-accent-500"
                              : "bg-dash-surface ring-dash-border hover:bg-dash-overlay"
                          } ${isDisabled ? "cursor-not-allowed opacity-50" : ""}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-dash-text">{gateway.display_name}</span>
                            {isDisabled ? (
                              <span className="text-xs text-dash-text/40">Coming soon — use manual below</span>
                            ) : (
                              <span className="text-xs text-dash-text/40">Manual — instant on approval</span>
                            )}
                          </div>
                        </button>

                        {isSelected && !isDisabled && (
                          <div className="mt-2 rounded-xl bg-dash-surface p-5 ring-1 ring-dash-border">
                            <div className="space-y-1 text-sm text-dash-text/70">
                              {gateway.till_number && <p>Till Number: <span className="text-dash-text">{gateway.till_number}</span></p>}
                              {gateway.paybill_number && <p>Paybill: <span className="text-dash-text">{gateway.paybill_number}</span></p>}
                              {gateway.account_reference && <p>Account: <span className="text-dash-text">{gateway.account_reference}</span></p>}
                              {gateway.recipient_phone && <p>Send to: <span className="text-dash-text">{gateway.recipient_phone}</span></p>}
                              {gateway.recipient_name && <p>Recipient name: <span className="text-dash-text">{gateway.recipient_name}</span></p>}
                            </div>
                            <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-dash-overlay p-3 text-sm text-dash-text/80 font-sans">
                              {gateway.instructions}
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
