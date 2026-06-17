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
        {/* far ridge */}
        <path
          d="M0 220 L160 180 L320 205 L520 150 L700 195 L900 140 L1120 190 L1300 160 L1440 195 L1440 360 L0 360 Z"
          fill="#0f1810"
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
    const lean = ((i * 53) % 12) - 6;
    const delay = ((i * 17) % 100) / 100;
    const dur = 5.5 + ((i * 7) % 40) / 10;
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
            background: "linear-gradient(to top, rgba(20,45,18,0) 0%, rgba(64,120,46,0.9) 55%, rgba(120,180,78,1) 100%)",
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

/** Lone ronin silhouette, katana planted, coat caught in the wind.
   Stands as a dark sumi-e cutout against the sun. Cloth + topknot sway. */
export function Ronin({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none absolute ${className}`}>
      <svg viewBox="0 0 200 320" className="h-full w-full overflow-visible" fill="#070504">
        {/* planted katana (blade into the ground, hilt up at his side) */}
        <g stroke="#070504" strokeLinecap="round">
          <line x1="150" y1="120" x2="150" y2="300" strokeWidth="3" />
          <line x1="142" y1="118" x2="158" y2="118" strokeWidth="5" />
        </g>
        {/* blood smeared down the blade + drips + ground pool */}
        <line x1="150" y1="150" x2="150" y2="298" stroke="#8c1c16" strokeWidth="1.6" strokeLinecap="round" />
        <ellipse cx="150" cy="306" rx="22" ry="5" fill="#7a1812" opacity="0.85" />
        <circle className="blood-drip" cx="150" cy="170" r="2.4" fill="#b1271f" />
        <circle className="blood-drip d2" cx="150" cy="170" r="2" fill="#9c1f18" />
        <circle className="blood-drip d3" cx="150" cy="170" r="1.7" fill="#b1271f" />
        {/* wind-blown coat tail (sways) */}
        <path className="ronin-cloth" style={{ ["--lean" as string]: "0deg" }}
          d="M96 200 C70 214 44 226 26 214 C50 232 78 236 104 224 Z" />
        {/* legs / hakama */}
        <path d="M86 196 C82 240 78 280 70 312 L92 312 C96 276 100 244 100 214 C100 244 104 276 108 312 L130 312 C122 280 118 240 114 196 Z" />
        {/* torso + flared haori shoulders */}
        <path d="M100 96 C84 100 74 110 70 128 L66 150 C74 146 80 150 82 162 L84 200 L116 200 L118 162 C120 150 126 146 134 150 L130 128 C126 110 116 100 100 96 Z" />
        {/* right arm down to katana hilt */}
        <path d="M118 132 C132 138 144 130 150 120 C152 126 146 138 132 146 C124 150 118 146 116 140 Z" />
        {/* head */}
        <circle cx="100" cy="80" r="15" />
        {/* topknot (sways) */}
        <path className="ronin-cloth" style={{ ["--lean" as string]: "4deg" }}
          d="M100 66 C104 56 112 52 122 54 C114 60 110 66 108 72 Z" />
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
