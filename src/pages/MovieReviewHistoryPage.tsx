import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getMovieReviewHistory, type MovieReview } from "@/lib/reviews";
import StarRatingDisplay from "@/components/dashboard/StarRatingDisplay";

export default function MovieReviewHistoryPage() {
  const { user } = useAuth();
  const currencySymbol = user?.country?.currency_symbol ?? "KSh";
  const [reviews, setReviews] = useState<MovieReview[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getMovieReviewHistory()
      .then(setReviews)
      .catch(() => setError("Couldn't load your review history — please refresh the page."))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-dash-text">Movie Review History</h1>
      <p className="mt-1 text-sm text-dash-text/50">Every movie review you've submitted and what it earned.</p>

      {error && <p className="mt-4 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}

      {isLoading ? (
        <p className="mt-8 text-dash-text/50">Loading…</p>
      ) : reviews.length === 0 ? (
        <div className="mt-8 rounded-lg bg-dash-surface p-6 text-dash-text/70">No movie reviews yet.</div>
      ) : (
        <div className="mt-6 divide-y divide-dash-border rounded-lg bg-dash-surface">
          {reviews.map((r) => (
            <div key={r.id} className="flex items-start justify-between gap-4 p-4">
              <div>
                <p className="text-sm font-medium text-dash-text">{r.title}</p>
                <p className="mt-0.5"><StarRatingDisplay rating={r.rating} /></p>
                <p className="mt-1 max-w-md text-xs text-dash-text/50">{r.review_text}</p>
              </div>
              <p className="shrink-0 text-sm font-semibold text-dash-accent-500">
                {currencySymbol} {r.credited_amount}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
