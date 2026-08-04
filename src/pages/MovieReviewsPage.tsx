import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { getFriendlyErrorMessage } from "@/lib/error-messages";
import { getTodaysMovies, submitMovieReview, type DailyMovie } from "@/lib/reviews";
import StarRating from "@/components/dashboard/StarRating";
import NoPlanGuide from "@/components/dashboard/NoPlanGuide";
import { SendIcon } from "@/components/icons/Icons";

export default function MovieReviewsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const currencySymbol = user?.country?.currency_symbol ?? "KSh";

  const [movies, setMovies] = useState<DailyMovie[]>([]);
  const [allowedCount, setAllowedCount] = useState(0);
  const [reviewedToday, setReviewedToday] = useState(0);
  const [activeMovie, setActiveMovie] = useState<DailyMovie | null>(null);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  function loadMovies() {
    setIsLoading(true);
    getTodaysMovies()
      .then((res) => {
        setMovies(res.movies);
        setAllowedCount(res.allowed_count);
        setReviewedToday(res.reviewed_today);
      })
      .catch((err) => {
        // TMDB being briefly unreachable is a 502 from the backend, not a bug in this page.
        setLoadError(getFriendlyErrorMessage(err));
      })
      .finally(() => setIsLoading(false));
  }

  useEffect(loadMovies, []);

  function openReviewForm(movie: DailyMovie) {
    setActiveMovie(movie);
    setRating(0);
    setReviewText("");
    setError(null);
  }

  async function handleSubmit() {
    if (!activeMovie) return;
    if (rating === 0) {
      setError("Please choose a star rating.");
      return;
    }
    if (reviewText.trim().length < 10) {
      setError("Please write a bit more about the movie (at least 10 characters).");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const review = await submitMovieReview(activeMovie.tmdb_id, rating, reviewText.trim());
      toast.success(`Reviewed "${activeMovie.title}" — ${currencySymbol} ${review.credited_amount} credited!`);
      setActiveMovie(null);
      loadMovies();
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-dash-text">Review Today's Movies</h1>
      <p className="mt-1 text-sm text-dash-text/50">
        {allowedCount > 0
          ? `You can review ${allowedCount} movie${allowedCount > 1 ? "s" : ""} today (${reviewedToday} done). Higher plans unlock more.`
          : "Loading your daily limit…"}
      </p>

      {loadError && <p className="mt-4 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">{loadError}</p>}

      {isLoading ? (
        <p className="mt-8 text-dash-text/50">Loading…</p>
      ) : allowedCount === 0 ? (
        <NoPlanGuide itemNoun="movies" planLink="/plans/movie-review" />
      ) : movies.length === 0 && !loadError ? (
        <div className="mt-8 rounded-lg bg-dash-surface p-6 text-dash-text/70">No movies available to review today.</div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {movies.map((movie) => (
            <div key={movie.tmdb_id} className="flex flex-col overflow-hidden rounded-xl bg-dash-surface">
              {movie.poster_url && (
                <img src={movie.poster_url} alt={movie.title} className="h-48 w-full object-cover" />
              )}
              <div className="flex flex-1 flex-col p-4">
                <p className="font-semibold text-dash-text">{movie.title}</p>
                {movie.genres && <p className="mt-0.5 text-xs text-dash-text/40">{movie.genres}</p>}
                <p className="mt-2 flex-1 text-sm text-dash-text/60 line-clamp-3">{movie.overview}</p>

                {movie.trailer_key && (
                  <a
                    href={`https://www.youtube.com/watch?v=${movie.trailer_key}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 text-xs font-medium text-dash-accent-500 hover:underline"
                  >
                    <span className="inline-flex items-center gap-1"><SendIcon size={12} /> Watch trailer</span>
                  </a>
                )}

                <button
                  onClick={() => openReviewForm(movie)}
                  disabled={movie.already_reviewed}
                  className="mt-4 w-full rounded-md bg-dash-accent-500 px-4 py-2 text-sm font-semibold text-dash-bg transition-colors hover:bg-dash-accent-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {movie.already_reviewed ? "Reviewed today ✓" : "Write a review"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeMovie && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl bg-dash-surface p-6">
            <p className="text-lg font-semibold text-dash-text">Review {activeMovie.title}</p>

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
              placeholder="What did you think of this movie?"
              className="mt-4 w-full rounded-md border border-dash-border bg-dash-overlay px-3 py-2 text-sm text-dash-text focus:border-dash-accent-500 focus:outline-none"
            />

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setActiveMovie(null)}
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