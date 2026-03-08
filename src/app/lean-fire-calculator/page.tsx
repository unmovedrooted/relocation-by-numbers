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
          <p className="text-slate-300 leading-relaxed">
            <span className="font-semibold text-white">Lean FIRE</span> is financial independence on a
            smaller spending level. If your expenses are lower, your FIRE number is lower—so you can
            reach FI faster.
          </p>

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
          <h2 className="text-xl font-semibold">FAQ</h2>
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
      </div>
    </main>
  );
}