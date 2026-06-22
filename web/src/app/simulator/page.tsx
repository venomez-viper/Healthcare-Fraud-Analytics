"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { SlidersHorizontal, Target, Users, Crosshair } from "lucide-react";
import { Reveal } from "@/components/primitives";
import { Section, Kicker, Lantern } from "@/components/blocks";

type Point = { pct: number; reviewed: number; caught: number; recall: number };
type Curve = { testTotal: number; fraudTotal: number; points: Point[] };

export default function SimulatorPage() {
  const [curve, setCurve] = useState<Curve | null>(null);
  const [idx, setIdx] = useState(4); // default ~ top 1%

  useEffect(() => {
    fetch("/data/capture-curve.json")
      .then((r) => r.json())
      .then((c: Curve) => {
        setCurve(c);
        const i = c.points.findIndex((p) => p.pct === 1);
        if (i >= 0) setIdx(i);
      })
      .catch(() => {});
  }, []);

  const pts = curve?.points ?? [];
  const cur = pts[Math.min(idx, pts.length - 1)];
  const fraudTotal = curve?.fraudTotal ?? 0;

  // chart limited to the decision-relevant range (<= 25% budget)
  const view = useMemo(() => pts.filter((p) => p.pct <= 25), [pts]);
  const W = 720;
  const H = 280;
  const maxPct = 25;
  const x = (pct: number) => (Math.min(pct, maxPct) / maxPct) * W;
  const y = (recall: number) => H - recall * H;
  const path = view.map((p, i) => `${i ? "L" : "M"}${x(p.pct).toFixed(1)},${y(p.recall).toFixed(1)}`).join(" ");
  const area = view.length
    ? `${path} L${x(view[view.length - 1].pct).toFixed(1)},${H} L0,${H} Z`
    : "";

  return (
    <main className="font-sans">
      <Section>
        <Reveal>
          <Kicker icon={<SlidersHorizontal className="h-4 w-4" />}>BUDGET SIMULATOR</Kicker>
          <h2 className="section-title">
            How much fraud can you catch{" "}
            <span className="text-crimson-bright">this week?</span>
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="section-lead">
            Investigators have a fixed budget. Drag the dial to set how many
            providers you can review, and see how much known fraud the ranked
            worklist puts in your hands, and how much you would miss.
          </p>
        </Reveal>

        {curve && cur && (
          <Reveal delay={0.15}>
            <Lantern className="mt-10">
              {/* dial */}
              <div className="mb-8">
                <div className="mb-2 flex items-center justify-between text-xs tracking-widest text-ash">
                  <span>REVIEW BUDGET</span>
                  <span className="text-gold">top {cur.pct}% of providers</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={pts.length - 1}
                  step={1}
                  value={idx}
                  onChange={(e) => setIdx(Number(e.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-secondary accent-crimson"
                  aria-label="review budget"
                />
                <div className="mt-1 flex justify-between text-[10px] text-ash/60">
                  <span>0.1%</span>
                  <span>1%</span>
                  <span>10%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* readouts */}
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <Stat icon={<Users className="h-4 w-4" />} label="PROVIDERS TO REVIEW"
                  value={cur.reviewed.toLocaleString()} />
                <Stat icon={<Target className="h-4 w-4" />} label="KNOWN FRAUD CAUGHT"
                  value={`${cur.caught} / ${fraudTotal}`} tone="gold" />
                <Stat icon={<Crosshair className="h-4 w-4" />} label="RECALL"
                  value={`${(cur.recall * 100).toFixed(1)}%`} tone="crimson" />
                <Stat icon={<Users className="h-4 w-4" />} label="FRAUD MISSED"
                  value={(fraudTotal - cur.caught).toString()} />
              </div>

              {/* curve */}
              <div className="mt-8">
                <p className="mb-2 text-xs tracking-widest text-ash">
                  FRAUD CAUGHT vs REVIEW BUDGET
                </p>
                <svg viewBox={`0 0 ${W} ${H}`} className="h-64 w-full">
                  {[0.25, 0.5, 0.75].map((g) => (
                    <line key={g} x1={0} x2={W} y1={H - g * H} y2={H - g * H}
                      stroke="rgba(199,154,74,0.12)" strokeWidth={1} />
                  ))}
                  <path d={area} fill="rgba(224,70,58,0.10)" />
                  <path d={path} fill="none" stroke="#e0463a" strokeWidth={2.5} />
                  <line x1={x(cur.pct)} x2={x(cur.pct)} y1={0} y2={H}
                    stroke="#c79a4a" strokeWidth={1} strokeDasharray="4 4" />
                  <circle cx={x(cur.pct)} cy={y(cur.recall)} r={5} fill="#ffe0a0"
                    stroke="#e0463a" strokeWidth={2} />
                </svg>
                <div className="flex justify-between text-[10px] text-ash/60">
                  <span>0%</span>
                  <span>review budget (share of all providers)</span>
                  <span>25%</span>
                </div>
              </div>

              <p className="mt-6 text-center text-sm text-ash">
                Reviewing the top{" "}
                <span className="text-gold">{cur.pct}%</span> surfaces{" "}
                <span className="text-washi">{(cur.recall * 100).toFixed(0)}%</span> of
                all known fraud, that is{" "}
                <span className="text-crimson-bright">
                  {fraudTotal ? (cur.recall / (cur.pct / 100)).toFixed(0) : "—"}x
                </span>{" "}
                better than reviewing at random.
              </p>
            </Lantern>
          </Reveal>
        )}
      </Section>
    </main>
  );
}

function Stat({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "gold" | "crimson";
}) {
  const c = tone === "crimson" ? "text-crimson-bright" : tone === "gold" ? "text-gold" : "text-washi";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-md border border-border bg-sumi/40 p-4 text-center"
    >
      <div className="mb-1 flex justify-center text-gold/70">{icon}</div>
      <div className={`font-heading text-2xl font-bold ${c}`}>{value}</div>
      <div className="mt-1 text-[10px] tracking-widest text-ash">{label}</div>
    </motion.div>
  );
}
