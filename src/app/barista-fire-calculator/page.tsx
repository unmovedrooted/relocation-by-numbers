import type { Metadata } from "next";
import Link from "next/link";
import FireCalculator from "@/components/FireCalculator";
import { SEOFAQItem } from "@/components/SeoFAQ";

export const metadata: Metadata = {
  title: "Barista FIRE Calculator – Partial Retirement and Part-Time Income",
  description:
    "Estimate Barista FIRE: when part-time income covers some expenses and your portfolio covers the rest. Model your FIRE number and timeline.",
};

export default function Page() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-10">
        <header className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Barista FIRE Calculator
          </h1>

          <p className="leading-relaxed text-slate-300">
            <span className="font-semibold text-white">Barista FIRE</span> is a middle ground:
            you “retire” from full-time work but still earn part-time income to cover some expenses.
            Tonight we’ll use the main calculator as the engine; next we can add a Barista input for
            part-time income that reduces the portfolio needed.
          </p>

          <div className="text-xs text-slate-400">
            Assumptions updated: March 2026
          </div>

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

        <section aria-label="Barista FIRE calculator">
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
              q="What is Barista FIRE?"
              a="Barista FIRE is partial retirement: you rely on investments plus part-time income (and sometimes benefits) instead of fully living off a portfolio."
            />
            <SEOFAQItem
              q="How do I approximate Barista FIRE with this calculator?"
              a="Reduce your monthly expenses by the amount you expect to cover with part-time income. Example: $60k expenses and $25k part-time income → model $35k of expenses."
            />
            <SEOFAQItem
              q="Why is Barista FIRE popular?"
              a="It can reduce the portfolio required and give flexibility—especially in high cost-of-living areas where full FIRE may take longer."
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