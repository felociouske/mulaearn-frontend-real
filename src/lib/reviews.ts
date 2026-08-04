import { apiFetch } from "@/lib/api";

export type DailyMovie = {
  tmdb_id: number;
  title: string;
  genres: string;
  overview: string;
  poster_url: string | null;
  trailer_key: string;
  already_reviewed: boolean;
};

export type TodaysMoviesResponse = {
  allowed_count: number;
  reviewed_today: number;
  movies: DailyMovie[];
};

export type MovieReview = {
  id: number;
  tmdb_id: number;
  title: string;
  date: string;
  rating: number;
  review_text: string;
  credited_amount: string;
  currency_code: string;
  created_at: string;
};

export function getTodaysMovies() {
  return apiFetch<TodaysMoviesResponse>("/api/reviews/movies/today/");
}

export function submitMovieReview(tmdbId: number, rating: number, reviewText: string) {
  return apiFetch<MovieReview>("/api/reviews/movies/submit/", {
    method: "POST",
    body: { tmdb_id: tmdbId, rating, review_text: reviewText },
  });
}

export function getMovieReviewHistory() {
  return apiFetch<MovieReview[]>("/api/reviews/movies/history/");
}

export type AppListing = {
  id: number;
  name: string;
  genre: string;
  description: string;
  icon_url: string;
  store_url: string;
  already_reviewed: boolean;
};

export type TodaysAppsResponse = {
  allowed_count: number;
  reviewed_today: number;
  apps: AppListing[];
};

export type AppReview = {
  id: number;
  app: number;
  app_name: string;
  date: string;
  rating: number;
  review_text: string;
  credited_amount: string;
  currency_code: string;
  created_at: string;
};

export function getTodaysApps() {
  return apiFetch<TodaysAppsResponse>("/api/reviews/apps/today/");
}

export function submitAppReview(appId: number, rating: number, reviewText: string) {
  return apiFetch<AppReview>("/api/reviews/apps/submit/", {
    method: "POST",
    body: { app_id: appId, rating, review_text: reviewText },
  });
}

export function getAppReviewHistory() {
  return apiFetch<AppReview[]>("/api/reviews/apps/history/");
}
