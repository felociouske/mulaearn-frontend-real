import { ApiError } from "@/lib/api";

const FIELD_LABELS: Record<string, string> = {
  username: "username",
  email: "email",
  phone_number: "phone number",
};

/**
 * Turns an ApiError (or any thrown value) into short, friendly copy fit
 * for a toast — e.g. "Oops! That username is already taken." instead of
 * raw DRF text like "user with this username already exists.".
 * Unrecognized messages still get a light "Oops!" treatment rather than
 * being shown completely raw.
 */
export function getFriendlyErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return "Oops! Something went wrong. Please try again.";
  }

  const raw = error.message.toLowerCase();
  const body = (error.body ?? {}) as Record<string, unknown>;

  if (raw.includes("no active account")) {
    return "Oops! That username or password isn't right.";
  }

  if (raw.includes("already exists") || raw.includes("already in use")) {
    const field = Object.keys(body).find((key) => key in FIELD_LABELS);
    const label = field ? FIELD_LABELS[field] : "that";
    return `Oops! That ${label} is already taken.`;
  }

  if (raw.includes("invalid referral code")) {
    return "Oops! That referral code doesn't exist — double-check it or leave it blank.";
  }

  if (raw.includes("this field is required") || raw.includes("this field may not be blank")) {
    const field = Object.keys(body)[0];
    const label = field && field in FIELD_LABELS ? FIELD_LABELS[field] : "field";
    return `Oops! Please fill in your ${label}.`;
  }

  if (error.status === 401 || error.status === 403) {
    return "Oops! You'll need to log in again to do that.";
  }

  if (error.status >= 500) {
    return "Oops! Something went wrong on our end — please try again shortly.";
  }

  // Already-readable message (e.g. from our own DRFValidationError copy
  // written for humans, like the withdrawal/insufficient-balance ones) —
  // pass it through as-is rather than double-translating it.
  return error.message;
}