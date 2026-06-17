"use client";

/* Ghost of Tsushima scenery primitives: crimson sun, layered mountain
   silhouettes, swaying golden pampas grass, sumi-e brush strokes, torii. */

export function Vignette() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-20"
      style={{
        background:
          "radial-gradient(120% 90% at 50% 28%, transparent 55%, rgba(0,0,0,0.55) 100%)",
      }}
    />
  );
}

export function Grain() {
  return <div aria-hidden className="pointer-events-none fixed inset-0 z-20 grain-anim" />;
}

export function CrimsonSun({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none absolute ${className}`}>
      <div className="sun-pulse h-[34rem] w-[34rem] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(224,70,58,0.95) 0%, rgba(177,39,31,0.85) 30%, rgba(140,28,22,0.35) 55%, rgba(140,28,22,0) 72%)",
          filter: "blur(2px)",
        }}
      />
    </div>
  );
}

export function MountainRidges() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-[1]">
      <svg viewBox="0 0 1440 360" preserveAspectRatio="none" className="h-[42vh] w-full">
        {/* far ridge, faint crimson rim */}
        <path
          d="M0 220 L160 180 L320 205 L520 150 L700 195 L900 140 L1120 190 L1300 160 L1440 195 L1440 360 L0 360 Z"
          fill="#1a0f0c"
        />
        {/* mid ridge */}
        <path
          d="M0 270 L220 230 L420 268 L640 215 L860 262 L1080 220 L1280 262 L1440 235 L1440 360 L0 360 Z"
          fill="#120b08"
        />
        {/* near ridge */}
        <path
          d="M0 320 L260 292 L520 322 L780 286 L1040 320 L1280 296 L1440 318 L1440 360 L0 360 Z"
          fill="#0a0705"
        />
      </svg>
    </div>
  );
}

/** Swaying golden pampas grass band, anchored to the bottom. */
export function GrassBand() {
  const blades = Array.from({ length: 46 }).map((_, i) => {
    const x = (i / 45) * 100;
    const h = 70 + ((i * 37) % 60);
    const lean = ((i * 53) % 28) - 14;
    const delay = ((i * 17) % 100) / 100;
    const dur = 3 + ((i * 7) % 20) / 10;
    const op = 0.35 + ((i * 29) % 50) / 140;
    return { x, h, lean, delay, dur, op, i };
  });
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] h-44 overflow-hidden">
      {blades.map((b) => (
        <span
          key={b.i}
          className="grass-blade absolute bottom-0"
          style={{
            left: `${b.x}%`,
            height: `${b.h}px`,
            width: "2px",
            opacity: b.op,
            background: "linear-gradient(to top, rgba(120,82,28,0) 0%, rgba(199,154,74,0.9) 60%, rgba(231,196,112,1) 100%)",
            transformOrigin: "bottom center",
            ["--lean" as string]: `${b.lean}deg`,
            animationDelay: `${b.delay}s`,
            animationDuration: `${b.dur}s`,
            borderRadius: "2px",
          }}
        />
      ))}
    </div>
  );
}

/** Sumi-e ink brush divider. */
export function BrushDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex justify-center py-10 ${className}`}>
      <svg width="340" height="26" viewBox="0 0 340 26" className="text-crimson/80">
        <path
          fill="currentColor"
          d="M6 14c40-7 90-9 150-8 70 1 130 4 178 9-46 6-104 8-176 7C84 21 38 19 6 14z"
        />
        <path fill="currentColor" opacity="0.5" d="M250 13c30 0 60 1 84 4-26 2-56 2-86 1z" />
        <circle cx="320" cy="13" r="2.5" fill="#c79a4a" />
      </svg>
    </div>
  );
}

export function Torii({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 80" className={className} fill="currentColor" aria-hidden>
      <rect x="6" y="14" width="88" height="7" rx="1" />
      <path d="M2 12 H98 L92 6 H8 Z" />
      <rect x="20" y="30" width="60" height="5" rx="1" />
      <rect x="22" y="21" width="9" height="55" />
      <rect x="69" y="21" width="9" height="55" />
    </svg>
  );
}
