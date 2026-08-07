import { useState} from "react";
import { useAuth } from "@/lib/auth-context";
import { UserIcon, ShieldCheckIcon } from "@/components/icons/Icons";

export default function ProfilePage() {
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email ?? "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number ?? "");

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-dash-text">Profile</h1>
      <p className="mt-1 text-sm text-dash-text/50">View your account details and update your contact info.</p>

      <div className="mt-6 flex items-center gap-4 rounded-xl bg-dash-surface p-5">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-dash-accent-500/15 text-dash-accent-500">
          <UserIcon size={30} />
        </div>
        <div>
          <p className="flex items-center gap-1.5 text-lg font-semibold text-dash-text">
            @{user.username}
            {user.is_activated && (
              <span title="Activated account">
                <ShieldCheckIcon size={16} className="text-dash-accent-500" />
              </span>
            )}
          </p>
          <p className="text-sm text-dash-text/50">
            {user.country?.name ?? "No country set"} · Joined {new Date(user.date_joined).toLocaleDateString()}
          </p>
        </div>
      </div>

      <form className="mt-6 space-y-4 rounded-xl bg-dash-surface p-5">

        <div>
          <label className="block text-xs font-medium text-dash-text/60" htmlFor="username">
            Username
          </label>
          <input
            id="username"
            value={user.username}
            disabled
            className="mt-1 w-full rounded-md border border-dash-border bg-dash-overlay px-3 py-2 text-sm text-dash-text/50"
          />
          <p className="mt-1 text-xs text-dash-text/30">Username can't be changed.</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-dash-text/60" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            disabled
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-dash-border bg-dash-overlay px-3 py-2 text-sm text-dash-text focus:border-dash-accent-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-dash-text/60" htmlFor="phone">
            Phone number
          </label>
          <input
            id="phone"
            required
            disabled
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="mt-1 w-full rounded-md border border-dash-border bg-dash-overlay px-3 py-2 text-sm text-dash-text focus:border-dash-accent-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-dash-text/60">Country</label>
          <input
            value={user.country?.name ?? "—"}
            disabled
            className="mt-1 w-full rounded-md border border-dash-border bg-dash-overlay px-3 py-2 text-sm text-dash-text/50"
          />
        </div>

      </form>
    </div>
  );
}
