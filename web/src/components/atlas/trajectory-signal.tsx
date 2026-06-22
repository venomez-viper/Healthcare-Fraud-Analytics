"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

type Pt = { year: number; pay: number };
type Data = { fraud: Pt[][]; clean: Pt[][] };

const Y0 = 2019;
const Y1 = 2023;
const W = 760;
const H = 320;
const PAD = { l: 16, r: 16, t: 24, b: 28 };

function linePath(traj: Pt[]): string {
  const max = Math.max(...traj.map((p) => p.pay), 1);
  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;
  const x = (yr: number) => PAD.l + ((yr - Y0) / (Y1 - Y0)) * innerW;
  const y = (pay: number) => PAD.t + (1 - pay / max) * innerH;
  return traj
    .map((p, i) => `${i ? "L" : "M"}${x(p.year).toFixed(1)},${y(p.pay).toFixed(1)}`)
    .join(" ");
}

export function TrajectorySignal() {
  const [data, setData] = useState<Data | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  useEffect(() => {
    fetch("/data/trajectories.json")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  const fraud = useMemo(() => (data?.fraud ?? []).map(linePath), [data]);
  const clean = useMemo(() => (data?.clean ?? []).map(linePath), [data]);

  const innerW = W - PAD.l - PAD.r;
  const xYear = (yr: number) => PAD.l + ((yr - Y0) / (Y1 - Y0)) * innerW;

  return (
    <div ref={ref} className="rounded-md border border-gold/15 bg-ink/50 p-5 backdrop-blur-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs tracking-[0.25em] text-gold">THE SIGNAL · REAL BILLING TRAJECTORIES</p>
        <div className="flex items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1.5 text-crimson-bright">
            <span className="h-0.5 w-4 rounded bg-crimson-bright" /> excluded for fraud
          </span>
          <span className="flex items-center gap-1.5 text-ash">
            <span className="h-0.5 w-4 rounded bg-ash" /> clean provider
          </span>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* year gridlines */}
        {[2019, 2020, 2021, 2022, 2023].map((yr) => (
          <g key={yr}>
            <line
              x1={xYear(yr)}
              x2={xYear(yr)}
              y1={PAD.t}
              y2={H - PAD.b}
              stroke="rgba(199,154,74,0.10)"
              strokeWidth={1}
            />
            <text x={xYear(yr)} y={H - 8} textAnchor="middle" className="fill-ash" fontSize={11}>
              {yr}
            </text>
          </g>
        ))}

        {/* clean: flat, calm */}
        {clean.map((d, i) => (
          <motion.path
            key={`c${i}`}
            d={d}
            fill="none"
            stroke="#9c8f78"
            strokeWidth={1.5}
            strokeOpacity={0.55}
            initial={{ pathLength: 0 }}
            animate={inView ? { pathLength: 1 } : {}}
            transition={{ duration: 1.1, delay: 0.1 + i * 0.05, ease: "easeInOut" }}
          />
        ))}

        {/* fraud: spike then collapse, glowing */}
        {fraud.map((d, i) => (
          <motion.path
            key={`f${i}`}
            d={d}
            fill="none"
            stroke="#e0463a"
            strokeWidth={2.5}
            style={{ filter: "drop-shadow(0 0 6px rgba(224,70,58,0.55))" }}
            initial={{ pathLength: 0 }}
            animate={inView ? { pathLength: 1 } : {}}
            transition={{ duration: 1.4, delay: 0.5 + i * 0.12, ease: "easeOut" }}
          />
        ))}
      </svg>

      <p className="mt-2 text-center text-xs text-ash">
        Each line is one real provider&apos;s Medicare billing 2019-2023, scaled to its own
        peak. Fraudsters <span className="text-crimson-bright">erupt then vanish</span>;
        honest providers hold a <span className="text-washi">steady line</span>. The model
        reads that shape, leakage-safe and as-of.
      </p>
    </div>
  );
}
