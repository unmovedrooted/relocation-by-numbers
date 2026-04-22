import type { Metadata } from "next";
import Link from "next/link";
import AdSlot from "@/components/AdSlot";
import InternationalRelocationCalculator from "@/components/InternationalRelocationCalculator";

export const metadata: Metadata = {
  title: "International Relocation Calculator | Cost, Taxes, Rent & Budget by City",
  description:
    "Compare taxes, rent, living costs, and take-home pay across 20+ cities worldwide. Estimate your moving budget for Lisbon, London, Tokyo, Dubai, Bangkok, Singapore, and more.",
  alternates: {
    canonical: "https://www.relocationbynumbers.com/international-relocation-calculator",
  },
  openGraph: {
    title: "International Relocation Calculator | Cost, Taxes, Rent & Budget by City",
    description:
      "Compare taxes, rent, living costs, and take-home pay across 20+ cities worldwide. Estimate your moving budget for Lisbon, London, Tokyo, Dubai, Bangkok, Singapore, and more.",
    url: "https://www.relocationbynumbers.com/international-relocation-calculator",
    siteName: "Relocation by Numbers",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "International Relocation Calculator | Cost, Taxes, Rent & Budget by City",
    description:
      "Compare taxes, rent, living costs, and take-home pay across 20+ cities worldwide.",
  },
};

