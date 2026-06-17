"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Code2 } from "lucide-react";
import { Seal } from "@/components/primitives";
import { Torii } from "@/components/scenery";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/solution", label: "Solution" },
  { href: "/methodology", label: "Methodology" },
  { href: "/about", label: "About" },
];

export function SiteNav() {
  const path = usePathname();
  return (
    <nav className="sticky top-0 z-40 flex items-center justify-between border-b border-border/60 bg-ink/70 px-6 py-4 backdrop-blur-md">
      <Link href="/" className="flex items-center gap-3">
        <Seal kanji="監" className="h-8 w-8" />
        <span className="font-heading text-sm tracking-[0.25em] text-washi/90">
          FRAUD RISK EXPLORER
        </span>
      </Link>
      <div className="flex items-center gap-6">
        <div className="hidden gap-6 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={
                "text-xs tracking-[0.2em] transition hover:text-gold " +
                (path === n.href ? "text-gold" : "text-ash")
              }
            >
              {n.label.toUpperCase()}
            </Link>
          ))}
        </div>
        <a
          href="https://github.com/venomez-viper/Healthcare-Fraud-Analytics"
          target="_blank"
          className="flex items-center gap-2 text-xs tracking-widest text-ash transition hover:text-gold"
        >
          <Code2 className="h-4 w-4" /> <span className="hidden sm:inline">REPO</span>
        </a>
      </div>
    </nav>
  );
}

export function SiteFooter() {
  return (
    <footer className="relative border-t border-border/60 px-6 py-12 text-center">
      <Torii className="mx-auto mb-5 h-10 w-12 text-crimson/70" />
      <Seal kanji="監" className="mx-auto mb-4" />
      <p className="font-heading text-sm tracking-[0.25em] text-washi/80">
        PROVIDER FRAUD RISK EXPLORER
      </p>
      <div className="mt-4 flex justify-center gap-5 text-[11px] tracking-[0.2em] text-ash">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} className="transition hover:text-gold">
            {n.label.toUpperCase()}
          </Link>
        ))}
      </div>
      <p className="mt-5 text-xs text-ash/80">
        Built by Akash and Shruti Pingle · Real CMS + LEIE data · Not for clinical or
        enforcement use
      </p>
    </footer>
  );
}

/** Compact header for inner pages: kanji accent + mincho title + lead. */
export function PageHeader({
  kanji,
  eyebrow,
  title,
  lead,
}: {
  kanji: string;
  eyebrow: string;
  title: string;
  lead: string;
}) {
  return (
    <header className="relative overflow-hidden px-6 pb-10 pt-24 text-center">
      <div
        aria-hidden
        className="sun-pulse absolute left-1/2 top-0 -z-[1] h-72 w-72 -translate-x-1/2 -translate-y-1/3 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(177,39,31,0.6) 0%, rgba(177,39,31,0.15) 45%, transparent 70%)",
          filter: "blur(4px)",
        }}
      />
      <div className="pointer-events-none absolute right-8 top-16 hidden select-none font-heading text-7xl text-washi/10 md:block vertical-jp">
        {kanji}
      </div>
      <p className="mb-4 text-[11px] tracking-[0.35em] text-gold">{eyebrow}</p>
      <h1 className="mx-auto max-w-3xl font-heading text-4xl font-extrabold leading-tight text-washi md:text-6xl">
        {title}
      </h1>
      <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-ash md:text-lg">
        {lead}
      </p>
    </header>
  );
}

export function Section({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="mx-auto max-w-5xl px-6 py-20 text-center">
      {children}
    </section>
  );
}

export function Kicker({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold/25 bg-sumi/60 px-4 py-1.5 text-[11px] tracking-[0.3em] text-gold">
      {icon}
      {children}
    </div>
  );
}

export function Lantern({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  }
  return (
    <div
      onMouseMove={onMove}
      className={
        "spotlight-card paper-grain rounded-md border border-border bg-sumi/70 p-7 text-left transition duration-300 hover:-translate-y-1 hover:border-gold/40 " +
        (className ?? "")
      }
    >
      {children}
    </div>
  );
}
