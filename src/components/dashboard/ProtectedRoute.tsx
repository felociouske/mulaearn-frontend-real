import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";

/**
 * React Router equivalent of the Next.js RequireAuth component. While
 * isLoading is true, we don't know yet whether a valid session exists
 * (auth-context is still checking localStorage + calling /me/), so we
 * show a loading state rather than flashing a redirect too early.
 *
 * requireActivation (default true): dashboard routes need an activated
 * account and get bounced to /activate if not. The /activate route
 * itself passes requireActivation={false} — it only needs a logged-in
 * user, and sends already-activated users straight back to the dashboard
 * so they can't linger on a page they no longer need.
 */
export default function ProtectedRoute({
  children,
  requireActivation = true,
}: {
  children: React.ReactNode;
  requireActivation?: boolean;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dash-bg text-dash-text/60">
        Loading your dashboard…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireActivation && !user.is_activated) {
    return <Navigate to="/activate" replace />;
  }

  if (!requireActivation && user.is_activated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}