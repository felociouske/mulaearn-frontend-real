export default function WelcomeBannerBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
      <div className="absolute -right-10 -top-16 h-56 w-56 animate-auth-drift-1 rounded-full bg-dash-accent-500/20 blur-3xl" />
      <div className="absolute -bottom-16 left-10 h-48 w-48 animate-auth-drift-2 rounded-full bg-dash-accent-600/15 blur-3xl" />

      {/* Faint dot grid texture */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="welcome-dots" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.4" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#welcome-dots)" className="text-dash-text" />
      </svg>

      {/* A couple of small floating coin accents, subtler than the auth page's */}
      <div
        className="absolute right-10 top-8 flex h-9 w-9 animate-auth-float items-center justify-center rounded-full bg-gradient-to-br from-yellow-300/70 to-yellow-500/70 text-sm font-bold text-yellow-900/70"
        style={{ animationDelay: "0.4s" }}
      >
        $
      </div>
      <div
        className="absolute bottom-10 right-1/3 flex h-6 w-6 animate-auth-float items-center justify-center rounded-full bg-gradient-to-br from-yellow-300/50 to-yellow-500/50 text-xs font-bold text-yellow-900/50"
        style={{ animationDelay: "1.6s" }}
      >
        $
      </div>
    </div>
  );
}