import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getMyCommissions, getMyReferralSummary, getReferredUsers, type ReferralCommission, type ReferralSummary, type ReferredUser } from "@/lib/referrals";
import { getMyWallet, formatAmount, type Wallet } from "@/lib/wallet";
import { getMyWithdrawals, type WithdrawalRequest } from "@/lib/payments";
import { ShieldCheckIcon, MailIcon, PhoneIcon } from "@/components/icons/Icons";
import WithdrawalForm from "@/components/dashboard/WithdrawalForm";

const statusColor = (status: string) =>
  status === "approved" ? "text-dash-accent-500" : status === "rejected" ? "text-red-400" : "text-dash-warn-500";

export default function ReferralsPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<ReferralSummary | null>(null);
  const [commissions, setCommissions] = useState<ReferralCommission[]>([]);
  const [referredUsers, setReferredUsers] = useState<ReferredUser[]>([]);
  const [, setWallet] = useState<Wallet | null>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const currencyCode = user?.country?.currency_code ?? "KES";
  const currencySymbol = user?.country?.currency_symbol ?? "KSh";
  // IMPORTANT: uses window.location.origin (THIS app's own domain), not the
  // public Next.js marketing site's domain — /register lives here now, in
  // the dashboard app, so that's where the referral link must point.
  const referralLink = user ? `${window.location.origin}/register?ref=${user.referral_code}` : "";

  function loadWithdrawals() {
    getMyWithdrawals()
      .then(setWithdrawals)
      .catch(() => setError("Couldn't load your withdrawal history — please refresh the page."));
  }

  useEffect(() => {
    Promise.all([getMyReferralSummary(), getMyCommissions(), getReferredUsers(), getMyWallet()])
      .then(([summaryData, commissionsData, referredData, walletData]) => {
        setSummary(summaryData);
        setCommissions(commissionsData);
        setReferredUsers(referredData);
        setWallet(walletData);
      })
      .catch(() => setError("Couldn't load your referral data — please refresh the page."));
    loadWithdrawals();
  }, []);

  // The Withdraw page only handles Account Balance — Yield Wallet
  // withdrawals (referral commissions) live here instead.
  const yieldWithdrawals = withdrawals.filter((w) => w.wallet_type === "yield");

  async function handleCopy() {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-dash-text">MulaEarn Leads</h1>
      <p className="mt-1 text-sm text-dash-text/50">
        Earn points when you refer friends and family to MulaEarn.
      </p>

      {error && <p className="mt-4 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}

      <div className="mt-6 rounded-lg bg-dash-surface p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-dash-text/40">Your unique link</p>
        <div className="mt-2 flex items-center gap-2">
          <input
            readOnly
            value={referralLink}
            className="flex-1 rounded-md bg-dash-overlay border border-dash-border px-3 py-2 text-sm text-dash-text/80"
          />
          <button
            onClick={handleCopy}
            className="rounded-md bg-dash-accent-500 px-4 py-2 text-sm font-semibold text-dash-bg hover:bg-dash-accent-600 transition-colors"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      {summary && (
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-dash-surface p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-dash-text/40">People Added</p>
            <p className="mt-2 text-2xl font-bold text-dash-text">{summary.total_referred_users}</p>
          </div>
          <div className="rounded-lg bg-dash-surface p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-dash-text/40">paid points</p>
            <p className="mt-2 text-2xl font-bold text-dash-text">{summary.paying_referrals}</p>
          </div>
          <div className="rounded-lg bg-dash-accent-500 p-5 text-dash-bg">
            <p className="text-xs font-medium uppercase tracking-wide text-dash-bg/70">Total points earned</p>
            <p className="mt-2 text-2xl font-bold">{currencySymbol} {formatAmount(summary.total_commission_earned)}</p>
          </div>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-dash-text">Withdraw your yield earnings</h2>
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg bg-dash-surface p-5">
            <WithdrawalForm walletType="yield" currencyCode={currencyCode} onSuccess={() => { loadWithdrawals(); getMyWallet().then(setWallet).catch(() => {}); }} />
          </div>
          <div className="divide-y divide-dash-border rounded-lg bg-dash-surface">
            <p className="p-4 text-xs font-semibold uppercase tracking-wide text-dash-text/40">Your yield withdrawal requests</p>
            {yieldWithdrawals.length === 0 && <p className="p-4 text-sm text-dash-text/50">No yield withdrawal requests yet.</p>}
            {yieldWithdrawals.map((w) => (
              <div key={w.id} className="flex items-center justify-between p-4 text-sm">
                <div>
                  <p className="text-dash-text">{currencySymbol} {formatAmount(w.amount)}</p>
                  <p className="text-dash-text/40">{new Date(w.created_at).toLocaleString()}</p>
                </div>
                <p className={`capitalize ${statusColor(w.status)}`}>{w.status}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-lg bg-dash-surface p-5">
        <h2 className="text-lg font-semibold text-dash-text">How to add more to MulaEarn</h2>
        <ol className="mt-4 space-y-4">
          {[
            { title: "Copy your link", body: "Use the unique link above — it already has your unique code embedded." },
            { title: "Share it", body: "Send it directly to friends and family, or post it in WhatsApp/Telegram groups and on social media." },
            { title: "They register", body: "Anyone who signs up through your link is automatically linked to you as your referral." },
            { title: "They activate & buy a plan", body: "Earn points upon account activation." },
            { title: "Get paid", body: "Your commission lands instantly in your Yield Wallet." },
          ].map((step, i) => (
            <li key={step.title} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-dash-accent-500/15 text-xs font-semibold text-dash-accent-500">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-medium text-dash-text">{step.title}</p>
                <p className="text-sm text-dash-text/50">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-dash-text">Your referrals</h2>
        <div className="mt-4 overflow-x-auto rounded-lg bg-dash-surface">
          {referredUsers.length === 0 ? (
            <p className="p-4 text-sm text-dash-text/50">No one has signed up with your link yet.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-dash-border text-xs uppercase tracking-wide text-dash-text/40">
                  <th className="p-4 font-medium">Referred user</th>
                  <th className="p-4 font-medium">Joined</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium text-right">Commission earned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dash-border">
                {referredUsers.map((ru) => (
                  <tr key={ru.id} className="align-top">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <MailIcon size={15} className="shrink-0 text-dash-text/40" />
                        <span className="font-semibold text-dash-text">{ru.email}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <PhoneIcon size={15} className="shrink-0 text-dash-text/40" />
                        <span className="font-medium text-dash-text/90">{ru.phone_number}</span>
                      </div>
                    </td>
                    <td className="p-4 text-dash-text/70">{new Date(ru.date_joined).toLocaleDateString()}</td>
                    <td className="p-4">
                      {ru.is_activated ? (
                        <span className="flex items-center gap-1 text-xs font-medium text-dash-accent-500">
                          <ShieldCheckIcon size={13} /> Activated
                        </span>
                      ) : (
                        <span className="text-xs text-dash-text/40">Not activated</span>
                      )}
                    </td>
                    <td className="p-4 text-right font-medium text-dash-accent-500">
                      {currencySymbol} {formatAmount(ru.commission_earned)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-dash-text">Commission history</h2>
        <div className="mt-4 divide-y divide-dash-border rounded-lg bg-dash-surface">
          {commissions.length === 0 && <p className="p-4 text-sm text-dash-text/50">No commissions yet.</p>}
          {commissions.map((c) => (
            <div key={c.id} className="flex items-center justify-between p-4 text-sm">
              <div>
                <p className="text-dash-text">
                  @{c.referred_username} {c.source === "activation" ? "activated their account" : "purchased a plan"}
                </p>
                <p className="text-dash-text/40">{new Date(c.created_at).toLocaleString()}</p>
              </div>
              <p className="text-dash-accent-500">+{formatAmount(c.amount)} {currencySymbol}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}