export default function Page() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="py-10 text-center">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            International Relocation Calculator
          </h1>

          <p className="mt-2 text-xl font-semibold text-slate-700 dark:text-slate-300 sm:text-2xl">
            Compare Cost of Living, Taxes, Rent &amp; Moving Budget by City
          </p>

          <p className="mx-auto mt-3 max-w-5xl text-sm text-slate-600 dark:text-slate-300 sm:text-base">
            Compare taxes, rent, living costs, take-home pay, and one-time moving expenses
            across Lisbon, London, Tokyo, Dubai, Singapore, Bangkok, Kuala Lumpur, Toronto,
            Seoul, and more. Plan an international move with a clearer budget.
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

          <p className="mx-auto mt-2 max-w-4xl text-sm text-slate-500 dark:text-slate-400">
            Use this calculator to pressure-test your budget before relocating overseas.
          </p>

          <div className="mx-auto mt-6 h-1 w-16 rounded-full bg-blue-600/80" />
        </div>
      </header>

      <section className="mx-auto max-w-5xl space-y-10 px-4 pb-12 sm:px-6">
        
          <section className="">
            <AdSlot
             slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_MID}
              className="min-h-[100px]"
            />
          </section>
      

        <InternationalRelocationCalculator />

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
              How this international relocation calculator works
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
              This calculator is built to help you test whether an international move
              looks financially realistic before you commit. It compares destination-city
              taxes, rent, living costs, and one-time setup expenses so you can estimate
              how the move may change your monthly budget and cash readiness.
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
              Instead of relying on broad “cheaper abroad” assumptions, the tool focuses
              on what usually matters most in a real relocation decision: take-home pay,
              housing pressure, recurring cost structure, immigration friction, and whether
              your savings create enough room to make the move comfortably.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
              <h3 className="font-semibold text-slate-900 dark:text-white">Taxes and take-home pay</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Compares destination tax treatment so you can estimate what actually reaches your budget after local rules are applied.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
              <h3 className="font-semibold text-slate-900 dark:text-white">Housing and essentials</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Estimates rent, utilities, groceries, transportation, and healthcare-related costs for the destination city.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
              <h3 className="font-semibold text-slate-900 dark:text-white">Relocation readiness</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Looks at deposits, travel, visa fees, setup costs, and monthly flexibility so you can judge whether the move looks realistic.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white sm:text-xl">
            What makes international relocation financially different
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
              <h3 className="font-semibold text-slate-900 dark:text-white">Tax-free does not mean low-cost</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Cities like Dubai may have no personal income tax, but that does not automatically make them cheap once housing and setup costs are included.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
              <h3 className="font-semibold text-slate-900 dark:text-white">Visa path changes the math</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                The same destination can look very different depending on whether you are moving with employer sponsorship, a digital nomad visa, passive income status, or another residency path.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
              <h3 className="font-semibold text-slate-900 dark:text-white">City-level differences are huge</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Lisbon, London, Tokyo, Bangkok, and Kuala Lumpur do not behave the same financially. Housing pressure and recurring costs can vary dramatically even when people loosely group them as “international options.”
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
              <h3 className="font-semibold text-slate-900 dark:text-white">The current-city side is a planning baseline</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                The current side of the comparison is best treated as a normalized reference point. The destination side is where the calculator is most useful for building a coherent move scenario.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800">
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
                What this international relocation calculator includes
              </h2>
              <div className="mt-4 space-y-3 text-sm sm:text-base text-slate-600 dark:text-slate-300">
                <p>
                  This calculator estimates how a move abroad may affect your monthly budget —
                  covering income taxes, housing, living costs, and one-time relocation expenses
                  for destinations across Europe, Asia, the Middle East, and North America.
                </p>
                <p>
                  City-level cost defaults are available for Lisbon, Porto, London, Toronto,
                  Seoul, Busan, Tokyo, Singapore, Bangkok, Kuala Lumpur, Dubai, Abu Dhabi,
                  Ho Chi Minh City, Jakarta, and major US comparison cities.
                </p>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Income and taxes</div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    Estimated take-home pay based on salary, filing assumptions, and destination-country tax rules.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Housing and essentials</div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    Rent, utilities, groceries, transportation, and healthcare-related cost assumptions.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">One-time move costs</div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    Deposits, flights, visa fees, setup costs, and a planning buffer for relocation readiness.
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

            <div className="rounded-2xl border border-blue-200/70 bg-blue-50 p-5 dark:border-blue-900/60 dark:bg-blue-950/30">
              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                What this tool does not fully model
              </div>
              <div className="mt-4 space-y-3 text-sm text-slate-700 dark:text-slate-300">
                <p>
                  Results are estimates only. Real taxes, rent, healthcare, immigration rules,
                  and household costs vary by residency status, visa path, city, and local market conditions.
                </p>
                <p>
                  This tool does not fully model neighborhood-level housing variation, employer-provided benefits,
                  family-specific schooling decisions, every local tax edge case, or every immigration path.
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
                Which cities are the cheapest to relocate to internationally?
              </dt>
              <dd className="mt-1">
                Lower-cost destinations in the calculator often include cities in Southeast Asia and some parts of Southern Europe, but the right answer depends on taxes, rent, visa path, and what kind of housing and lifestyle you are comparing against.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900 dark:text-white">
                How much money do I need to relocate abroad?
              </dt>
              <dd className="mt-1">
                A common planning approach is to hold several months of destination expenses plus one-time move costs like visa fees, flights, deposits, and setup costs. The calculator is designed to estimate that combined picture for the city you choose.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900 dark:text-white">
                Does this calculator include income tax for each country?
              </dt>
              <dd className="mt-1">
                It applies country-specific resident personal income tax models where available, but the results are planning estimates and should still be verified locally before major decisions.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900 dark:text-white">
                Can I use this as a cost of living comparison tool?
              </dt>
              <dd className="mt-1">
                Yes. It is built to compare destination-city taxes, rent, monthly costs, and take-home pay side by side, with the destination scenario as the main decision-making view.
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
              See how an international move may change your FIRE timeline after taxes, spending, and housing costs.
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
              <a href="/explore" className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                Explore all tools
              </a>
              <a href="/europe-relocation-calculator" className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Europe Calculator
              </a>
              <a href="/asia-relocation-calculator" className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Asia Calculator
              </a>
              <a href="/caribbean-relocation-calculator" className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Caribbean Calculator
              </a>
              <a href="/south-america-relocation-calculator" className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
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