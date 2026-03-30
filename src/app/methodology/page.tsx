import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Methodology & Data Sources | Relocation by Numbers",
  description:
    "Learn how Relocation by Numbers estimates taxes, housing, cost of living, affordability, and FIRE timelines across cities and states.",
};

export default function MethodologyPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-10">
        <header className="space-y-4">
          <div className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
            Methodology
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            How Relocation by Numbers Works
          </h1>

          <p className="max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
            Relocation by Numbers is built to help you compare how taxes, housing,
            cost of living, and location-based spending can affect affordability
            and financial independence planning before you move.
          </p>

          <p className="text-sm text-slate-500">
            Assumptions updated: March 2026
          </p>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            What these tools are designed to do
          </h2>

          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600 sm:text-base">
            <p>
              These calculators are designed for planning comparisons. They help
              you estimate how a move could change take-home pay, monthly housing
              pressure, cost of living, and long-term FIRE timelines across
              different cities and states.
            </p>

            <p>
              The goal is not to replace a tax professional, lender, financial
              planner, or legal advisor. The goal is to give you a clearer way to
              compare real-world tradeoffs before making a move.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            Tax estimates
          </h2>

          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600 sm:text-base">
            <p>
              Relocation by Numbers estimates after-tax income using a simplified
              planning model that includes federal income tax, FICA payroll taxes,
              filing status, optional 401(k) contributions, and state-level income
              tax assumptions where applicable.
            </p>

            <p>
              State tax handling varies by state. Some states have no state income
              tax, some use a flat rate, and some use simplified bracket-based
              estimates. These estimates are meant to help compare locations, not
              produce a tax filing result.
            </p>

            <p>
              Tax calculations do not attempt to fully model every real-world tax
              variable. For example, these tools may not fully account for itemized
              deductions, tax credits, local taxes, HSA treatment, self-employment
              rules, investment income treatment, or special filing situations.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            Housing and affordability estimates
          </h2>

          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600 sm:text-base">
            <p>
              Housing estimates are one of the biggest parts of the model because
              housing is often the largest moving-related expense. Depending on the
              calculator, users can compare renting or buying and estimate how much
              of their take-home pay may go toward housing.
            </p>

            <p>
              Buy-mode estimates may include mortgage principal and interest,
              property taxes, homeowners insurance, HOA costs, and PMI when down
              payment assumptions suggest PMI may apply. Rent-mode estimates may
              include monthly rent and renter-related housing costs where relevant.
            </p>

            <p>
              These housing calculations are intended for comparison planning and
              do not represent a mortgage approval, underwriting decision, or final
              lender quote.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            Cost of living assumptions
          </h2>

          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600 sm:text-base">
            <p>
              Cost-of-living comparisons are based on location-specific assumptions
              for categories such as housing, groceries, utilities, transportation,
              healthcare, and other recurring living expenses when available.
            </p>

            <p>
              In some parts of the site, weighted category comparisons are used so
              the model reflects the fact that housing usually has a larger impact
              than smaller monthly categories. In cases where a full category-level
              model is not available, the tool may rely more heavily on broader
              cost-of-living or rent-based comparison logic.
            </p>

            <p>
              These estimates should be treated as directional planning inputs.
              Actual living costs depend on neighborhood, household size, commute,
              lifestyle, insurance choices, and personal spending habits.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            FIRE calculations
          </h2>

          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600 sm:text-base">
            <p>
              FIRE estimates are based on a simple planning framework: annual
              spending, withdrawal rate, after-tax income, savings assumptions, and
              investment growth assumptions over time.
            </p>

            <p>
              The FIRE number is generally estimated from annual spending divided by
              the selected withdrawal rate. The timeline to financial independence
              depends on current portfolio value, contributions, growth assumptions,
              inflation assumptions, and location-adjusted spending.
            </p>

            <p>
              Location matters because taxes and spending can both change when you
              move. A lower-tax state or lower-cost city may reduce the amount of
              income needed to support your target lifestyle and may shorten the
              timeline to financial independence. A higher-cost move may do the
              opposite.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            What is estimated versus exact
          </h2>

          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600 sm:text-base">
            <p>
              These tools are designed to estimate and compare. They are strongest
              when used to answer questions like:
            </p>

            <ul className="list-disc space-y-2 pl-5">
              <li>How might my take-home pay change if I move?</li>
              <li>How much housing pressure could I take on in another city?</li>
              <li>Would a lower-cost move help my FIRE timeline?</li>
              <li>How much salary might feel equivalent after taxes and housing?</li>
            </ul>

            <p>
              They are not designed to replace exact tax prep, final mortgage
              pricing, legal guidance, or personalized financial planning.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            Data sources and updates
          </h2>

          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600 sm:text-base">
            <p>
              Relocation by Numbers uses a mix of public assumptions, internal
              calculation logic, and location-based cost modeling to support
              comparison tools across the site. Some pages may also use
              location-specific defaults, rent assumptions, tax parameters, or
              affordability heuristics to improve planning usefulness.
            </p>

            <p>
              Because taxes, housing markets, and living costs change over time,
              assumptions may be revised as models improve or newer data becomes
              available.
            </p>

            <p>
              The site may continue expanding its methodology disclosures over time
              as more calculators, international tools, and comparison pages are
              added.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            Important disclaimer
          </h2>

          <p className="mt-4 text-sm leading-7 text-slate-700 sm:text-base">
            Relocation by Numbers provides planning estimates only. Nothing on this
            site should be considered tax, legal, mortgage, or financial advice.
            Always verify major financial decisions with qualified professionals and
            current source documents.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            Explore the tools
          </h2>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-100"
            >
              Homepage
            </Link>
            <Link
              href="/explore"
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-100"
            >
              Explore
            </Link>
            <Link
              href="/compare"
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-100"
            >
              Compare Cities
            </Link>
            <Link
              href="/fire-calculator"
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-100"
            >
              FIRE Calculator
            </Link>
            <Link
              href="/international-relocation"
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-100"
            >
              International Relocation
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}