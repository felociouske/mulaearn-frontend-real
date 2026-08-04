import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth, type Country } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/lib/toast-context";
import { getFriendlyErrorMessage } from "@/lib/error-messages";
import AuthIllustration from "@/components/auth/AuthIllustration";
import Spinner from "@/components/ui/Spinner";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register } = useAuth();
  const toast = useToast();

  const [countries, setCountries] = useState<Country[]>([]);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryId, setCountryId] = useState<string>("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCountries, setIsLoadingCountries] = useState(true);

  // Captured silently from ?ref=CODE in the URL — never shown or editable
  // in the form itself. Someone who taps a referral link should just end
  // up registered under that upline with no extra step, not see a field
  // they could second-guess or accidentally clear.
  const referralCode = searchParams.get("ref") ?? "";

  useEffect(() => {
    apiFetch<Country[]>("/api/accounts/countries/", { auth: false })
      .then(setCountries)
      .catch(() => toast.error("Oops! Couldn't load the list of countries — please refresh the page."))
      .finally(() => setIsLoadingCountries(false));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await register({
        username,
        email,
        phone_number: phoneNumber,
        password,
        country: Number(countryId),
        referral_code: referralCode || undefined,
      });
      toast.success("Welcome to EasyEarn! Your account is ready.");
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
        <AuthIllustration tagline="Join thousands earning from chats, reviews, surveys, and referrals." />
      </div>

      <div className="flex w-full items-center justify-center px-4 py-12 lg:w-1/2">
        <div className="w-full max-w-md animate-fade-in-up">
          <h1 className="text-2xl font-bold text-dash-text">Create your free account</h1>
          <p className="mt-1 text-sm text-dash-text/50">No sign-up fee. Start earning in minutes.</p>

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
              <label className="block text-sm font-medium text-dash-text/70" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-md bg-dash-overlay border border-dash-border px-3 py-2.5 text-sm text-dash-text transition-colors focus:border-dash-accent-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dash-text/70" htmlFor="phone">Phone number</label>
              <input
                id="phone"
                type="tel"
                required
                placeholder="e.g. 0712345678"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="mt-1 w-full rounded-md bg-dash-overlay border border-dash-border px-3 py-2.5 text-sm text-dash-text transition-colors focus:border-dash-accent-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dash-text/70" htmlFor="country">Country</label>
              <select
                id="country"
                required
                disabled={isLoadingCountries}
                value={countryId}
                onChange={(e) => setCountryId(e.target.value)}
                className="mt-1 w-full rounded-md bg-dash-overlay border border-dash-border px-3 py-2.5 text-sm text-dash-text transition-colors focus:border-dash-accent-500 focus:outline-none disabled:opacity-50"
              >
                <option value="" disabled>{isLoadingCountries ? "Loading countries…" : "Select your country"}</option>
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-dash-text/70" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
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
              {isSubmitting ? "Creating account…" : "Sign up free"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-dash-text/50">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-dash-accent-500 hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}