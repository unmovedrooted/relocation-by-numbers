import type { Metadata } from "next";
import Link from "next/link";
import AdSlot from "@/components/AdSlot";
import SouthAmericaRelocationCalculator from "@/components/SouthAmericaRelocationCalculator";

export const metadata: Metadata = {
  title: "South America Relocation Calculator | Cost of Living, Taxes & Budget by City",
  description:
    "Compare taxes, rent, living costs, and take-home pay across major South American cities. Estimate your moving budget for Medellín, Bogotá, Buenos Aires, Santiago, Lima, and São Paulo.",
  alternates: {
    canonical: "https://www.relocationbynumbers.com/south-america-relocation-calculator",
  },
  openGraph: {
    title: "South America Relocation Calculator | Cost of Living, Taxes & Budget by City",
    description:
      "Compare taxes, rent, living costs, and take-home pay across major South American cities. Estimate your moving budget for Medellín, Bogotá, Buenos Aires, Santiago, Lima, and São Paulo.",
    url: "https://www.relocationbynumbers.com/south-america-relocation-calculator",
    siteName: "Relocation by Numbers",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "South America Relocation Calculator | Cost of Living, Taxes & Budget by City",
    description:
      "Compare taxes, rent, living costs, and take-home pay across major South American cities.",
  },
};

