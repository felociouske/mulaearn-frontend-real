import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { getFriendlyErrorMessage } from "@/lib/error-messages";
import { getTodaysApps, submitAppReview, type AppListing } from "@/lib/reviews";
import StarRating from "@/components/dashboard/StarRating";
import NoPlanGuide from "@/components/dashboard/NoPlanGuide";
import { SmartphoneIcon } from "@/components/icons/Icons";

export default function AppReviewsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const currencySymbol = user?.country?.currency_symbol ?? "KSh";

  const [apps, setApps] = useState<AppListing[]>([]);
  const [allowedCount, setAllowedCount] = useState(0);
  const [reviewedToday, setReviewedToday] = useState(0);
  const [activeApp, setActiveApp] = useState<AppListing | null>(null);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  function loadApps() {
    getTodaysApps()
      .then((res) => {
        setApps(res.apps);
        setAllowedCount(res.allowed_count);
        setReviewedToday(res.reviewed_today);
      })
      .catch(() => setError("Couldn't load today's apps — please refresh the page."))
      .finally(() => setIsLoading(false));
  }

  useEffect(loadApps, []);

  function openReviewForm(app: AppListing) {
    setActiveApp(app);
    setRating(0);
    setReviewText("");
    setError(null);
  }

  async function handleSubmit() {
    if (!activeApp) return;
    if (rating === 0) {
      setError("Please choose a star rating.");
      return;
    }
    if (reviewText.trim().length < 10) {
      setError("Please write a bit more about the app (at least 10 characters).");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const review = await submitAppReview(activeApp.id, rating, reviewText.trim());
      toast.success(`Reviewed "${activeApp.name}" — ${currencySymbol} ${review.credited_amount} credited!`);
      setActiveApp(null);
      loadApps();
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-dash-text">Review Today's Apps</h1>
      <p className="mt-1 text-sm text-dash-text/50">
        {allowedCount > 0
          ? `You can review ${allowedCount} app${allowedCount > 1 ? "s" : ""} today (${reviewedToday} done). Higher plans unlock more.`
          : "Loading your daily limit…"}
      </p>

      {error && !activeApp && <p className="mt-4 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}

      {isLoading ? (
        <p className="mt-8 text-dash-text/50">Loading…</p>
      ) : allowedCount === 0 ? (
        <NoPlanGuide itemNoun="apps" planLink="/plans/app-review" />
      ) : apps.length === 0 ? (
        <div className="mt-8 rounded-lg bg-dash-surface p-6 text-dash-text/70">No apps available to review today.</div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {apps.map((app) => (
            <div key={app.id} className="flex flex-col rounded-xl bg-dash-surface p-5">
              <div className="flex items-center gap-3">
                {app.icon_url ? (
                  <img src={app.icon_url} alt={app.name} className="h-12 w-12 rounded-lg object-cover" />
                ) : (
                  <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-dash-overlay-strong text-dash-text/50"><SmartphoneIcon size={22} /></span>
                )}
                <div>
                  <p className="font-semibold text-dash-text">{app.name}</p>
                  <p className="text-xs text-dash-text/40">{app.genre}</p>
                </div>
              </div>
              <p className="mt-3 flex-1 text-sm text-dash-text/60">{app.description}</p>
              <button
                onClick={() => openReviewForm(app)}
                disabled={app.already_reviewed}
                className="mt-4 w-full rounded-md bg-dash-accent-500 px-4 py-2 text-sm font-semibold text-dash-bg transition-colors hover:bg-dash-accent-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {app.already_reviewed ? "Reviewed today ✓" : "Write a review"}
              </button>
            </div>
          ))}
        </div>
      )}

      {activeApp && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl bg-dash-surface p-6">
            <p className="text-lg font-semibold text-dash-text">Review {activeApp.name}</p>

            {error && <p className="mt-3 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}

            <div className="mt-4">
              <p className="text-xs font-medium text-dash-text/50">Your rating</p>
              <div className="mt-1">
                <StarRating value={rating} onChange={setRating} />
              </div>
            </div>

            <textarea
              rows={4}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="What did you think of this app?"
              className="mt-4 w-full rounded-md border border-dash-border bg-dash-overlay px-3 py-2 text-sm text-dash-text focus:border-dash-accent-500 focus:outline-none"
            />

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setActiveApp(null)}
                className="flex-1 rounded-md border border-dash-border px-4 py-2 text-sm font-medium text-dash-text/70 hover:bg-dash-overlay"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 rounded-md bg-dash-accent-500 px-4 py-2 text-sm font-semibold text-dash-bg transition-colors hover:bg-dash-accent-600 disabled:opacity-50"
              >
                {isSubmitting ? "Submitting…" : "Submit review"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}