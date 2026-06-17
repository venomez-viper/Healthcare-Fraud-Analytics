"use client";

import { useEffect, useState } from "react";
import { ListOrdered, ScrollText, Gauge, Users } from "lucide-react";
import { Reveal, Seal } from "@/components/primitives";
import { BrushDivider } from "@/components/scenery";
import { PageHeader, Section, Kicker, Lantern } from "@/components/blocks";

type Provider = {
  rank: number;
  known_fraud: number;
  npi: string;
  provider_type: string;
  state: string;
  reasons: string;
};

export default function SolutionPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  useEffect(() => {
    fetch("/data/providers.json").then((r) => r.json()).then(setProviders).catch(() => {});
  }, []);

  return (
    <main className="font-sans">
      <PageHeader
        kanji="解"
        eyebrow="THE SOLUTION"
        title="A ranked, explained worklist for fraud investigators."
        lead="Not a verdict, a starting point. The engine turns millions of billing records into a short, ordered list of who to investigate first, each entry carrying its own reason."
      />

      <Section>
        <div className="grid gap-5 md:grid-cols-2">
          {[
            { icon: <ListOrdered className="h-6 w-6" />, t: "Prioritised, not exhaustive", d: "We optimise the density of real fraud in the top few percent, the slice an investigator can actually review, rather than chasing every case." },
            { icon: <Users className="h-6 w-6" />, t: "Peer-aware", d: "Each provider is judged against true peers in the same specialty and year, so volume alone never triggers a flag." },
            { icon: <ScrollText className="h-6 w-6" />, t: "Explained by design", d: "Every flag ships with plain-language reasons drawn from peer deviations, so a human can judge it in seconds." },
            { icon: <Gauge className="h-6 w-6" />, t: "Budget-shaped", d: "Tune the review budget (top 1, 5, or 10 percent) and the worklist adapts to the capacity a team actually has." },
          ].map((s, i) => (
            <Reveal key={i} delay={0.07 * i}>
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

      <BrushDivider />

      <Section>
        <Reveal>
          <Kicker>THE WORKLIST</Kicker>
          <h2 className="section-title">What an investigator opens each morning.</h2>
          <p className="section-lead">
            Ranked by fraud probability. A red seal marks providers already on the
            official exclusion list. The reasons are generated from peer comparison.
          </p>
        </Reveal>
        {providers.length > 0 && (
          <Reveal delay={0.12}>
            <div className="mt-10 overflow-hidden rounded-md border border-border bg-sumi/60">
              {providers.slice(0, 12).map((p) => (
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
          </Reveal>
        )}
      </Section>
    </main>
  );
}
