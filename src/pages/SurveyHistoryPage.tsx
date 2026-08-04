import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getSurveyHistory, type SurveyAttemptResult } from "@/lib/surveys";

export default function SurveyHistoryPage() {
  const { user } = useAuth();
  const currencySymbol = user?.country?.currency_symbol ?? "KSh";
  const [attempts, setAttempts] = useState<SurveyAttemptResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getSurveyHistory()
      .then(setAttempts)
      .catch(() => setError("Couldn't load your survey history — please refresh the page."))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-dash-text">Survey History</h1>
      <p className="mt-1 text-sm text-dash-text/50">Every survey you've completed, your score, and what you earned.</p>

      {error && <p className="mt-4 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}

      {isLoading ? (
        <p className="mt-8 text-dash-text/50">Loading…</p>
      ) : attempts.length === 0 ? (
        <div className="mt-8 rounded-lg bg-dash-surface p-6 text-dash-text/70">No surveys completed yet.</div>
      ) : (
        <div className="mt-6 divide-y divide-dash-border rounded-lg bg-dash-surface">
          {attempts.map((a) => (
            <div key={a.id} className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium text-dash-text">{new Date(a.date).toLocaleDateString()}</p>
                <p className="text-xs text-dash-text/40">Score: {a.score}/10</p>
              </div>
              <p className="text-sm font-semibold text-dash-accent-500">
                {currencySymbol} {a.credited_amount}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
