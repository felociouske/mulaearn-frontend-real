import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { getFriendlyErrorMessage } from "@/lib/error-messages";
import AuthIllustration from "@/components/auth/AuthIllustration";
import Spinner from "@/components/ui/Spinner";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const toast = useToast();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await login(username, password);
      navigate("/");
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-dash-bg">
      <div className="hidden w-1/2 lg:block">
        <AuthIllustration tagline="Turn your time online into real income — chats, reviews, surveys, and more." />
      </div>

      <div className="flex w-full items-center justify-center px-4 py-12 lg:w-1/2">
        <div className="w-full max-w-md animate-fade-in-up">
          <h1 className="text-2xl font-bold text-dash-text">Welcome back</h1>
          <p className="mt-1 text-sm text-dash-text/50">Log in to keep earning.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="block text-sm font-medium text-dash-text/70" htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 w-full rounded-md bg-dash-overlay border border-dash-border px-3 py-2.5 text-sm text-dash-text transition-colors focus:border-dash-accent-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dash-text/70" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-md bg-dash-overlay border border-dash-border px-3 py-2.5 text-sm text-dash-text transition-colors focus:border-dash-accent-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-dash-accent-500 px-5 py-2.5 text-sm font-semibold text-dash-bg transition-colors hover:bg-dash-accent-600 disabled:opacity-60"
            >
              {isSubmitting && <Spinner size={16} />}
              {isSubmitting ? "Logging in…" : "Log in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-dash-text/50">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="font-medium text-dash-accent-500 hover:underline">Sign up free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}