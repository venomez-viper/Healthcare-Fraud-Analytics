"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { MapPin, ShieldAlert, Activity, BarChart3, Radar, Flame } from "lucide-react";
import type { StateStat } from "@/components/atlas/fraud-map";

const FraudMap = dynamic(
  () => import("@/components/atlas/fraud-map").then((m) => m.FraudMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center text-sm tracking-[0.3em] text-ash">
        <span className="animate-pulse">SUMMONING THE MAP…</span>
      </div>
    ),
  }
);

type Summary = {
  kpis: { total: number; known: number; avgScore: number; states: number; types: number };
  topTypes: { type: string; count: number }[];
  scoreHist: number[];
  topProviders: {
    rank: number;
    type: string;
    state: string;
    score: number;
    known: number;
    payPerBene: number;
  }[];
};

export default function AtlasPage() {
  const [stats, setStats] = useState<StateStat[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [selected, setSelected] = useState<StateStat | null>(null);

  useEffect(() => {
    fetch("/data/state-fraud.json").then((r) => r.json()).then(setStats).catch(() => {});
    fetch("/data/atlas-summary.json").then((r) => r.json()).then(setSummary).catch(() => {});
  }, []);

  const topStates = useMemo(() => stats.slice(0, 10), [stats]);
  const maxState = topStates[0]?.count ?? 1;
  const maxType = summary?.topTypes[0]?.count ?? 1;
  const maxHist = Math.max(1, ...(summary?.scoreHist ?? [1]));

  return (
    <main className="relative h-[calc(100vh-65px)] w-full overflow-hidden font-sans">
      {/* MAP */}
      <div className="absolute inset-0">
        <FraudMap onSelect={setSelected} />
      </div>
      {/* vignette so panels read */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 40%, transparent 55%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      {/* TOP BAR */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between px-6 py-4">
        <p className="flex items-center gap-2 text-[11px] tracking-[0.35em] text-gold">
          <MapPin className="h-3.5 w-3.5" /> THE FRAUD ATLAS
        </p>
        <p className="hidden text-[10px] tracking-[0.3em] text-ash md:block">
          REAL-TIME CMS + LEIE RISK SURFACE · ENGINE v2
        </p>
      </div>

      {/* LEFT RAIL */}
      <div className="absolute left-0 top-14 z-10 flex h-[calc(100%-3.5rem)] w-72 flex-col gap-3 overflow-y-auto p-4">
        <Panel delay={0}>
          <h1 className="font-heading text-2xl font-bold leading-tight text-washi">
            Where the hidden fraud hides.
          </h1>
          <p className="mt-1.5 text-xs leading-relaxed text-ash">
            States rise and redden with the volume of high-risk providers our
            engine surfaced. Hover to inspect, click to pin.
          </p>
        </Panel>

        <Panel delay={0.05} title="THE TOLL" icon={<Activity className="h-3.5 w-3.5" />}>
          <div className="grid grid-cols-2 gap-3">
            <Kpi label="FLAGGED" value={summary?.kpis.total ?? "—"} tone="gold" />
            <Kpi label="KNOWN FRAUD" value={summary?.kpis.known ?? "—"} tone="crimson" />
            <Kpi label="STATES" value={summary?.kpis.states ?? "—"} />
            <Kpi label="SPECIALTIES" value={summary?.kpis.types ?? "—"} />
          </div>
        </Panel>

        <Panel delay={0.1} title="FRAUD BY SPECIALTY" icon={<BarChart3 className="h-3.5 w-3.5" />}>
          <div className="space-y-2">
            {(summary?.topTypes ?? []).slice(0, 7).map((t) => (
              <div key={t.type}>
                <div className="flex justify-between text-[11px]">
                  <span className="truncate pr-2 text-washi/80">{t.type}</span>
                  <span className="text-gold">{t.count}</span>
                </div>
                <Bar pct={(t.count / maxType) * 100} />
              </div>
            ))}
          </div>
        </Panel>

        <Panel delay={0.15} title="RISK SCORE DISTRIBUTION" icon={<Radar className="h-3.5 w-3.5" />}>
          <div className="flex h-20 items-end gap-1">
            {(summary?.scoreHist ?? []).map((v, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-sm bg-gradient-to-t from-gold/40 to-crimson-bright"
                  style={{ height: `${(v / maxHist) * 100}%` }}
                  title={`${(i / 10).toFixed(1)}–${((i + 1) / 10).toFixed(1)}: ${v}`}
                />
              </div>
            ))}
          </div>
          <div className="mt-1 flex justify-between text-[9px] text-ash">
            <span>0.0</span>
            <span>risk score</span>
            <span>1.0</span>
          </div>
        </Panel>
      </div>

      {/* RIGHT RAIL */}
      <div className="absolute right-0 top-14 z-10 flex h-[calc(100%-3.5rem)] w-80 flex-col gap-3 overflow-y-auto p-4">
        <Panel delay={0.05} title="TOP STATES BY RISK VOLUME" icon={<ShieldAlert className="h-3.5 w-3.5" />}>
          <div className="space-y-2">
            {topStates.map((s, i) => (
              <button
                key={s.postal}
                onClick={() => setSelected(s)}
                className="group block w-full text-left"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-washi/90">
                    <span className="mr-2 text-ash">{i + 1}</span>
                    {s.postal}
                    {s.known > 0 && (
                      <span className="ml-2 text-crimson-bright">●{s.known}</span>
                    )}
                  </span>
                  <span className="text-gold">{s.count}</span>
                </div>
                <Bar pct={(s.count / maxState) * 100} />
              </button>
            ))}
          </div>
        </Panel>

        <Panel delay={0.1} title="SELECTED" icon={<MapPin className="h-3.5 w-3.5" />}>
          {selected ? (
            <motion.div key={selected.postal} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="font-heading text-lg text-washi">
                {selected.name} <span className="text-xs text-ash">({selected.postal})</span>
              </h2>
              <dl className="mt-2 space-y-1.5 text-xs">
                <Row k="Flagged providers" v={selected.count} />
                <Row k="On the LEIE list" v={selected.known} accent />
                <Row k="Avg risk score" v={selected.avgScore.toFixed(3)} />
                <Row k="Most-flagged type" v={selected.topType} />
              </dl>
            </motion.div>
          ) : (
            <p className="text-xs text-ash">Pick a state on the map or the list.</p>
          )}
        </Panel>

        <Panel delay={0.15} title="HIGHEST-RISK PROVIDERS" icon={<Flame className="h-3.5 w-3.5" />}>
          <div className="space-y-1.5">
            {(summary?.topProviders ?? []).map((p) => (
              <div
                key={p.rank}
                className="flex items-center gap-2 border-b border-border/40 pb-1.5 text-[11px] last:border-0"
              >
                <span className="w-5 font-heading text-gold/80">{p.rank}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-washi/90">
                    {p.type} <span className="text-ash">· {p.state}</span>
                  </p>
                  <p className="text-[10px] text-ash">${p.payPerBene.toLocaleString()}/bene</p>
                </div>
                <span className="text-gold">{p.score.toFixed(2)}</span>
                {p.known === 1 && <span className="text-crimson-bright" title="On LEIE">✦</span>}
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* LEGEND */}
      <div className="pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2">
        <div className="flex items-center gap-3 rounded-full border border-gold/20 bg-ink/60 px-4 py-1.5 text-[10px] tracking-widest text-ash backdrop-blur">
          <span>LOW</span>
          <span className="h-2 w-24 rounded-full bg-gradient-to-r from-[#7a5a1f] via-gold to-crimson-bright" />
          <span>HIGH RISK VOLUME</span>
        </div>
      </div>
    </main>
  );
}

function Panel({
  children,
  title,
  icon,
  delay = 0,
}: {
  children: React.ReactNode;
  title?: string;
  icon?: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="pointer-events-auto rounded-md border border-gold/15 bg-ink/55 p-3.5 backdrop-blur-md shadow-[0_0_30px_-12px_rgba(199,154,74,0.4)]"
    >
      {title && (
        <p className="mb-3 flex items-center gap-2 text-[10px] tracking-[0.25em] text-gold">
          {icon} {title}
        </p>
      )}
      {children}
    </motion.section>
  );
}

function Kpi({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: "gold" | "crimson";
}) {
  const c = tone === "crimson" ? "text-crimson-bright" : tone === "gold" ? "text-gold" : "text-washi";
  return (
    <div className="rounded-sm border border-border/50 bg-secondary/30 p-2">
      <div className={`font-heading text-xl font-bold ${c}`}>{value}</div>
      <div className="text-[9px] tracking-widest text-ash">{label}</div>
    </div>
  );
}

function Bar({ pct }: { pct: number }) {
  return (
    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
      <div
        className="h-full rounded-full bg-gradient-to-r from-gold to-crimson-bright transition-all group-hover:brightness-125"
        style={{ width: `${Math.max(2, pct)}%` }}
      />
    </div>
  );
}

function Row({ k, v, accent }: { k: string; v: string | number; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-ash">{k}</dt>
      <dd className={accent ? "text-crimson-bright" : "text-washi"}>{v}</dd>
    </div>
  );
}
