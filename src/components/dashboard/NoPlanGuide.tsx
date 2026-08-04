import { Link } from "react-router-dom";
import { ClipboardIcon } from "@/components/icons/Icons";

const TIERS = [
  { name: "Starter", count: 20 },
  { name: "Plus", count: 40 },
  { name: "Pro", count: 70 },
  { name: "Elite", count: 100 },
];

export default function NoPlanGuide({
  itemNoun,
  planLink,
}: {
  itemNoun: string; // "apps" or "movies"
  planLink: string;
}) {
  return (
    <div className="mt-8 rounded-xl border border-dashed border-dash-border bg-dash-surface/50 p-6">
      <div className="flex items-center gap-2 text-dash-text">
        <ClipboardIcon size={20} className="text-dash-accent-500" />
        <p className="text-lg font-semibold">You'll need a plan to start reviewing {itemNoun}</p>
      </div>
      <p className="mt-2 max-w-xl text-sm text-dash-text/60">
        Reviewing pays out per {itemNoun.slice(0, -1)}, but which — and how many — {itemNoun} you can
        review each day depends on your plan tier. Pick one to get started:
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {TIERS.map((tier) => (
          <div key={tier.name} className="rounded-lg bg-dash-overlay p-4 text-center">
            <p className="text-sm font-semibold text-dash-text">{tier.name}</p>
            <p className="mt-1 text-xs text-dash-text/50">{tier.count} {itemNoun}/day</p>
          </div>
        ))}
      </div>

      <Link
        to={planLink}
        className="mt-5 inline-block rounded-md bg-dash-accent-500 px-5 py-2.5 text-sm font-semibold text-dash-bg transition-colors hover:bg-dash-accent-600"
      >
        View plans
      </Link>
    </div>
  );
}