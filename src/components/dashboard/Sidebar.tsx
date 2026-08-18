import { useState, type ComponentType } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import {
  HomeIcon, ChatBubbleIcon, WheelIcon, SmartphoneIcon, FilmIcon,
  WalletIcon, LinkIcon, PhoneIcon, LogOutIcon, ChevronDownIcon, XIcon,
} from "@/components/icons/Icons";

type IconComponent = ComponentType<{ size?: number; className?: string }>;
type NavLeaf = { label: string; href: string };
type NavGroup = { id: string; label: string; icon: IconComponent; children: NavLeaf[] };
type NavItem = { id: string; label: string; icon: IconComponent; href: string };

const navGroups: (NavGroup | NavItem)[] = [
  { id: "overview", label: "Overview", icon: HomeIcon, href: "/" },
  {
    id: "chats",
    label: "Chats",
    icon: ChatBubbleIcon,
    children: [
      { label: "Engage in Chats", href: "/chats" },
      { label: "Chat History", href: "/chats/history" },
      { label: "Chat Plans", href: "/plans/chat" },
    ],
  },
  {
    id: "survey-wheel",
    label: "Survey & Wheel",
    icon: WheelIcon,
    children: [
      { label: "Survey Questions", href: "/survey" },
      { label: "Survey History", href: "/survey/history" },
      { label: "Wheel Spin", href: "/wheel" },
      { label: "Wheel History", href: "/wheel/history" },
    ],
  },
  {
    id: "app-reviews",
    label: "App Reviews",
    icon: SmartphoneIcon,
    children: [
      { label: "Review Today's Apps", href: "/app-reviews" },
      { label: "App Review Plans", href: "/plans/app-review" },
      { label: "App Review History", href: "/app-reviews/history" },
    ],
  },
  {
    id: "movie-reviews",
    label: "Movie Reviews",
    icon: FilmIcon,
    children: [
      { label: "Review Today's Movies", href: "/movie-reviews" },
      { label: "Movie Review Plans", href: "/plans/movie-review" },
      { label: "Movie Review History", href: "/movie-reviews/history" },
    ],
  },
  {
    id: "wallet",
    label: "Wallet",
    icon: WalletIcon,
    children: [
      { label: "Overview", href: "/wallet" },
      { label: "Deposit", href: "/deposit" },
      { label: "Withdraw", href: "/withdraw" },
    ],
  },
  { id: "leads", label: "Leads", icon: LinkIcon, href: "/referrals" },
];

function isGroup(item: NavGroup | NavItem): item is NavGroup {
  return "children" in item;
}

// All groups start expanded on load — computed once outside render logic
// so every group id in navGroups gets a `true` entry by default.
const allGroupsOpen: Record<string, boolean> = navGroups.reduce((acc, item) => {
  if (isGroup(item)) acc[item.id] = true;
  return acc;
}, {} as Record<string, boolean>);

export default function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const location = useLocation();
  const { logout } = useAuth();

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(allGroupsOpen);

  function toggleGroup(id: string) {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={onClose} aria-hidden="true" />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 shrink-0 flex-col bg-dash-surface text-dash-text transition-transform duration-200 md:sticky md:top-0 md:z-auto md:h-screen md:w-64 md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-6">
          <div className="flex items-center gap-3">
            <img src="/mulaearn.jpg" alt="MulaEarn" className="h-12 w-auto object-contain" />
            <p className="text-base font-bold uppercase tracking-wide text-dash-text/60">Navigation</p>
          </div>
          <button onClick={onClose} className="text-dash-text/50 hover:text-dash-text md:hidden" aria-label="Close menu">
            <XIcon size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3">
          <ul className="space-y-1">
            {navGroups.map((item) => {
              const ItemIcon = item.icon;

              if (!isGroup(item)) {
                const isActive = location.pathname === item.href;
                return (
                  <li key={item.id}>
                    <Link
                      to={item.href}
                      onClick={onClose}
                      className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-dash-accent-500/15 text-dash-accent-500"
                          : "text-dash-text/70 hover:bg-dash-overlay hover:text-dash-text"
                      }`}
                    >
                      <ItemIcon size={18} />
                      {item.label}
                    </Link>
                  </li>
                );
              }

              const isOpenGroup = !!openGroups[item.id];
              const groupHasActiveChild = item.children.some((c) => location.pathname.startsWith(c.href));

              return (
                <li key={item.id}>
                  <button
                    onClick={() => toggleGroup(item.id)}
                    className={`flex w-full items-center justify-between gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                      groupHasActiveChild ? "text-dash-accent-500" : "text-dash-text/70 hover:bg-dash-overlay hover:text-dash-text"
                    }`}
                    aria-expanded={isOpenGroup}
                  >
                    <span className="flex items-center gap-3">
                      <ItemIcon size={18} />
                      {item.label}
                    </span>
                    <ChevronDownIcon size={16} className={`transition-transform ${isOpenGroup ? "rotate-180" : ""}`} />
                  </button>

                  {isOpenGroup && (
                    <ul className="mt-1 space-y-0.5 border-l border-dash-border pl-4">
                      {item.children.map((child) => {
                        const isActive = location.pathname === child.href;
                        return (
                          <li key={child.href}>
                            <Link
                              to={child.href}
                              onClick={onClose}
                              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                                isActive
                                  ? "bg-dash-accent-500/15 text-dash-accent-500"
                                  : "text-dash-text/60 hover:bg-dash-overlay hover:text-dash-text"
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                                  isActive ? "bg-dash-accent-500" : "bg-dash-text/30"
                                }`}
                              />
                              {child.label}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="space-y-2 px-3 py-6">
          <Link
            to="/contact"
            onClick={onClose}
            className="flex w-full items-center gap-3 rounded-md border border-dash-border px-3 py-2.5 text-sm font-medium text-dash-text/70 transition-colors hover:bg-dash-overlay hover:text-dash-text"
          >
            <PhoneIcon size={18} /> Contact
          </Link>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-md border border-dash-border px-3 py-2.5 text-left text-sm font-medium text-dash-text/70 transition-colors hover:bg-dash-overlay hover:text-dash-text"
          >
            <LogOutIcon size={18} /> Log out
          </button>
        </div>
      </aside>
    </>
  );
}