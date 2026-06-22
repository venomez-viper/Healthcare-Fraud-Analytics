"use client";

import { Database, Tags, Layers, Cpu, Target, Ghost } from "lucide-react";
import { Reveal } from "@/components/primitives";
import { BrushDivider } from "@/components/scenery";
import { PageHeader, Section, Kicker, Lantern } from "@/components/blocks";

export default function MethodologyPage() {
  return (
    <main className="font-sans">
      <PageHeader
        kanji="法"
        eyebrow="METHODOLOGY"
        title="From raw Medicare billing to a defensible ranking."
        lead="Real government data, peer-relative features, and a learning setup that respects the fact that most fraud is never caught. Every choice is grounded in published research."
      />

      <Section>
        <div className="grid gap-5 md:grid-cols-2">
          {[
            { icon: <Database className="h-6 w-6" />, t: "1. Data", d: "CMS Medicare Part B 'by Provider' (2019 to 2023) joined to the OIG LEIE exclusion list on NPI. Pooled into a 6.0M provider-year panel with 473 known fraud providers." },
            { icon: <Tags className="h-6 w-6" />, t: "2. Labels", d: "A provider-year is labelled fraud if the NPI appears in the LEIE for a fraud-related exclusion, with temporal gating so we capture pre-exclusion billing." },
            { icon: <Layers className="h-6 w-6" />, t: "3. Features", d: "Absolute behaviour ratios plus peer-relative position: z-score, percentile, and median ratio within each specialty-and-year peer group. The peer layer is what makes it work." },
            { icon: <Cpu className="h-6 w-6" />, t: "4. Models", d: "Fit with BreezeML: logistic regression, gradient boosting, and XGBoost, with random undersampling to handle the extreme imbalance." },
            { icon: <Target className="h-6 w-6" />, t: "5. Evaluation", d: "Provider-grouped train/test split (no NPI on both sides). Headline metric is precision at top-k, the metric that matches the real decision." },
            { icon: <Ghost className="h-6 w-6" />, t: "6. PU learning", d: "We treat unlabelled providers as unknown, not innocent, and use PU bagging. Against a matched baseline it wins 4 of 5 random splits, a consistent lift in top-k recall." },
          ].map((s, i) => (
            <Reveal key={i} delay={0.06 * i}>
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
          <Kicker>RESULTS</Kicker>
          <h2 className="section-title">Benchmarked, honest numbers.</h2>
        </Reveal>
        <Reveal delay={0.1}>
          <Lantern className="mt-10 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-ash">
                  <th className="py-3 pr-4 font-medium">Model</th>
                  <th className="py-3 pr-4 font-medium">ROC-AUC</th>
                  <th className="py-3 pr-4 font-medium">Top 10% caught</th>
                </tr>
              </thead>
              <tbody className="text-washi/90">
                {[
                  ["Logistic Regression (scaled)", "0.747", "43.2%"],
                  ["Gradient Boosting", "0.809", "55.6%"],
                  ["XGBoost", "0.767", "45.6%"],
                  ["PU bagging + billing trajectory", "0.859", "60.9%"],
                ].map((r, i) => (
                  <tr key={i} className="border-b border-border/40 last:border-0">
                    <td className="py-3 pr-4">{r[0]}</td>
                    <td className="py-3 pr-4 text-gold">{r[1]}</td>
                    <td className="py-3 pr-4">{r[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Lantern>
        </Reveal>
        <Reveal delay={0.15}>
          <p className="section-lead">
            Gradient boosting matches the published Part B benchmark (Herland,
            Khoshgoftaar and Bauder, 2018: 0.805 to 0.816). Reframing the problem as
            Positive-Unlabeled (PU bagging) beats a matched baseline on the mean of
            every metric across five random splits. The biggest gain comes from
            leakage-safe billing-trajectory features (a provider&apos;s own as-of trend,
            swing, and jump): they lift top-1% recall from about 17 to 29 percent and
            ROC-AUC to 0.86, audited to rule out panel-position leakage. Absolute
            precision is low by design: at 0.022 percent prevalence with incomplete
            labels, ROC-AUC and top-k recall are the trustworthy signals.
          </p>
        </Reveal>
      </Section>
    </main>
  );
}
