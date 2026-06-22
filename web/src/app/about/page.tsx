"use client";

import { Code2, Database, ShieldCheck, ExternalLink } from "lucide-react";
import { Reveal, Seal } from "@/components/primitives";
import { BrushDivider } from "@/components/scenery";
import { PageHeader, Section, Kicker, Lantern } from "@/components/blocks";

export default function AboutPage() {
  return (
    <main className="font-sans">
      <PageHeader
        kanji="仁"
        eyebrow="ABOUT"
        title="Two individuals hunting fraud in the open."
        lead="A capstone built on real government data, published research, and a willingness to be honest about what works and what does not."
      />

      <Section>
        <Reveal>
          <Kicker>THE TEAM</Kicker>
        </Reveal>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {([
            {
              n: "Akash Anipakalu Giridhar",
              r: "Data pipeline, modeling, web",
              href: "https://www.linkedin.com/in/akash-anipakalu-giridhar-1089011b1/",
            },
            {
              n: "Shruti Pingle",
              r: "Research, methodology, analysis",
              href: "https://www.linkedin.com/in/shruti-pingle-aa8034196/",
            },
          ] as { n: string; r: string; href?: string }[]).map((m, i) => (
            <Reveal key={i} delay={0.08 * i}>
              <Lantern className="flex items-center gap-4">
                <Seal kanji="士" className="h-11 w-11 text-base" />
                <div className="flex-1">
                  <h3 className="font-heading text-lg text-washi">{m.n}</h3>
                  <p className="text-sm text-ash">{m.r}</p>
                  {m.href && (
                    <a
                      href={m.href}
                      target="_blank"
                      className="mt-1.5 inline-flex items-center gap-1 text-xs tracking-wide text-gold transition hover:text-crimson-bright"
                    >
                      <ExternalLink className="h-3 w-3" /> LinkedIn
                    </a>
                  )}
                </div>
              </Lantern>
            </Reveal>
          ))}
        </div>
      </Section>

      <BrushDivider />

      <Section>
        <Reveal>
          <Kicker>STANDING ON THEIR SHOULDERS</Kicker>
          <h2 className="section-title">Built on real research.</h2>
        </Reveal>
        <Reveal delay={0.1}>
          <Lantern className="mt-8">
            <p className="text-sm leading-relaxed text-ash">
              The data construction, metrics, imbalance handling, and explanations
              follow the published Medicare-fraud work of the Florida Atlantic
              University group: <span className="text-washi">Matthew Herland, Taghi M.
              Khoshgoftaar, Richard A. Bauder, Justin M. Johnson, and John T. Hancock.</span>
              {" "}Full citations live in the repository.
            </p>
          </Lantern>
        </Reveal>
      </Section>

      <Section>
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { icon: <Database className="h-6 w-6" />, t: "Real data", d: "CMS Medicare Part B and the OIG LEIE. Public US government records, no private patient information." },
            { icon: <ShieldCheck className="h-6 w-6" />, t: "Honest limits", d: "Labels are incomplete and the data is synthetic-honest. This is research, not an enforcement tool." },
            { icon: <Code2 className="h-6 w-6" />, t: "Open source", d: "The full pipeline, models, and this site are on GitHub. Fit with BreezeML." },
          ].map((s, i) => (
            <Reveal key={i} delay={0.07 * i}>
              <Lantern>
                <div className="mb-3 text-crimson-bright">{s.icon}</div>
                <h3 className="font-heading text-lg text-washi">{s.t}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ash">{s.d}</p>
              </Lantern>
            </Reveal>
          ))}
        </div>
        <Reveal delay={0.2}>
          <div className="mt-12 text-center">
            <a
              href="https://github.com/venomez-viper/Healthcare-Fraud-Analytics"
              target="_blank"
              className="inline-flex items-center gap-2 rounded-sm bg-crimson px-7 py-3 text-sm tracking-wide text-primary-foreground transition hover:bg-crimson-bright"
            >
              <Code2 className="h-4 w-4" /> View the repository
            </a>
          </div>
        </Reveal>
      </Section>
    </main>
  );
}
