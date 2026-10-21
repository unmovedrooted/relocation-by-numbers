import type { Metadata } from "next";
import FireHeaderLinks from "@/components/FireHeaderLinks";
import Link from "next/link";
import AdSlot from "@/components/AdSlot";
import FireCalculator from "@/components/FireCalculator";
import CalculatorSources from "@/components/CalculatorSources";
import { parseIncomeParam } from "@/lib/incomeParam";

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

type PageProps = { searchParams: Promise<{ income?: string }> };

export default async function FireCalculatorPage({ searchParams }: PageProps) {
  const { income } = await searchParams;
  const initialIncome = parseIncomeParam(income);
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        <header className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            FIRE Calculator
          </div>


          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            FIRE Calculator, Financial Independence by Location
          </h1>

          <p className="mt-2 text-lg font-semibold text-slate-200">
            Calculate Your FIRE Number, Years to FI, and How Moving Changes Your Timeline
          </p>

          <p className="max-w-4xl text-base leading-7 text-slate-300">
            Enter your income, spending and savings to see your FIRE number and age, then compare how a move could change them.
          </p>

          <p className="max-w-4xl text-xs leading-6 text-slate-400">
            Assumptions updated: October 2026. How taxes are modeled is explained below the calculator.
          </p>

          <FireHeaderLinks current="fire" mode="standard" />
        </header>

        {process.env.NEXT_PUBLIC_ADSENSE_SLOT_TOP ? (
          <section className="">
            
          </section>
        ) : null}

        <FireCalculator initialIncome={initialIncome} />

        <section className="max-w-4xl rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold text-white">
            How the FIRE calculator works
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-300 sm:text-base">
            Your FIRE number is based on how much you spend each year and your withdrawal rate.
            The most common starting point is the 4% rule: divide your annual expenses by 0.04
            to estimate the portfolio size needed to support that spending.
          </p>
          <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">
            But location changes the math. This calculator estimates after-tax income using
            federal tax brackets, FICA, filing status, optional 401(k) contributions, and
            a state-specific tax model. It then compares how different spending and location
            assumptions may affect your timeline to financial independence.
          </p>
        </section>

        {process.env.NEXT_PUBLIC_ADSENSE_SLOT_MID ? (
          <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <AdSlot
              slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_MID}
              className="min-h-[100px]"
            />
          </section>
        ) : null}

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold text-white">
            What changes your FIRE timeline most
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h3 className="font-semibold text-white">Annual spending</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Spending is the core driver of your FIRE number. Lower spending reduces the portfolio size you need.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h3 className="font-semibold text-white">Savings rate</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                The more you can invest each year, the faster your portfolio compounds toward financial independence.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h3 className="font-semibold text-white">Investment return assumptions</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Growth assumptions matter, but they should be treated as planning estimates, not promises.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h3 className="font-semibold text-white">Location</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Moving to a lower-cost or lower-tax location can reduce both your FIRE number and your years to FI.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold text-white">
            Who this calculator is best for
          </h2>
          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-300">
            <p>
              This calculator is most useful for people who want to understand how income,
              spending, investing, and location work together in a financial independence plan.
            </p>
            <p>
              It is especially useful if you are comparing cities, trying to lower expenses,
              or testing whether a move could bring your FIRE date closer.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold text-white">
            What this calculator includes, and what it does not
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4">
              <h3 className="font-semibold text-white">Included</h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-300">
                <li>FIRE number estimate</li>
                <li>Years to financial independence</li>
                <li>Projected FIRE age</li>
                <li>Location-based tax and spending comparison</li>
              </ul>
            </div>

            <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-4">
              <h3 className="font-semibold text-white">Not fully modeled</h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-300">
                <li>Every tax edge case or deduction</li>
                <li>Sequence-of-returns risk in full detail</li>
                <li>All future spending changes with precision</li>
                <li>Investment outcomes with certainty</li>
              </ul>
            </div>
          </div>

          <p className="mt-4 text-sm leading-7 text-slate-300">
            This is a planning tool, not a guaranteed forecast. It is most useful for
            comparing scenarios and understanding directionally how your choices change the math.
          </p>
        </section>

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

        <p className="text-center text-xs text-slate-400">
          Planning estimate only. Not tax, legal, or financial advice.
        </p>
      </div>
    <CalculatorSources path="/fire-calculator" tone="dark" />
    </main>
  );
}