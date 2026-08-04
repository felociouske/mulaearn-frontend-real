import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { getFlagUrl } from "@/lib/flags";
import NotificationBell from "@/components/dashboard/NotificationBell";
import { MenuIcon, SunIcon, MoonIcon, UserIcon, LogOutIcon, GlobeIcon } from "@/components/icons/Icons";

export default function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  const flagUrl = user?.country ? getFlagUrl(user.country.code) : null;
  const initial = user?.username?.charAt(0).toUpperCase() ?? "?";

  return (
    <header className="flex items-center justify-between border-b border-dash-border bg-dash-bg px-4 py-4 md:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="text-dash-text/70 hover:text-dash-text md:hidden"
          aria-label="Open menu"
        >
          <MenuIcon size={22} />
        </button>
        <p className="text-sm text-dash-text/40">EasyEarn Dashboard</p>
      </div>

      <div className="relative flex items-center gap-2">
        {user?.country && (
          <div className="hidden items-center gap-1.5 rounded-full bg-dash-surface px-2.5 py-1 sm:flex" title={user.country.name}>
            <span className="flex h-4 w-4 shrink-0 items-center justify-center overflow-hidden rounded-full bg-dash-overlay-strong">
              {flagUrl ? (
                <img src={flagUrl} alt={user.country.name} className="h-full w-full object-cover" />
              ) : (
                <GlobeIcon size={11} />
              )}
            </span>
            <span className="text-xs font-medium text-dash-text/70">{user.country.code}</span>
          </div>
        )}

        <button
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-dash-surface text-dash-text/70 transition-colors hover:text-dash-text"
          aria-label="Toggle theme"
          title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
        >
          {theme === "dark" ? <SunIcon size={17} /> : <MoonIcon size={17} />}
        </button>

        <NotificationBell />

        <button
          onClick={() => setMenuOpen((open) => !open)}
          className="flex h-9 w-9 items-center justify-center gap-1 rounded-full bg-dash-accent-500 text-sm font-bold text-dash-bg"
          aria-label="Account menu"
          aria-expanded={menuOpen}
        >
          {initial}
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-12 w-48 rounded-lg bg-dash-surface p-2 shadow-lg ring-1 ring-dash-border">
            <p className="px-3 py-2 text-xs text-dash-text/40">Signed in as</p>
            <p className="px-3 pb-2 text-sm font-medium text-dash-text">@{user?.username}</p>
            <Link
              to="/profile"
              onClick={() => setMenuOpen(false)}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-dash-text/70 hover:bg-dash-overlay hover:text-dash-text"
            >
              <UserIcon size={16} /> Profile
            </Link>
            <button
              onClick={logout}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-dash-text/70 hover:bg-dash-overlay hover:text-dash-text"
            >
              <LogOutIcon size={16} /> Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
