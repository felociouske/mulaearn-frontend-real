export default function AuthIllustration({ tagline }: { tagline: string }) {
  return (
    <div className="relative hidden h-full w-full overflow-hidden bg-linear-to-br from-dash-accent-600 via-dash-bg to-dash-surface lg:flex lg:flex-col lg:justify-between lg:p-10">
      {/* Ambient glow blobs, slow drift */}
      <div className="pointer-events-none absolute -left-16 -top-16 h-72 w-72 animate-auth-drift-1 rounded-full bg-dash-accent-500/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 top-1/3 h-56 w-56 animate-auth-drift-2 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 left-1/4 h-80 w-80 animate-auth-drift-1 rounded-full bg-dash-accent-600/30 blur-3xl" />

      <div className="relative z-10">
        <p className="text-xl font-bold text-white">EasyEarn</p>
      </div>

      {/* Floating coin markers */}
      <div className="relative z-10 flex-1">
        {[
          { top: "18%", left: "20%", delay: "0s", size: 46 },
          { top: "38%", left: "62%", delay: "0.6s", size: 34 },
          { top: "58%", left: "12%", delay: "1.2s", size: 28 },
          { top: "12%", left: "70%", delay: "1.8s", size: 24 },
          { top: "70%", left: "55%", delay: "0.3s", size: 38 },
        ].map((coin, i) => (
          <div
            key={i}
            className="absolute flex animate-auth-float items-center justify-center rounded-full bg-linear-to-br from-yellow-300 to-yellow-500 font-bold text-yellow-900 shadow-lg"
            style={{
              top: coin.top,
              left: coin.left,
              width: coin.size,
              height: coin.size,
              fontSize: coin.size * 0.4,
              animationDelay: coin.delay,
            }}
          >
            $
          </div>
        ))}

        {/* Animated growth line chart */}
        <svg viewBox="0 0 300 120" className="absolute bottom-6 left-0 w-full max-w-sm opacity-80">
          <path
            d="M0 100 L40 85 L80 90 L120 60 L160 65 L200 35 L240 40 L300 10"
            fill="none"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-auth-draw"
            pathLength={1}
          />
        </svg>
      </div>

      <div className="relative z-10 max-w-sm">
        <p className="text-2xl font-bold leading-snug text-white">{tagline}</p>
      </div>
    </div>
  );
}