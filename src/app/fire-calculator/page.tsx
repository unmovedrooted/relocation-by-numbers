import type { Metadata } from "next";
import Link from "next/link";
import AdSlot from "@/components/AdSlot";
import FireCalculator from "@/components/FireCalculator";

export const metadata: Metadata = {
  title: "FIRE Calculator | Years to Financial Independence by Location",
  description:
    "Calculate your FIRE number, years to financial independence, and projected FIRE age. Compare how taxes, spending, and moving cities can change your timeline.",
  alternates: {
    canonical: "https://www.relocationbynumbers.com/fire-calculator",
  },
  openGraph: {
    title: "FIRE Calculator | Years to Financial Independence by Location",
    description:
      "Calculate your FIRE number, years to financial independence, and projected FIRE age. Compare how taxes, spending, and moving cities can change your timeline.",
    url: "https://www.relocationbynumbers.com/fire-calculator",
    siteName: "Relocation by Numbers",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FIRE Calculator | Years to Financial Independence by Location",
    description:
      "Calculate your FIRE number and see how taxes, spending, and moving cities change your path to financial independence.",
  },
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
            <Link href="/about" className="transition hover:text-white">About</Link>
            <span>•</span>
            <Link href="/disclaimer" className="transition hover:text-white">Disclaimer</Link>
            <span>•</span>
            <Link href="/privacy" className="transition hover:text-white">Privacy</Link>
            <span>•</span>
            <Link href="/terms" className="transition hover:text-white">Terms</Link>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            FIRE Calculator — Financial Independence by Location
          </h1>

          <p className="mt-2 text-lg font-semibold text-slate-200">
            Calculate Your FIRE Number, Years to FI, and How Moving Changes Your Timeline
          </p>

          <p className="mt-3 max-w-4xl text-base leading-7 text-slate-300 sm:text-lg">
            Enter your income, spending, and investing assumptions to estimate your FIRE number
            and the age you could reach financial independence. Then compare how moving to a
            lower-cost or lower-tax city could bring that date forward.
          </p>

          <p className="max-w-4xl text-xs leading-6 text-slate-400 sm:text-sm">
            Uses federal tax brackets, FICA, filing status, optional 401(k) contributions,
            and state-specific tax estimates to model after-tax income for planning comparisons.
          </p>

          <p className="max-w-4xl text-xs leading-6 text-slate-500">
            Assumptions updated: March 2026
          </p>

          <div className="pt-1">
            <Link
              href="/methodology"
              className="text-sm font-medium text-emerald-200 underline decoration-emerald-300/40 underline-offset-4 transition hover:text-emerald-100"
            >
              See methodology and data sources
            </Link>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Link href="/lean-fire-calculator" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">Lean FIRE</Link>
            <Link href="/barista-fire-calculator" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">Barista FIRE</Link>
            <Link href="/coast-fire-calculator" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">Coast FIRE</Link>
            <Link href="/compare" className="rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-3 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-400/20">Compare Cities →</Link>
            <Link href="/explore" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">Explore More Tools</Link>
          </div>
        </header>

        <section className="max-w-4xl">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-200">
            How the FIRE calculator works
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-300 sm:text-base">
            Your FIRE number is based on how much you spend each year and your withdrawal rate.
            The most common starting point is the 4% rule: divide your annual expenses by 0.04
            to get the portfolio size you need to retire. At $50,000 per year in expenses, that's
            a $1.25 million target.
          </p>
          <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">
            But where you live also matters. This calculator estimates after-tax income using
            federal tax brackets, FICA, filing status, optional 401(k) contributions, and a
            state-specific tax model. It then adjusts spending by location so you can compare
            how different cities may change your path to FIRE.
          </p>
        </section>

        {/* Component FAQ is kept (no hideFAQ prop) */}
        <FireCalculator />

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-lg font-semibold tracking-tight text-white">
            Explore more FIRE and relocation tools
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
            Compare other FIRE styles, explore city-to-city moves, or browse more tools across the site.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/compare" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10">Relocation Comparisons</Link>
            <Link href="/explore" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10">Explore Hub</Link>
            <Link href="/best-cities-for-fire" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10">Best Cities for FIRE</Link>
            <Link href="/best-states-for-fire" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10">Best States for FIRE</Link>
          </div>
        </section>

        <p className="text-center text-xs text-slate-500">
          Planning estimate only. Not tax, legal, or financial advice.
        </p>

      </div>
    </main>
  );
}
