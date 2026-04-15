import type { Metadata } from "next";
import CaribbeanRelocationCalculator from "@/components/CaribbeanRelocationCalculator";
import Link from "next/link";

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

          <div className="mx-auto mt-4 flex max-w-3xl flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
            <span>Planning estimates only.</span>
            <span className="hidden sm:inline">•</span>
            <span>Results depend on salary, residency path, and housing assumptions.</span>
            <span className="hidden sm:inline">•</span>
            <Link
              href="/methodology"
              className="font-medium text-slate-700 underline underline-offset-4 hover:no-underline dark:text-slate-300"
            >
              See methodology
            </Link>
          </div>

          <p className="mx-auto mt-2 max-w-3xl text-sm text-slate-500 dark:text-slate-400">
            Use this calculator to pressure-test your budget before relocating to the Caribbean.
          </p>

          <div className="mx-auto mt-6 h-1 w-16 rounded-full bg-teal-600/80" />
        </div>
      </header>

      <section className="mx-auto max-w-5xl space-y-10 px-4 pb-12 sm:px-6">
        <CaribbeanRelocationCalculator />

        <div className="text-center text-xs text-slate-500 dark:text-slate-400">
          Assumptions updated: March 2026
        </div>

        <section className="rounded-2xl bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800">
          <div className="max-w-3xl">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white sm:text-xl">
              How this Caribbean relocation calculator works
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
              This calculator is designed to help you test whether a Caribbean move looks
              financially realistic before you commit. It compares destination-country taxes,
              rent, living costs, and one-time relocation expenses so you can estimate how a
              move may change your monthly budget and cash readiness.
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
              Instead of relying on broad lifestyle assumptions alone, the tool focuses on the
              parts of a Caribbean move that usually matter most: take-home pay, housing pressure,
              recurring living costs, visa or permit friction, and whether your savings create
              enough room to make the move comfortably.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
              <h3 className="font-semibold text-slate-900 dark:text-white">Taxes and take-home pay</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Compares country-level tax treatment so you can see what reaches your budget after local tax assumptions are applied.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
              <h3 className="font-semibold text-slate-900 dark:text-white">Housing and essentials</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Estimates rent, utilities, groceries, transport, and healthcare-related costs for supported destinations.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
              <h3 className="font-semibold text-slate-900 dark:text-white">Relocation readiness</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Looks at setup costs, monthly flexibility, and savings coverage so you can judge whether the move looks realistic.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white sm:text-xl">
            What makes Caribbean relocation financially different
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
              <h3 className="font-semibold text-slate-900 dark:text-white">Tax-free does not mean low-cost</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Some Caribbean jurisdictions have no personal income tax, but that does not automatically make them cheap once rent, imported goods, and setup costs are included.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
              <h3 className="font-semibold text-slate-900 dark:text-white">Island costs vary sharply</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                The Caribbean is not one cost profile. Cayman and Bahamas can feel very different from Dominican Republic, Jamaica, or Trinidad and Tobago.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
              <h3 className="font-semibold text-slate-900 dark:text-white">Import-heavy living can raise costs</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Everyday goods, vehicles, and household setup can cost more than expected on some islands because imported items are a major part of local consumption.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
              <h3 className="font-semibold text-slate-900 dark:text-white">Residency path matters</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Budgeting for the move is only part of the decision. Permit rules, residency programs, and eligibility requirements can determine whether a move is practical at all.
              </p>
            </div>
          </div>
        </section>

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
                  Tax models are included for Antigua and Barbuda, Bahamas, Barbados, Cayman
                  Islands, Dominican Republic, Jamaica, Puerto Rico, Saint Lucia, Trinidad and
                  Tobago, and Turks and Caicos Islands.
                </p>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Income and taxes</div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    Estimated take-home pay based on salary and destination-country tax rules.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Housing and essentials</div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    Rent, utilities, groceries, transportation, and healthcare-related cost assumptions.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Visa and permit costs</div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    Estimated visa and permit fees in the one-time moving budget where relevant.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Planning signals</div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    Monthly flexibility, comparable salary, savings coverage, and comfort signals.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-teal-200/70 bg-teal-50 p-5 dark:border-teal-900/60 dark:bg-teal-950/30">
              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                What this tool does not fully model
              </div>
              <div className="mt-4 space-y-3 text-sm text-slate-700 dark:text-slate-300">
                <p>
                  Results are estimates only. Real taxes, rent, healthcare, immigration rules,
                  and household costs vary by residency status, visa path, island, and local market conditions.
                </p>
                <p>
                  This tool does not fully model neighborhood-level housing differences, employer-provided housing,
                  detailed healthcare arrangements, family-specific schooling decisions, or every edge case in local tax and residency law.
                </p>
                <p>
                  It is most useful for testing scenarios, comparing destinations, and seeing whether your income
                  and savings create enough room to make the move comfortably.
                </p>
              </div>
            </div>
          </div>
        </section>

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
                Antigua and Barbuda, the Bahamas, the Cayman Islands, and Turks and Caicos Islands currently have no personal income tax. That can improve take-home pay, but it does not automatically make those destinations low-cost overall.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900 dark:text-white">
                How accurate are the tax estimates?
              </dt>
              <dd className="mt-1">
                Tax figures are based on published resident personal income tax rules for each supported destination as of early 2026. They are planning estimates and should be verified locally before major decisions.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900 dark:text-white">
                What is the cost of living in the Caribbean compared to the US?
              </dt>
              <dd className="mt-1">
                It varies significantly by island. Some destinations can be cheaper than many US cities, while others can match or exceed major US cost levels once housing and imported goods are factored in.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900 dark:text-white">
                Can I use this calculator for retirement planning?
              </dt>
              <dd className="mt-1">
                Yes. You can use it to estimate destination-country budget pressure and moving costs. For long-term retirement timeline planning, pair it with the FIRE calculator.
              </dd>
            </div>
          </dl>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-emerald-200/60 bg-emerald-50 p-5">
            <div className="text-sm font-semibold text-slate-900">
              Thinking bigger than just moving?
            </div>
            <p className="mt-1 text-sm text-slate-700">
              See how relocating to the Caribbean may change your FIRE timeline after taxes, spending, and housing costs.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <a
                href="/fire-calculator"
                className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                🔥 Calculate My FIRE Timeline
              </a>
              <Link
                href="/best-cities-for-fire"
                className="text-sm font-semibold text-slate-700 underline underline-offset-4 hover:no-underline"
              >
                Best cities for FIRE
              </Link>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">
              Explore more relocation planning tools
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Keep comparing your options with more relocation, budgeting, and FIRE tools from Relocation by Numbers.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href="/explore"
                className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Explore all tools
              </a>
              <a
                href="/international-relocation"
                className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                International Calculator
              </a>
              <a
                href="/europe-relocation-calculator"
                className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Europe Calculator
              </a>
              <a
                href="/asia-relocation-calculator"
                className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Asia Calculator
              </a>
              <a
                href="/south-america-relocation-calculator"
                className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                South America Calculator
              </a>
            </div>
          </section>
        </div>
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
            <span>•</span>
            <a href="/methodology" className="transition hover:text-slate-900 dark:hover:text-white">Methodology</a>
          </div>
        </div>
      </footer>
    </main>
  );
}