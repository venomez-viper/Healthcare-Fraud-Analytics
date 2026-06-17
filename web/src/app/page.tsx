"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ShieldAlert,
  Database,
  Users,
  ListOrdered,
  ScrollText,
  Ghost,
  Code2,
  ArrowDown,
} from "lucide-react";
import { FallingLeaves } from "@/components/falling-leaves";
import { Reveal, Counter, Seal, Divider } from "@/components/primitives";

type Provider = {
  rank: number;
  score: number;
  known_fraud: number;
  npi: string;
  provider_type: string;
  state: string;
  tot_medicare_payment: number;
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
    <main className="relative font-sans text-washi">
      <FallingLeaves />

      {/* ===== NAV ===== */}
      <nav className="sticky top-0 z-30 flex items-center justify-between border-b border-border/60 bg-ink/70 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Seal kanji="監" className="h-8 w-8" />
          <span className="font-heading text-sm tracking-[0.25em] text-washi/90">
            FRAUD RISK EXPLORER
          </span>
        </div>
        <a
          href="https://github.com/venomez-viper/Healthcare-Fraud-Analytics"
          target="_blank"
          className="flex items-center gap-2 text-xs tracking-widest text-ash transition hover:text-gold"
        >
          <Code2 className="h-4 w-4" /> REPOSITORY
        </a>
      </nav>

      {/* ===== HERO ===== */}
      <section className="paper-grain relative flex min-h-[92vh] flex-col items-center justify-center overflow-hidden px-6 text-center">
        <div className="pointer-events-none absolute right-8 top-1/4 hidden select-none font-heading text-7xl text-crimson/15 md:block vertical-jp">
          見えざる敵
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="mb-6 flex items-center gap-2 rounded-full border border-gold/30 bg-sumi/60 px-4 py-1.5 text-[11px] tracking-[0.3em] text-gold"
        >
          <Ghost className="h-3.5 w-3.5" /> THE HUNT FOR HIDDEN FRAUD
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.15 }}
          className="font-heading text-5xl font-extrabold leading-[1.05] text-washi md:text-7xl"
        >
          We hunt the fraud
          <br />
          <span className="text-crimson-bright text-glow">that hides.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="mt-7 max-w-2xl text-lg leading-relaxed text-ash"
        >
          Billions vanish each year to dishonest medical providers. Investigators can
          only check a handful. This engine reads real Medicare billing and hands them
          a short, ranked, explained list of exactly who to look at first.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.7 }}
          className="mt-10 flex flex-col items-center gap-3"
        >
          <a
            href="#problem"
            className="lantern-glow rounded-sm bg-crimson px-7 py-3 text-sm font-medium tracking-wide text-primary-foreground transition hover:bg-crimson-bright"
          >
            See how it works
          </a>
          <ArrowDown className="mt-4 h-5 w-5 animate-bounce text-gold/60" />
        </motion.div>
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
              <Lantern>
                <div className="font-heading text-5xl font-bold text-gold">
                  <Counter to={s.n} suffix={s.suffix} prefix={s.prefix} decimals={s.decimals} />
                </div>
                <p className="mt-2 text-sm text-ash">{s.label}</p>
              </Lantern>
            </Reveal>
          ))}
        </div>
      </Section>

      <Divider />

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
            Picture an investigator with time to review only the top few providers
            this week. Our job is to make that short list as dense with real fraud as
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
              <Lantern className="flex gap-4 text-left">
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

      <Divider />

      {/* ===== BREAKTHROUGH ===== */}
      <Section>
        <Reveal>
          <Kicker icon={<Ghost className="h-4 w-4" />}>OUR BREAKTHROUGH</Kicker>
          <h2 className="section-title">
            Most cheaters were never caught, so we stopped calling them{" "}
            <span className="text-crimson-bright">innocent.</span>
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="section-lead">
            The official fraud list only contains providers who got caught. The
            standard approach wrongly treats everyone else as honest. We treat them as{" "}
            <span className="text-gold">unknown</span> instead, the proper way to learn
            from incomplete labels. That single shift found far more fraud in the
            critical top slice.
          </p>
        </Reveal>
        <Reveal delay={0.2}>
          <Lantern className="mt-10">
            <p className="text-sm tracking-widest text-gold">TOP 1% OF THE WORKLIST</p>
            <div className="mt-3 flex items-end justify-center gap-10">
              <div>
                <div className="font-heading text-4xl text-ash/70">14%</div>
                <p className="mt-1 text-xs text-ash">standard approach</p>
              </div>
              <div className="text-2xl text-gold">→</div>
              <div>
                <div className="font-heading text-5xl font-bold text-crimson-bright text-glow">
                  <Counter to={21} suffix="%" />
                </div>
                <p className="mt-1 text-xs text-gold">our PU-learning engine</p>
              </div>
            </div>
            <p className="mt-5 text-sm text-ash">
              A <span className="text-washi">49% relative jump</span> in fraud caught,
              for the same investigator effort.
            </p>
          </Lantern>
        </Reveal>
      </Section>

      <Divider />

      {/* ===== RESULTS ===== */}
      <Section>
        <Reveal>
          <Kicker icon={<ShieldAlert className="h-4 w-4" />}>THE RESULTS</Kicker>
          <h2 className="section-title">It works, and it stays honest about it.</h2>
        </Reveal>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {[
            { n: 0.81, decimals: 2, label: "ROC-AUC, matching the published benchmark" },
            { n: 56, suffix: "%", label: "of known fraud caught in just the top 10%" },
            { n: 49, suffix: "%", label: "more fraud in the top 1% via PU learning" },
          ].map((s, i) => (
            <Reveal key={i} delay={0.1 * i}>
              <Lantern>
                <div className="font-heading text-5xl font-bold text-gold">
                  <Counter to={s.n} suffix={s.suffix} decimals={s.decimals} />
                </div>
                <p className="mt-2 text-sm text-ash">{s.label}</p>
              </Lantern>
            </Reveal>
          ))}
        </div>

        {/* live worklist preview */}
        {providers.length > 0 && (
          <Reveal delay={0.15}>
            <div className="mt-14">
              <p className="mb-4 text-center text-sm tracking-widest text-ash">
                WHAT AN INVESTIGATOR SEES
              </p>
              <div className="overflow-hidden rounded-md border border-border bg-sumi/60 text-left">
                {providers.slice(0, 6).map((p) => (
                  <div
                    key={p.npi}
                    className="flex items-center gap-4 border-b border-border/50 px-5 py-4 transition last:border-0 hover:bg-crimson/5"
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
      </Section>

      <Divider />

      {/* ===== CREDITS ===== */}
      <Section>
        <Reveal>
          <Kicker icon={<ScrollText className="h-4 w-4" />}>
            STANDING ON THEIR SHOULDERS
          </Kicker>
          <h2 className="section-title">Built on real research and real data.</h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="section-lead">
            The data construction, metrics, and explanations follow the published
            Medicare-fraud work of the Florida Atlantic University group (Khoshgoftaar,
            Bauder, Herland, Johnson, Hancock). Models are fit with BreezeML. The data
            is real US government records, with no private patient information.
          </p>
        </Reveal>
      </Section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-border/60 px-6 py-10 text-center">
        <Seal kanji="監" className="mx-auto mb-4" />
        <p className="font-heading text-sm tracking-[0.25em] text-washi/80">
          PROVIDER FRAUD RISK EXPLORER
        </p>
        <p className="mt-2 text-xs text-ash">
          Built by Akash and Shruti Pingle · Real CMS + LEIE data · Not for clinical or
          enforcement use
        </p>
      </footer>
    </main>
  );
}

/* ---------- small layout helpers ---------- */

function Section({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="mx-auto max-w-5xl px-6 py-24 text-center">
      {children}
    </section>
  );
}

function Kicker({ children, icon }: { children: React.ReactNode; icon: React.ReactNode }) {
  return (
    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold/25 bg-sumi/60 px-4 py-1.5 text-[11px] tracking-[0.3em] text-gold">
      {icon}
      {children}
    </div>
  );
}

function Lantern({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={
        "paper-grain rounded-md border border-border bg-sumi/70 p-7 transition hover:border-gold/40 " +
        (className ?? "")
      }
    >
      {children}
    </div>
  );
}
