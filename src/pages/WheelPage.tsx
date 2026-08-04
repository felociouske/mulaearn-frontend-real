import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { getFriendlyErrorMessage } from "@/lib/error-messages";
import { getWheelStatus, spinWheel, type WheelStatus } from "@/lib/wheel";
import { WheelIcon } from "@/components/icons/Icons";

export default function WheelPage() {
  const { user } = useAuth();
  const toast = useToast();
  const currencySymbol = user?.country?.currency_symbol ?? "KSh";
  const [status, setStatus] = useState<WheelStatus | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastWin, setLastWin] = useState<string | null>(null);

  function loadStatus() {
    getWheelStatus()
      .then(setStatus)
      .catch(() => toast.error("Oops! Couldn't load your spin status — please refresh the page."));
  }

  useEffect(loadStatus, []);

  async function handleSpin() {
    setLastWin(null);
    setIsSpinning(true);
    try {
      // A short delay makes the spin feel real rather than instant —
      // purely cosmetic, the actual outcome is already decided server-side.
      const [result] = await Promise.all([
        spinWheel(),
        new Promise((resolve) => setTimeout(resolve, 1200)),
      ]);
      setLastWin(result.credited_amount);
      toast.success(`You won ${currencySymbol} ${result.credited_amount}!`);
      setStatus((prev) => (prev ? { ...prev, spins_remaining_today: result.spins_remaining_today, spins_used_today: prev.spins_used_today + 1 } : prev));
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err));
    } finally {
      setIsSpinning(false);
    }
  }

  const spinsLeft = status?.spins_remaining_today ?? 0;
  const canSpin = spinsLeft > 0 && !isSpinning;

  return (
    <div>
      <h1 className="text-2xl font-bold text-dash-text">Wheel Spin</h1>
      <p className="mt-1 text-sm text-dash-text/50">
        Spin for {currencySymbol} 5, 10, or 30 — you get 3 spins per day.
      </p>

      <div className="mt-8 flex flex-col items-center rounded-xl bg-dash-surface p-10">
        <div
          className={`flex h-40 w-40 items-center justify-center rounded-full border-8 border-dash-accent-500/30 bg-gradient-to-br from-dash-accent-500 to-dash-accent-600 text-dash-bg transition-transform duration-[1200ms] ${
            isSpinning ? "rotate-[1080deg]" : ""
          }`}
        >
          <WheelIcon size={56} />
        </div>

        {lastWin && !isSpinning && (
          <p className="mt-6 text-xl font-bold text-dash-accent-500">
            You won {currencySymbol} {lastWin}!
          </p>
        )}

        <button
          onClick={handleSpin}
          disabled={!canSpin}
          className="mt-8 rounded-md bg-dash-accent-500 px-8 py-3 text-sm font-semibold text-dash-bg transition-colors hover:bg-dash-accent-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSpinning ? "Spinning…" : spinsLeft > 0 ? "Spin the wheel" : "No spins left today"}
        </button>

        {status && (
          <p className="mt-4 text-sm text-dash-text/50">
            {spinsLeft} of {status.max_spins_per_day} spins remaining today
          </p>
        )}
      </div>
    </div>
  );
}