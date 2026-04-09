import type { Metadata } from "next";
import CaribbeanRelocationCalculator from "@/components/CaribbeanRelocationCalculator";

export const metadata: Metadata = {
  title: "Caribbean Relocation Calculator | Cost, Taxes, Rent & Budget by Country",
  description:
    "Compare taxes, rent, living costs, and take-home pay across 10 Caribbean destinations. Estimate your moving budget for Barbados, Jamaica, Puerto Rico, Trinidad, and more.",
  alternates: {
    canonical: "https://www.relocationbynumbers.com/caribbean-relocation-calculator",
  },
  openGraph: {
    title: "Caribbean Relocation Calculator | Cost, Taxes, Rent & Budget by Country",
    description:
      "Compare taxes, rent, living costs, and take-home pay across 10 Caribbean destinations. Estimate your moving budget for Barbados, Jamaica, Puerto Rico, Trinidad, and more.",
    url: "https://www.relocationbynumbers.com/caribbean-relocation-calculator",
    siteName: "Relocation by Numbers",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Caribbean Relocation Calculator | Cost, Taxes, Rent & Budget by Country",
    description:
      "Compare taxes, rent, living costs, and take-home pay across 10 Caribbean destinations.",
  },
};

export default function Page() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="py-10 text-center">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">

          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Caribbean Relocation Calculator
          </h1>

          <p className="mt-2 text-xl font-semibold text-slate-700 dark:text-slate-300 sm:text-2xl">
            Compare Cost of Living, Taxes, Rent &amp; Moving Budget by Country
          </p>

          <p className="mx-auto mt-3 max-w-4xl text-sm text-slate-600 dark:text-slate-300 sm:text-base">
            Compare taxes, rent, living costs, take-home pay, and one-time moving expenses
            across Antigua, Bahamas, Barbados, Cayman Islands, Dominican Republic, Jamaica,
            Puerto Rico, Saint Lucia, Trinidad and Tobago, and Turks and Caicos.
          </p>

          <p className="mx-auto mt-2 max-w-3xl text-sm text-slate-500 dark:text-slate-400">
            Use this calculator to pressure-test your budget before relocating to the Caribbean.
          </p>

          <div className="mx-auto mt-6 h-1 w-16 rounded-full bg-teal-600/80" />
        </div>
      </header>

      <section className="mx-auto max-w-5xl space-y-10 px-4 pb-12 sm:px-6">
        <CaribbeanRelocationCalculator />

        {/* FIRE cross-sell */}
        <section className="rounded-2xl border border-emerald-200/60 bg-emerald-50 p-5">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <div className="text-sm font-semibold text-slate-900">
                Thinking Bigger Than Just Moving?
              </div>
              <p className="mt-1 text-sm text-slate-700">
                See how this Caribbean relocation impacts your FIRE timeline.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-4">
                <a
                  href="/fire-calculator"
                  className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  🔥 Calculate My FIRE Timeline
                </a>
                <div className="hidden h-5 w-px bg-emerald-200 sm:block" />
                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                  <a href="/coast-fire-calculator" className="hover:text-slate-900">Coast FIRE</a>
                  <a href="/barista-fire-calculator" className="hover:text-slate-900">Barista FIRE</a>
                  <a href="/lean-fire-calculator" className="hover:text-slate-900">Lean FIRE</a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Explore tools */}
        <section className="rounded-2xl border border-emerald-200/60 bg-emerald-50 p-5">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">
            Explore more relocation planning tools
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Keep comparing your options with more relocation, budgeting, and FIRE tools from Relocation by Numbers.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a href="/explore" className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
              Explore all tools
            </a>
            <a href="/international-relocation" className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              International Calculator
            </a>
            <a href="/europe-relocation-calculator" className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Europe Calculator
            </a>
            <a href="/asia-relocation-calculator" className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Asia Calculator
            </a>
             <a href="/south-america-relocation-calculator" className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              South America Calculator
            </a>
            <a href="/fire-calculator" className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              FIRE Calculator
            </a>
          </div>
        </section>

        {/* What this calculator includes */}
        <section className="rounded-2xl bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800">
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
                What this Caribbean relocation calculator includes
              </h2>
              <div className="mt-4 space-y-3 text-sm sm:text-base text-slate-600 dark:text-slate-300">
                <p>
                  This calculator estimates how a move to the Caribbean may affect your monthly
                  budget — covering income taxes, housing, living costs, and one-time relocation
                  expenses for each supported destination.
                </p>
                <p>
                  Tax models are verified for Antigua and Barbuda, Bahamas, Barbados, Cayman
                  Islands, Dominican Republic, Jamaica, Puerto Rico, Saint Lucia, Trinidad and
                  Tobago, and Turks and Caicos Islands.
                </p>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Income and taxes</div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Estimated take-home pay based on your salary, filing status, and country-specific tax rules.</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Housing and essentials</div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Rent, utilities, groceries, transportation, and healthcare costs for each Caribbean destination.</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Visa and permit costs</div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Estimated visa and permit fees included in your one-time moving budget by country.</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Planning signals</div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Monthly flexibility, comparable salary, savings coverage, and a comfort score to judge whether the move looks realistic.</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-teal-200/70 bg-teal-50 p-5 dark:border-teal-900/60 dark:bg-teal-950/30">
              <div className="text-sm font-semibold text-slate-900 dark:text-white">Good to know before you use it</div>
              <div className="mt-4 space-y-3 text-sm text-slate-700 dark:text-slate-300">
                <p>
                  Results are estimates only. Real taxes, rent, healthcare, immigration rules,
                  and household costs vary by residency status, visa path, and local market
                  conditions.
                </p>
                <p>
                  Several Caribbean destinations offer accessible residency programs for retirees
                  and remote workers. The Bahamas Extended Access Travel Stay, Barbados Welcome
                  Stamp, and Cayman Islands Global Citizen Concierge Program are popular options
                  worth researching alongside your budget.
                </p>
                <p>
                  This tool is most useful for testing scenarios, comparing destinations, and
                  seeing whether your income and savings create enough room to make the move
                  comfortably.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ — helps with long-tail search and structured data */}
        <section className="rounded-2xl bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800">
          <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Frequently asked questions
          </h2>
          <dl className="mt-5 space-y-5 text-sm text-slate-600 dark:text-slate-300">
            <div>
              <dt className="font-semibold text-slate-900 dark:text-white">
                Which Caribbean countries have no income tax?
              </dt>
              <dd className="mt-1">
                Antigua and Barbuda, the Bahamas, the Cayman Islands, and Turks and Caicos
                Islands currently have no personal income tax. This calculator models all four
                as zero-tax destinations for planning purposes.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900 dark:text-white">
                How accurate are the tax estimates?
              </dt>
              <dd className="mt-1">
                Tax figures are based on published resident personal income tax rules for each
                country as of early 2026. They cover regular income tax only — social
                insurance, payroll contributions, and special incentive regimes are not
                included. Always verify with a local tax advisor before making decisions.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900 dark:text-white">
                What is the cost of living in the Caribbean compared to the US?
              </dt>
              <dd className="mt-1">
                It varies significantly by island. The Cayman Islands and Bahamas are
                comparable to or more expensive than major US cities. Dominican Republic,
                Jamaica, and Trinidad and Tobago are generally 20–40% less expensive than
                the US average, depending on lifestyle and location.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900 dark:text-white">
                Can I use this calculator for retirement planning?
              </dt>
              <dd className="mt-1">
                Yes. Enter your expected retirement income, select a destination, and the
                calculator will estimate your monthly budget, tax liability, and how long your
                savings might last. For a full retirement timeline, use the FIRE Calculator.
              </dd>
            </div>
          </dl>
        </section>
      </section>

      <footer className="border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <a href="/about" className="transition hover:text-slate-900 dark:hover:text-white">About</a>
            <span>•</span>
            <a href="/disclaimer" className="transition hover:text-slate-900 dark:hover:text-white">Disclaimer</a>
            <span>•</span>
            <a href="/privacy" className="transition hover:text-slate-900 dark:hover:text-white">Privacy</a>
            <span>•</span>
            <a href="/terms" className="transition hover:text-slate-900 dark:hover:text-white">Terms</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
