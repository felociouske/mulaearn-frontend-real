export default function ComingSoonPage({
  title,
  description,
  icon = "🚧",
}: {
  title: string;
  description: string;
  icon?: string;
}) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white">{title}</h1>
      <p className="mt-1 text-sm text-white/50">{description}</p>

      <div className="mt-10 flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-dash-surface/50 px-6 py-16 text-center">
        <span className="text-4xl">{icon}</span>
        <p className="mt-4 text-lg font-semibold text-white">Coming soon</p>
        <p className="mt-1 max-w-sm text-sm text-white/50">
          This section is being built out next. The page is already wired into the
          navigation so nothing needs to move once it's ready.
        </p>
      </div>
    </div>
  );
}
