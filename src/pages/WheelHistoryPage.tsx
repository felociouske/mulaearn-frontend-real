import { useEffect, useState } from "react";
import { getWheelHistory, type WheelSpinResult } from "@/lib/wheel";

export default function WheelHistoryPage() {
  const [spins, setSpins] = useState<WheelSpinResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getWheelHistory()
      .then(setSpins)
      .catch(() => setError("Couldn't load your spin history — please refresh the page."))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-dash-text">Wheel Spin History</h1>
      <p className="mt-1 text-sm text-dash-text/50">Every spin you've taken and what you won.</p>

      {error && <p className="mt-4 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}

      {isLoading ? (
        <p className="mt-8 text-dash-text/50">Loading…</p>
      ) : spins.length === 0 ? (
        <div className="mt-8 rounded-lg bg-dash-surface p-6 text-dash-text/70">No spins yet.</div>
      ) : (
        <div className="mt-6 divide-y divide-dash-border rounded-lg bg-dash-surface">
          {spins.map((s) => (
            <div key={s.id} className="flex items-center justify-between p-4">
              <p className="text-sm text-dash-text/70">{new Date(s.created_at).toLocaleString()}</p>
              <p className="text-sm font-semibold text-dash-accent-500">
                {s.currency_code} {s.credited_amount}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
