import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Methodology & Data Sources | Relocation by Numbers",
  description:
    "Learn how Relocation by Numbers estimates taxes, housing, cost of living, affordability, relocation budgets, and FIRE timelines across cities, states, and international destinations.",
};

export default function MethodologyPage() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="mx-auto max-w-5xl space-y-10 px-4 py-10">
        <header className="space-y-4">
          <div className="inline-flex items-center rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600 dark:text-slate-400">
            Methodology
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            How Relocation by Numbers Works
          </h1>

          <p className="max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-400 sm:text-lg">
            Relocation by Numbers is built to help users compare how taxes, housing,
            cost of living, and location-based spending may affect affordability,
            relocation decisions, and financial independence planning before they move.
          </p>

          <p className="max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            The tools on this site are designed for planning and comparison. They are
            intended to help users understand direction and tradeoffs, not replace tax
            filing software, lender underwriting, legal advice, or personalized financial advice.
          </p>

          <p className="text-sm text-slate-500 dark:text-slate-400">
            Assumptions updated: March 2026
          </p>
        </header>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            What these tools are designed to do
          </h2>

          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600 dark:text-slate-400 sm:text-base">
            <p>
              These calculators are built to compare how a move could change take-home pay,
              monthly housing pressure, cost of living, relocation readiness, and long-term
              FIRE timelines across different cities, states, and international destinations.
            </p>

            <p>
              The goal is to help answer practical planning questions such as:
            </p>

            <ul className="list-disc space-y-2 pl-5">
              <li>How might my monthly budget change if I move?</li>
              <li>How much salary would feel equivalent in another location?</li>
              <li>Would a lower-cost move improve my monthly flexibility?</li>
              <li>How might relocation change my FIRE timeline?</li>
              <li>How much cash do I likely need before an international move?</li>
            </ul>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            How the core model works
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">1. Income input</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                The model starts with user inputs such as salary, filing status,
                household assumptions, savings, and housing choices where relevant.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">2. Tax estimate</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                Federal, payroll, state, or country-level tax assumptions are applied
                to estimate after-tax income for planning comparison purposes.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">3. Cost adjustment</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                Housing and other recurring cost assumptions are applied so the tool
                can estimate budget pressure in the origin and destination.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">4. Planning output</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                The result is a comparison view showing tradeoffs such as affordability,
                comparable salary, monthly flexibility, or FIRE impact.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Tax estimates
          </h2>

          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600 dark:text-slate-400 sm:text-base">
            <p>
              Relocation by Numbers estimates after-tax income using a simplified
              planning model that may include federal income tax, FICA payroll taxes,
              filing status, optional retirement contributions, and state-level or
              country-level income tax assumptions where applicable.
            </p>

            <p>
              Tax handling varies by jurisdiction. Some states or countries have no
              income tax, some use flat-rate logic, and others use simplified bracket-based
              estimates. These calculations are designed to support comparison, not to
              produce a filing-ready tax result.
            </p>

            <p>
              Tax calculations do not attempt to fully model every real-world variable.
              Depending on the tool, they may not fully account for itemized deductions,
              credits, local taxes, self-employment rules, investment income treatment,
              treaty treatment, residency edge cases, or unusual filing situations.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Housing and affordability estimates
          </h2>

          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600 dark:text-slate-400 sm:text-base">
            <p>
              Housing estimates are one of the largest parts of the model because housing
              is often the biggest recurring expense in a move. Depending on the calculator,
              users may compare renting or buying and estimate how much of their take-home
              pay may go toward housing.
            </p>

            <p>
              Buy-mode estimates may include mortgage principal and interest, property taxes,
              homeowners insurance, HOA costs, and PMI when down payment assumptions suggest
              PMI may apply. Rent-mode estimates may include monthly rent and renter-related
              housing costs where relevant.
            </p>

            <p>
              These housing calculations are designed for planning comparison only and do not
              represent a mortgage approval, underwriting decision, or final lender quote.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Cost of living assumptions
          </h2>

          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600 dark:text-slate-400 sm:text-base">
            <p>
              Cost-of-living comparisons use location-specific assumptions for categories
              such as housing, groceries, utilities, transportation, healthcare, and
              other recurring living expenses when those inputs are available in the model.
            </p>

            <p>
              In some parts of the site, weighted category comparisons are used so the
              model reflects the fact that housing usually matters more than smaller
              spending categories. In other parts of the site, the comparison may rely
              more heavily on rent-based logic, city-level defaults, or broader affordability
              heuristics when a full category-level model is not available.
            </p>

            <p>
              These estimates should be treated as directional planning inputs. Actual
              living costs vary by neighborhood, household size, commute, lifestyle,
              insurance choices, and personal spending habits.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            International relocation estimates
          </h2>

          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600 dark:text-slate-400 sm:text-base">
            <p>
              International tools add another layer beyond domestic relocation because
              visa path, residency status, one-time setup costs, and country-specific
              tax treatment often matter as much as monthly living costs.
            </p>

            <p>
              Depending on the destination and tool, international relocation estimates
              may include destination-city rent and essentials, one-time moving costs,
              visa or permit fee assumptions, healthcare-related costs, and country-level
              tax treatment for planning purposes.
            </p>

            <p>
              These tools do not fully model every immigration path, residency rule,
              employer sponsorship structure, treaty rule, or local legal edge case.
              They are intended to help users compare scenarios before pursuing official
              visa or tax guidance.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            FIRE calculations
          </h2>

          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600 dark:text-slate-400 sm:text-base">
            <p>
              FIRE estimates are based on a planning framework that may include annual
              spending, withdrawal rate, after-tax income, savings assumptions, investment
              growth assumptions, inflation assumptions, and current portfolio values.
            </p>

            <p>
              The FIRE number is generally estimated from annual spending divided by the
              selected withdrawal rate. The timeline to financial independence depends on
              contributions, current assets, growth assumptions, inflation assumptions,
              and location-adjusted spending.
            </p>

            <p>
              Location matters because taxes and spending can both change when you move.
              A lower-tax state or lower-cost city may reduce the income needed to support
              your target lifestyle and may shorten the path to financial independence.
              A higher-cost move may do the opposite.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Exact inputs, modeled estimates, and heuristics
          </h2>

          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600 dark:text-slate-400 sm:text-base">
            <p>
              Not every number on the site is the same kind of input. In general, the
              models rely on three different layers:
            </p>

            <ul className="list-disc space-y-2 pl-5">
              <li>
                <span className="font-medium text-slate-900 dark:text-slate-100">Rule-based inputs:</span> examples include
                tax brackets, filing status logic, and structured formula-based calculations.
              </li>
              <li>
                <span className="font-medium text-slate-900 dark:text-slate-100">Modeled estimates:</span> examples include
                housing assumptions, monthly essentials, and affordability comparisons built from location data.
              </li>
              <li>
                <span className="font-medium text-slate-900 dark:text-slate-100">Comparison heuristics:</span> examples include
                weighted affordability logic, comfort signals, and scenario-planning shortcuts used to keep the tools practical.
              </li>
            </ul>

            <p>
              That distinction matters because some outputs are closer to structured formula results,
              while others are best treated as directional planning estimates rather than exact figures.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Data sources and updates
          </h2>

          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600 dark:text-slate-400 sm:text-base">
            <p>
              Relocation by Numbers uses a combination of public tax parameters, housing and
              cost assumptions, internally maintained location data, and comparison logic built
              for planning usefulness across the site.
            </p>

            <p>
              Depending on the calculator, inputs may come from structured tax assumptions,
              city or state cost defaults, rent and housing parameters, relocation cost estimates,
              and internal modeling designed to compare locations on a consistent basis.
            </p>

            <p>
              Because taxes, housing markets, living costs, and international rules change over time,
              assumptions may be revised as models improve or newer data becomes available.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-6">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Important disclaimer
          </h2>

          <p className="mt-4 text-sm leading-7 text-slate-700 dark:text-slate-300 sm:text-base">
            Relocation by Numbers provides planning estimates only. Nothing on this site should
            be considered tax, legal, mortgage, investment, or financial advice. Always verify
            major financial or relocation decisions with qualified professionals and current source documents.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Explore the tools
          </h2>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2 text-sm font-medium text-slate-800 dark:text-slate-200 transition hover:bg-slate-100 hover:dark:bg-slate-900/40"
            >
              Homepage
            </Link>
            <Link
              href="/explore"
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2 text-sm font-medium text-slate-800 dark:text-slate-200 transition hover:bg-slate-100 hover:dark:bg-slate-900/40"
            >
              Explore
            </Link>
            <Link
              href="/compare"
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2 text-sm font-medium text-slate-800 dark:text-slate-200 transition hover:bg-slate-100 hover:dark:bg-slate-900/40"
            >
              Compare Cities
            </Link>
            <Link
              href="/fire-calculator"
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2 text-sm font-medium text-slate-800 dark:text-slate-200 transition hover:bg-slate-100 hover:dark:bg-slate-900/40"
            >
              FIRE Calculator
            </Link>
            <Link
              href="/international-relocation"
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2 text-sm font-medium text-slate-800 dark:text-slate-200 transition hover:bg-slate-100 hover:dark:bg-slate-900/40"
            >
              International Relocation
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}