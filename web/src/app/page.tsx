"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ShieldAlert,
  Database,
  Users,
  ListOrdered,
  ScrollText,
  Ghost,
  ArrowDown,
} from "lucide-react";
import { Reveal, Counter, Seal } from "@/components/primitives";
import { CrimsonSun, MountainRidges, GrassBand, BrushDivider, Ronin } from "@/components/scenery";
import { Section, Kicker, Lantern } from "@/components/blocks";
import { Meteors } from "@/components/ui/meteors";
import { ShaderBackground } from "@/components/ui/animated-shader-hero";
import AnimatedTextCycle from "@/components/ui/animated-text-cycle";
import { Typewriter } from "@/components/ui/typewriter-text";
import { Features } from "@/components/ui/features-8";
import { Component as LightningSplit } from "@/components/ui/lightning-split";

type Provider = {
  rank: number;
  known_fraud: number;
  npi: string;
  provider_type: string;
  state: string;
  reasons: string;
};

export default function Home() {
  const [providers, setProviders] = useState<Provider[]>([]);
  useEffect(() => {
    fetch("/data/providers.json")
      .then((r) => r.json())
      .then(setProviders)
      .catch(() => setProviders([]));
  }, []);

  return (
    <main className="relative font-sans">
      {/* ===== HERO ===== */}
      <section className="relative flex min-h-[92vh] flex-col items-center justify-center overflow-hidden px-6 text-center">
        <ShaderBackground className="absolute inset-0 -z-[1] h-full w-full" />
        <div
          aria-hidden
          className="absolute inset-0 -z-[1] bg-gradient-to-b from-ink/40 via-transparent to-[#0a0705]"
        />
        {/* Solid dark left/right edge mask so the shader's glow never pulses at
            the screen edges (that edge shimmer read as flicker). */}
        <div
          aria-hidden
          className="absolute inset-0 -z-[1]"
          style={{
            background:
              "linear-gradient(90deg, #0a0705 0%, rgba(10,7,5,0) 14%, rgba(10,7,5,0) 86%, #0a0705 100%)",
          }}
        />
        <Meteors number={4} />
        <CrimsonSun className="left-1/2 top-[20%] -translate-x-1/2 -translate-y-1/2" />
        <MountainRidges />
        <Ronin className="bottom-[5.5rem] left-[60%] z-[2] h-[34vh] w-[21vh] drop-shadow-[0_8px_24px_rgba(0,0,0,0.7)] md:left-[64%]" />
        <GrassBand />

        <div className="pointer-events-none absolute right-6 top-[22%] hidden select-none font-heading text-6xl text-washi/10 md:block vertical-jp">
          見えざる敵
        </div>

        <div className="relative z-10 -mt-16 flex flex-col items-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.15 }}
            className="font-heading text-6xl font-extrabold leading-[1.02] tracking-tight text-washi drop-shadow-[0_2px_20px_rgba(0,0,0,0.8)] md:text-8xl"
          >
            We hunt the fraud
            <br />
            that{" "}
            <AnimatedTextCycle
              words={["hides.", "lurks.", "cheats.", "bills."]}
              interval={2600}
              className="text-crimson-bright text-glow"
            />
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="mt-8 max-w-2xl text-lg leading-relaxed text-washi/75 drop-shadow-[0_1px_10px_rgba(0,0,0,0.85)]"
          >
            Billions vanish each year to dishonest medical providers. Investigators can
            only check a handful. This engine reads real Medicare billing and hands them
            a short, ranked, explained list of exactly who to look at first.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.7 }}
            className="mt-11 flex flex-col items-center gap-5"
          >
            <p className="font-mono text-xs tracking-wider text-gold/70">
              <span className="text-crimson-bright">&gt;</span>{" "}
              <Typewriter
                text={[
                  "reading real Medicare billing...",
                  "ranking by peer deviation...",
                  "explaining every flag.",
                ]}
                speed={55}
                deleteSpeed={28}
                loop
                cursor="▋"
              />
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <a
                href="#problem"
                className="lantern-glow rounded-sm bg-crimson px-8 py-3.5 text-sm font-medium tracking-wide text-primary-foreground transition hover:bg-crimson-bright"
              >
                See how it works
              </a>
              <Link
                href="/methodology"
                className="rounded-sm border border-gold/30 px-8 py-3.5 text-sm tracking-wide text-washi/90 transition hover:border-gold/70 hover:text-gold"
              >
                The methodology
              </Link>
            </div>
            <ArrowDown className="h-5 w-5 animate-bounce text-gold/60" />
          </motion.div>
        </div>
      </section>

      {/* ===== PROBLEM ===== */}
      <Section id="problem">
        <Reveal>
          <Kicker icon={<ShieldAlert className="h-4 w-4" />}>THE PROBLEM</Kicker>
          <h2 className="section-title">
            Up to <span className="text-crimson-bright">$300 billion</span> a year is
            lost to healthcare fraud.
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="section-lead">
            A small number of providers bill for care that never happened, patients
            they never saw, or procedures no one needed. Hidden among more than a
            million honest providers, they are nearly impossible to spot by hand.
          </p>
        </Reveal>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {[
            { n: 300, suffix: "B+", label: "US dollars lost every year", prefix: "$" },
            { n: 1.2, suffix: "M", label: "providers to watch", decimals: 1 },
            { n: 1, suffix: "%", label: "investigators can ever review" },
          ].map((s, i) => (
            <Reveal key={i} delay={0.1 * i}>
              <Lantern className="text-center">
                <div className="font-heading text-5xl font-bold text-gold">
                  <Counter to={s.n} suffix={s.suffix} prefix={s.prefix} decimals={s.decimals} />
                </div>
                <p className="mt-2 text-sm text-ash">{s.label}</p>
              </Lantern>
            </Reveal>
          ))}
        </div>
      </Section>

      <BrushDivider />

      {/* ===== THE IDEA ===== */}
      <Section>
        <Reveal>
          <Kicker icon={<ListOrdered className="h-4 w-4" />}>THE IDEA</Kicker>
          <h2 className="section-title">
            We do not try to catch all fraud. We decide{" "}
            <span className="text-crimson-bright">who to check first.</span>
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="section-lead">
            Picture an investigator with time to review only the top few providers this
            week. Our job is to make that short list as dense with real fraud as
            possible, like a master archer taking one perfect shot instead of firing
            blindly into the dark.
          </p>
        </Reveal>
      </Section>

      {/* ===== HOW IT WORKS ===== */}
      <Section>
        <Reveal>
          <Kicker icon={<Database className="h-4 w-4" />}>HOW IT WORKS</Kicker>
          <h2 className="section-title">Four steps, from raw billing to a worklist.</h2>
        </Reveal>
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {[
            {
              icon: <Database className="h-6 w-6" />,
              t: "1. Gather real data",
              d: "We use the government's real Medicare billing records, paired with the official public list of providers already banned for fraud (the LEIE).",
            },
            {
              icon: <Users className="h-6 w-6" />,
              t: "2. Compare true peers",
              d: "Billing a lot is not fraud. We compare each provider only to their real peers, a cardiologist against cardiologists, never against dentists.",
            },
            {
              icon: <ListOrdered className="h-6 w-6" />,
              t: "3. Rank the suspicious",
              d: "A model learns the patterns of known fraud and ranks every provider by how unusual they look against their peer group.",
            },
            {
              icon: <ScrollText className="h-6 w-6" />,
              t: "4. Explain every flag",
              d: "No black box. Each flagged provider arrives with a plain reason, like 'bills 3 standard deviations above peers per patient.'",
            },
          ].map((s, i) => (
            <Reveal key={i} delay={0.08 * i}>
              <Lantern className="flex gap-4">
                <div className="mt-1 text-crimson-bright">{s.icon}</div>
                <div>
                  <h3 className="font-heading text-lg text-washi">{s.t}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ash">{s.d}</p>
                </div>
              </Lantern>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ===== AT A GLANCE (21st features grid) ===== */}
      <Section>
        <Reveal>
          <Kicker icon={<ShieldAlert className="h-4 w-4" />}>AT A GLANCE</Kicker>
          <h2 className="section-title">What the engine actually delivers.</h2>
        </Reveal>
        <Features />
      </Section>

      <BrushDivider />

      {/* ===== BREAKTHROUGH ===== */}
      <Section>
        <Reveal>
          <Kicker icon={<Ghost className="h-4 w-4" />}>OUR BREAKTHROUGH</Kicker>
          <h2 className="section-title">
            We stopped judging a provider on a single{" "}
            <span className="text-crimson-bright">snapshot.</span>
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="section-lead">
            A fraudster and an honest doctor can look alike in one year. Their{" "}
            <span className="text-gold">trajectory</span> gives them away: how their
            billing trends, swings, and jumps over time. We add leakage-safe
            "as-of" trajectory features, using only each provider&apos;s own past, never
            the future. That nearly doubled the fraud caught in the critical top slice.
          </p>
        </Reveal>
        <Reveal delay={0.15}>
          <div className="mt-10 h-[60vh] w-full overflow-hidden rounded-md border border-border lantern-glow">
            <LightningSplit
              leftComponent={
                <div className="flex h-full w-full flex-col items-center justify-center bg-[#0b0907] p-8 text-center">
                  <p className="text-xs tracking-[0.3em] text-ash">SNAPSHOT ONLY</p>
                  <p className="mt-4 max-w-xs text-washi">
                    Judges each provider on a{" "}
                    <span className="text-ash/70">single year</span> of billing.
                  </p>
                  <div className="mt-6 font-heading text-5xl text-ash/70">17%</div>
                  <p className="mt-1 text-xs text-ash">caught in top 1%</p>
                </div>
              }
              rightComponent={
                <div className="flex h-full w-full flex-col items-center justify-center bg-[#15100c] p-8 text-center">
                  <p className="text-xs tracking-[0.3em] text-gold">+ BILLING TRAJECTORY</p>
                  <p className="mt-4 max-w-xs text-washi">
                    Reads how each provider&apos;s billing{" "}
                    <span className="text-gold">moves over time</span>.
                  </p>
                  <div className="mt-6 font-heading text-6xl font-bold text-crimson-bright text-glow">
                    29%
                  </div>
                  <p className="mt-1 text-xs text-gold">caught in top 1%</p>
                </div>
              }
            />
          </div>
          <p className="mt-3 text-center text-xs text-ash/60">
            Hover left or right to draw the blade between the two approaches.
          </p>
        </Reveal>

        <Reveal delay={0.2}>
          <Lantern className="mt-10 text-center">
            <p className="text-sm tracking-widest text-gold">TOP 1% OF THE WORKLIST</p>
            <div className="mt-3 flex items-end justify-center gap-10">
              <div>
                <div className="font-heading text-4xl text-ash/70">17%</div>
                <p className="mt-1 text-xs text-ash">snapshot only</p>
              </div>
              <div className="text-2xl text-gold">→</div>
              <div>
                <div className="font-heading text-5xl font-bold text-crimson-bright text-glow">
                  <Counter to={29} suffix="%" />
                </div>
                <p className="mt-1 text-xs text-gold">with billing trajectory</p>
              </div>
            </div>
            <p className="mt-5 text-sm text-ash">
              A <span className="text-washi">72% relative jump</span> in fraud caught
              for the same investigator effort, across 5 splits and leakage-audited.
            </p>
          </Lantern>
        </Reveal>
      </Section>

      <BrushDivider />

      {/* ===== RESULTS ===== */}
      <Section>
        <Reveal>
          <Kicker icon={<ShieldAlert className="h-4 w-4" />}>THE RESULTS</Kicker>
          <h2 className="section-title">It works, and it stays honest about it.</h2>
        </Reveal>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {[
            { n: 0.86, decimals: 2, label: "ROC-AUC, beating the published benchmark" },
            { n: 61, suffix: "%", label: "of known fraud caught in just the top 10%" },
            { n: 72, suffix: "%", label: "more fraud in the top 1% from billing trajectory" },
          ].map((s, i) => (
            <Reveal key={i} delay={0.1 * i}>
              <Lantern className="text-center">
                <div className="font-heading text-5xl font-bold text-gold">
                  <Counter to={s.n} suffix={s.suffix} decimals={s.decimals} />
                </div>
                <p className="mt-2 text-sm text-ash">{s.label}</p>
              </Lantern>
            </Reveal>
          ))}
        </div>

        {providers.length > 0 && (
          <Reveal delay={0.15}>
            <div className="mt-14">
              <p className="mb-4 text-center text-sm tracking-widest text-ash">
                WHAT AN INVESTIGATOR SEES
              </p>
              <div className="overflow-hidden rounded-md border border-border bg-sumi/60">
                {providers.slice(0, 6).map((p) => (
                  <div
                    key={p.npi}
                    className="flex items-center gap-4 border-b border-border/50 px-5 py-4 text-left transition last:border-0 hover:bg-crimson/5"
                  >
                    <span className="w-8 font-heading text-lg text-gold/80">{p.rank}</span>
                    <div className="flex-1">
                      <p className="text-sm text-washi">
                        {p.provider_type} <span className="text-ash">· {p.state}</span>
                      </p>
                      <p className="text-xs text-ash/80">{p.reasons}</p>
                    </div>
                    {p.known_fraud === 1 && <Seal kanji="罪" />}
                  </div>
                ))}
              </div>
              <p className="mt-3 text-center text-xs text-ash/60">
                Red seal marks a provider on the official fraud list. Reasons are
                auto-generated from peer comparison.
              </p>
            </div>
          </Reveal>
        )}

        <Reveal delay={0.2}>
          <div className="mt-12 flex flex-wrap justify-center gap-4">
            <Link
              href="/solution"
              className="rounded-sm bg-crimson px-7 py-3 text-sm tracking-wide text-primary-foreground transition hover:bg-crimson-bright"
            >
              Explore the solution
            </Link>
            <Link
              href="/about"
              className="rounded-sm border border-gold/30 px-7 py-3 text-sm tracking-wide text-washi/90 transition hover:border-gold/70 hover:text-gold"
            >
              About the project
            </Link>
          </div>
        </Reveal>
      </Section>
    </main>
  );
}
