import type { Metadata } from "next";
import FireCalculator from "@/components/FireCalculator";

export const metadata: Metadata = {
  title: "FIRE Calculator by Location | Compare Taxes, Spending, and FIRE Timeline",
  description:
    "Compare how taxes, spending, and moving cities can change your FIRE number, years to financial independence, and projected FIRE age.",
};

export default function FireCalculatorPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-4 py-10 space-y-8">
        <header className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            FIRE Calculator
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
            <a href="/about" className="transition hover:text-white">
              About
            </a>
            <span>•</span>
            <a href="/disclaimer" className="transition hover:text-white">
              Disclaimer
            </a>
            <span>•</span>
            <a href="/privacy" className="transition hover:text-white">
              Privacy
            </a>
            <span>•</span>
            <a href="/terms" className="transition hover:text-white">
              Terms
            </a>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            See how taxes, expenses, and moving cities change your FIRE date
          </h1>

          <p className="mt-3 max-w-4xl text-base leading-7 text-slate-300 sm:text-lg">
            Compare how location changes your FIRE timeline.
          </p>

          <p className="max-w-4xl text-xs leading-6 text-slate-400 sm:text-sm">
            Uses federal tax brackets, FICA, filing status, optional 401(k)
            contributions, and state-specific tax estimates to model after-tax
            income for planning comparisons.
          </p>

          <p className="max-w-4xl text-xs leading-6 text-slate-500">
  Assumptions updated: March 2026
</p>

          <div className="flex flex-wrap gap-2 pt-2">
            <a
              href="/lean-fire-calculator"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
            >
              Lean FIRE
            </a>

            <a
              href="/barista-fire-calculator"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
            >
              Barista FIRE
            </a>

            <a
              href="/coast-fire-calculator"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
            >
              Coast FIRE
            </a>

            <a
              href="/"
              className="rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-3 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-400/20"
            >
              Compare Cities →
            </a>
          </div>
        </header>

        <FireCalculator />

        <section className="max-w-4xl">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-200">
            How the model works
          </h2>

          <p className="mt-3 text-sm leading-7 text-slate-300 sm:text-base">
            Your FIRE target is based on how much you spend each year and your
            withdrawal rate. But where you live also matters.
          </p>

          <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">
            This calculator estimates after-tax income using federal tax
            brackets, FICA, filing status, optional 401(k) contributions, and a
            simplified state-specific tax model. It also adjusts spending by
            location so you can compare how different cities may change your
            path to FIRE.
          </p>
        </section>

        <p className="text-center text-xs text-slate-500">
          Planning estimate only. Not tax, legal, or financial advice.
        </p>
      </div>
    </main>
  );
}