export default function Page() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900 dark:from-slate-950 dark:to-slate-900 dark:text-slate-100">
      <header className="py-10 text-center">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            South America Relocation Calculator
          </h1>

          <p className="mt-2 text-xl font-semibold text-slate-700 dark:text-slate-300 sm:text-2xl">
            Compare Cost of Living, Taxes, Rent &amp; Moving Budget by City
          </p>

          <p className="mx-auto mt-3 max-w-4xl text-sm text-slate-600 dark:text-slate-300 sm:text-base">
            Compare taxes, rent, living costs, take-home pay, and one-time moving expenses
            across major South American cities.
          </p>

          <div className="mx-auto mt-4 flex max-w-3xl flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
            <span>Planning estimates only.</span>
            <span className="hidden sm:inline">•</span>
            <span>Results depend on salary, residency path, exchange-rate assumptions, and housing choices.</span>
            <span className="hidden sm:inline">•</span>
            <Link
              href="/methodology"
              className="font-medium text-slate-700 underline underline-offset-4 hover:no-underline dark:text-slate-300"
            >
              See methodology
            </Link>
          </div>

          <p className="mx-auto mt-2 max-w-3xl text-sm text-slate-500 dark:text-slate-400">
            Use this calculator to pressure-test your budget before relocating to South America.
          </p>

          <div className="mx-auto mt-6 h-1 w-16 rounded-full bg-amber-600/80" />
        </div>
      </header>

      <section className="mx-auto max-w-5xl space-y-10 px-4 pb-12 sm:px-6">
        {process.env.NEXT_PUBLIC_ADSENSE_SLOT_TOP ? (
          <section className="">
            
          
          </section>
        ) : null}

        <SouthAmericaRelocationCalculator />

        {process.env.NEXT_PUBLIC_ADSENSE_SLOT_MID ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <AdSlot
              slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_MID}
              className="min-h-[100px]"
            />
          </section>
        ) : null}

        <div className="text-center text-xs text-slate-500 dark:text-slate-400">
          Assumptions updated: March 2026
        </div>

        <section className="rounded-2xl bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800">
          <div className="max-w-3xl">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white sm:text-xl">
              How this South America relocation calculator works
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
              This calculator is designed to help you test whether a move to South America looks
              financially realistic before you commit. It compares destination-country taxes, rent,
              living costs, and one-time relocation expenses so you can estimate how the move may
              change your monthly budget and cash readiness.
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
              Instead of relying on broad “South America is cheap” assumptions, the tool focuses
              on what usually matters most in a real move: take-home pay, housing pressure, recurring
              living costs, residency friction, exchange-rate effects, and whether your savings leave
              enough room to make the move comfortably.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
              <h3 className="font-semibold text-slate-900 dark:text-white">Taxes and take-home pay</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Compares country-level tax treatment so you can estimate what actually reaches your budget after local rules are applied.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
              <h3 className="font-semibold text-slate-900 dark:text-white">Housing and essentials</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Estimates rent, utilities, groceries, transportation, and healthcare-related costs for each destination city.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
              <h3 className="font-semibold text-slate-900 dark:text-white">Relocation readiness</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Looks at deposits, visa fees, setup costs, and monthly flexibility so you can judge whether the move looks realistic.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white sm:text-xl">
            What makes South America relocation financially different
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
              <h3 className="font-semibold text-slate-900 dark:text-white">Low cost does not mean simple</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Some South American destinations look highly affordable on everyday costs, but tax treatment, residency rules, and local infrastructure can change the real picture quickly.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
              <h3 className="font-semibold text-slate-900 dark:text-white">Exchange rates can distort the comparison</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                South America can be harder to model cleanly than some other regions because exchange-rate reality may not match official-rate assumptions in every country.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
              <h3 className="font-semibold text-slate-900 dark:text-white">Dollarized Ecuador changes budgeting</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Ecuador often feels simpler to budget for than some neighboring countries because there is no separate local-currency conversion layer for many expats thinking in USD.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
              <h3 className="font-semibold text-slate-900 dark:text-white">Country-to-country differences are large</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Medellín, Buenos Aires, Santiago, Lima, Montevideo, and São Paulo should not be treated as one cost profile. Housing pressure, tax treatment, and residency paths differ substantially.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800">
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
                What this South America relocation calculator includes
              </h2>
              <div className="mt-4 space-y-3 text-sm sm:text-base text-slate-600 dark:text-slate-300">
                <p>
                  This calculator estimates how a move to South America may affect your monthly
                  budget — covering income taxes, housing, living costs, and one-time relocation
                  expenses across major South American countries and cities.
                </p>
                <p>
                  It includes city-level cost defaults, country-specific tax models, residency context,
                  monthly flexibility, savings coverage, and comparable salary estimates to help you compare
                  relocation scenarios more clearly.
                </p>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Income and taxes</div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    Estimated take-home pay based on salary, filing assumptions, and country-specific tax rules.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Housing and essentials</div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    Rent, utilities, groceries, transportation, and healthcare-related cost assumptions.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Visa and permit context</div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    Residency-path notes, planning assumptions, and one-time permit-related costs where relevant.
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

            <div className="rounded-2xl border border-amber-200/70 bg-amber-50 p-5 dark:border-amber-900/60 dark:bg-amber-950/30">
              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                What this tool does not fully model
              </div>
              <div className="mt-4 space-y-3 text-sm text-slate-700 dark:text-slate-300">
                <p>
                  Results are estimates only. Real taxes, rent, healthcare, immigration rules,
                  and household costs vary by residency status, visa path, city, and local market conditions.
                </p>
                <p>
                  This tool does not fully model neighborhood-level housing variation, every exchange-rate reality,
                  employer-provided benefits, all tax edge cases, or every local immigration pathway.
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
                Which South American country is the cheapest to live in?
              </dt>
              <dd className="mt-1">
                Lower-cost destinations in the calculator often include parts of Colombia, Paraguay, Bolivia, Peru, and Ecuador, but the right answer depends on exchange-rate conditions, housing choices, and what you are comparing against.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900 dark:text-white">
                What is the easiest South American country to get a visa for?
              </dt>
              <dd className="mt-1">
                That changes over time and depends on your situation. Some countries are commonly seen as more accessible for remote workers or retirees, but you should verify current requirements with official government sources before treating any route as reliable.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900 dark:text-white">
                How does this calculator handle Argentina's currency situation?
              </dt>
              <dd className="mt-1">
                It uses a standardized planning approach. In practice, currency conditions may shift the real cost picture materially, so Argentina should be treated as a destination where extra verification matters.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900 dark:text-white">
                Is Ecuador a good option for retirees?
              </dt>
              <dd className="mt-1">
                It can be attractive for some retirees because dollarization simplifies budgeting and some cities offer lower costs than many North American markets, but the right fit still depends on healthcare needs, residency path, and local living preferences.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900 dark:text-white">
                How much money do I need to relocate to South America?
              </dt>
              <dd className="mt-1">
                A common planning approach is to hold several months of destination expenses plus one-time move costs such as flights, deposits, visa fees, and setup costs. The calculator is designed to estimate that combined picture for the destination you choose.
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
              See how relocating to South America may change your FIRE timeline after taxes, spending, and housing costs.
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
                href="/caribbean-relocation-calculator"
                className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Caribbean Calculator
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