import { useEffect, useState } from "react";
import { LightbulbIcon, ClockIcon } from "@/components/icons/Icons";

// Rotating platform tips/facts — deliberately NOT fabricated user activity
// (e.g. "@john earned Ksh 3000") since that would misrepresent real other
// users' earnings. These are genuinely true, general statements about how
// the platform works.
const TIPS = [
  "Higher-tier plans unlock more chat profiles, apps, and movies to review each day.",
  "Survey questions go live every Monday, Wednesday, and Friday — score all 10 for the top payout.",
  "You get 3 wheel spins a day — they reset at midnight.",
  "Withdrawals start at Ksh 200 minimum.",
  "Deposits via M-Pesa are credited instantly once you confirm the prompt on your phone.",
  "Referral commissions land in your Yield Wallet as soon as your referral buys a plan.",
];

const TIP_ROTATE_MS = 6000;

export default function DashboardFooter() {
  const [now, setNow] = useState(new Date());
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const clockTimer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(clockTimer);
  }, []);

  useEffect(() => {
    const tipTimer = setInterval(() => setTipIndex((i) => (i + 1) % TIPS.length), TIP_ROTATE_MS);
    return () => clearInterval(tipTimer);
  }, []);

  return (
    <footer className="border-t border-dash-border px-4 py-4 md:px-6">
      <div className="flex flex-col items-center justify-between gap-3 text-xs text-dash-text/40 sm:flex-row">
        <div className="flex items-center gap-1.5">
          <LightbulbIcon size={14} className="shrink-0 text-dash-warn-500" />
          <span className="text-dash-text/60">{TIPS[tipIndex]}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <ClockIcon size={14} />
          <span>
            {now.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} ·{" "}
            {now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </span>
        </div>
      </div>
    </footer>
  );
}
