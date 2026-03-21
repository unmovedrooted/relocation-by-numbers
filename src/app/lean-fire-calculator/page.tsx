import type { Metadata } from "next";
import Link from "next/link";
import FireCalculator from "@/components/FireCalculator";
import { SEOFAQItem } from "@/components/SeoFAQ";

export const metadata: Metadata = {
  title: "Lean FIRE Calculator – Retire Early on a Lower Budget",
  description:
    "Estimate Lean FIRE: calculate your FIRE number and timeline using a lower spending level. Model taxes, inflation, and investment returns.",
};

export default function Page() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-10">
        <header className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Lean FIRE Calculator
          </h1>

          <p className="leading-relaxed text-slate-300">
            <span className="font-semibold text-white">Lean FIRE</span> is financial independence on a
            smaller spending level. If your expenses are lower, your FIRE number is lower—so you can
            reach FI faster.
          </p>

          <div className="text-xs text-slate-400">
            Assumptions updated: March 2026
          </div>

          <Link
  href="/explore"
  className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
>
  Explore All Tools
</Link>

          <div className="flex flex-wrap gap-2 pt-2">
            <Link
              href="/fire-calculator"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
            >
              FIRE calculator →
            </Link>
            <Link
              href="/"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
            >
              Compare cities →
            </Link>
          </div>
        </header>

        <section aria-label="Lean FIRE calculator">
          <FireCalculator />
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">FAQ</h2>

            <div className="text-xs text-slate-400">
              Assumptions updated: March 2026
            </div>
          </div>

          <div className="grid gap-3">
            <SEOFAQItem
              q="What counts as Lean FIRE?"
              a="There’s no official cutoff, but many people consider Lean FIRE to be a modest annual spending level (often under ~$40k–$50k for an individual)."
            />
            <SEOFAQItem
              q="Is Lean FIRE realistic long-term?"
              a="It can be, but it’s more sensitive to unexpected costs (healthcare, housing, family changes). Many people plan a buffer or use a conservative withdrawal rate."
            />
            <SEOFAQItem
              q="How can moving help Lean FIRE?"
              a="Lower cost-of-living cities can dramatically reduce expenses, which lowers the FIRE number and can shorten the timeline."
            />
          </div>
        </section>

        <footer className="pt-2">
          <div className="mb-3 text-xs text-slate-400">
            Assumptions updated: March 2026
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
            <Link href="/about" className="transition hover:text-white">
              About
            </Link>
            <span>•</span>
            <Link href="/disclaimer" className="transition hover:text-white">
              Disclaimer
            </Link>
            <span>•</span>
            <Link href="/privacy" className="transition hover:text-white">
              Privacy
            </Link>
            <span>•</span>
            <Link href="/terms" className="transition hover:text-white">
              Terms
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}