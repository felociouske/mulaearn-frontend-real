// Base URL for the Django API. Vite exposes env vars via import.meta.env,
// and only ones prefixed VITE_ are exposed to client code (same idea as
// Next's NEXT_PUBLIC_ prefix, different name). Set VITE_API_URL in
// .env.local for local dev and in your host's env vars for production.
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown) {
    super(extractMessage(status, body));
    this.status = status;
    this.body = body;
  }
}

// DRF error bodies come in a few shapes:
//   { "detail": "..." }                          — auth/permission errors
//   { "field_name": ["message"] }                 — serializer validation errors
//   { "__all__": ["message"] } or { "non_field_errors": [...] }
// Previously anything without "detail" fell through to JSON.stringify(body),
// which is what produced the raw {"username":["This field is required."]}
// text shown directly in the UI. This pulls out the first actual message
// string from whichever shape it finds, so callers always get something
// readable — getFriendlyErrorMessage() (lib/error-messages.ts) then makes
// it sound human rather than like a validation log.
function extractMessage(status: number, body: unknown): string {
  if (typeof body !== "object" || body === null) {
    return `Request failed (${status})`;
  }
  const record = body as Record<string, unknown>;

  if (typeof record.detail === "string") return record.detail;

  for (const key of ["non_field_errors", "__all__"]) {
    const value = record[key];
    if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  }

  // Otherwise take the first field's first message, e.g. "username" -> "...".
  for (const value of Object.values(record)) {
    if (Array.isArray(value) && typeof value[0] === "string") return value[0];
    if (typeof value === "string") return value;
  }

  return `Request failed (${status})`;
}

function getTokens() {
  return {
    access: window.localStorage.getItem("easyearn_access"),
    refresh: window.localStorage.getItem("easyearn_refresh"),
  };
}

export function setTokens(access: string, refresh: string) {
  window.localStorage.setItem("easyearn_access", access);
  window.localStorage.setItem("easyearn_refresh", refresh);
}

export function clearTokens() {
  window.localStorage.removeItem("easyearn_access");
  window.localStorage.removeItem("easyearn_refresh");
}

/**
 * A NOTE ON TOKEN STORAGE (since you're learning): storing JWTs in
 * localStorage, as this does, is the simplest approach and fine for an
 * MVP, but it's readable by any JS running on the page — so an XSS bug
 * elsewhere in the app could steal a token. The more secure alternative
 * is an httpOnly cookie set by the backend, which client-side JS can't
 * read at all. That requires backend changes (Django setting the cookie
 * on login) we haven't built. Flagging it now so it's a deliberate
 * tradeoff, not something that slips by unnoticed.
 */

async function refreshAccessToken(): Promise<string | null> {
  const { refresh } = getTokens();
  if (!refresh) return null;

  const res = await fetch(`${API_BASE_URL}/api/accounts/login/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  if (!res.ok) {
    clearTokens();
    return null;
  }

  const data = await res.json();
  window.localStorage.setItem("easyearn_access", data.access);
  return data.access;
}

type ApiFetchOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: boolean; // set false for public endpoints (register, login, plan list, etc.)
};

/**
 * Central fetch wrapper every page/component uses instead of calling
 * fetch() directly. Handles: base URL, JSON headers, attaching the JWT,
 * and a single automatic retry after refreshing an expired access token —
 * so individual components never have to think about token expiry.
 */
export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true } = options;

  const doFetch = async (accessToken: string | null) => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (auth && accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
    return fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  };

  const { access } = getTokens();
  let res = await doFetch(access);

  if (res.status === 401 && auth) {
    const newAccess = await refreshAccessToken();
    if (newAccess) {
      res = await doFetch(newAccess);
    }
  }

  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await res.json() : null;

  if (!res.ok) {
    throw new ApiError(res.status, data);
  }

  return data as T;
}