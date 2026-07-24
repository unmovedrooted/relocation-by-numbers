import type { Metadata } from "next";
import EuropeRelocationCalculator from "@/components/EuropeRelocationCalculator";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Europe Relocation Calculator | Cost of Living, Taxes & Budget by City",
  description:
    "Compare taxes, rent, living costs, and take-home pay across major European cities. Estimate your moving budget for Lisbon, London, Porto, and 35+ countries including EU member states, the UK, and Switzerland.",
  alternates: {
    canonical: "https://www.relocationbynumbers.com/europe-relocation-calculator",
  },
  openGraph: {
    title: "Europe Relocation Calculator | Cost of Living, Taxes & Budget by City",
    description:
      "Compare taxes, rent, living costs, and take-home pay across major European cities. Estimate your moving budget for Lisbon, London, Porto, and 35+ countries.",
    url: "https://www.relocationbynumbers.com/europe-relocation-calculator",
    siteName: "Relocation by Numbers",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Europe Relocation Calculator | Cost of Living, Taxes & Budget by City",
    description:
      "Compare taxes, rent, living costs, and take-home pay across major European cities.",
  },
};

export default function Page() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900 dark:from-slate-950 dark:to-slate-900 dark:text-slate-100">
      <header className="py-10 text-center">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Europe Relocation Calculator
          </h1>

          <p className="mt-2 text-xl font-semibold text-slate-700 dark:text-slate-300 sm:text-2xl">
            Compare Cost of Living, Taxes, Rent &amp; Moving Budget by City
          </p>

          <p className="mx-auto mt-3 max-w-4xl text-sm text-slate-600 dark:text-slate-300 sm:text-base">
            Compare taxes, rent, living costs, take-home pay, and one-time moving expenses
            across Lisbon, Porto, London, and 35+ European countries including EU member
            states, the UK, Switzerland, and Norway.
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
            Use this calculator to pressure-test your budget before relocating to Europe.
          </p>

          <div className="mx-auto mt-6 h-1 w-16 rounded-full bg-indigo-600/80" />
        </div>
      </header>

      <section className="mx-auto max-w-5xl space-y-10 px-4 pb-12 sm:px-6">
        <EuropeRelocationCalculator />

        <div className="text-center text-xs text-slate-500 dark:text-slate-400">
          Assumptions updated: March 2026
        </div>

        <section className="rounded-2xl bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800">
          <div className="max-w-3xl">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white sm:text-xl">
              How this Europe relocation calculator works
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
              This calculator is designed to help you test whether a move to Europe looks
              financially realistic before you commit. It compares destination-country taxes,
              rent, living costs, and one-time relocation expenses so you can estimate how a
              move may change your monthly budget and cash readiness.
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
              Instead of relying on broad “Europe is cheaper” or “Europe is expensive” assumptions,
              the tool focuses on the variables that usually matter most: take-home pay, housing
              pressure, recurring living costs, visa or permit friction, and whether your savings
              create enough room to make the move comfortably.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
              <h3 className="font-semibold text-slate-900 dark:text-white">Taxes and take-home pay</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Compares country-level tax treatment so you can estimate what reaches your budget after local tax assumptions are applied.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
              <h3 className="font-semibold text-slate-900 dark:text-white">Housing and essentials</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Estimates rent, utilities, groceries, transportation, and healthcare-related costs across supported destinations.
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
            What makes European relocation financially different
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
              <h3 className="font-semibold text-slate-900 dark:text-white">High taxes can come with strong public benefits</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Some European countries have higher income taxes than the US, but the full budget picture can still change because healthcare, transportation, and other public services are structured differently.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
              <h3 className="font-semibold text-slate-900 dark:text-white">Europe is not one cost profile</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Lisbon, London, Zurich, Warsaw, and Athens do not behave the same financially. Housing pressure, tax treatment, and salary expectations can differ dramatically across countries and cities.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
              <h3 className="font-semibold text-slate-900 dark:text-white">EU citizenship changes the relocation math</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                EU citizens moving within the EU often face far less immigration friction than Americans or other non-EU nationals, which can materially change upfront costs and realism.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
              <h3 className="font-semibold text-slate-900 dark:text-white">Visa path still matters for non-EU movers</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                National visas, passive income routes, and digital nomad programs can differ heavily by country, and that friction often matters almost as much as monthly budget.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800">
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
                What this Europe relocation calculator includes
              </h2>
              <div className="mt-4 space-y-3 text-sm sm:text-base text-slate-600 dark:text-slate-300">
                <p>
                  This calculator estimates how a move to Europe may affect your monthly budget,
                  covering income taxes, housing, living costs, and one-time relocation expenses
                  for destinations across the EU, UK, and wider Europe.
                </p>
                <p>
                  It covers 35+ European countries including Portugal, the UK, Spain, France,
                  Germany, Italy, the Netherlands, Ireland, Switzerland, and more.
                </p>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Income and taxes</div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    Estimated take-home pay based on salary and country-specific tax rules.
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
                    EU mobility context, national visa assumptions, and one-time permit-related costs where relevant.
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

            <div className="rounded-2xl border border-indigo-200/70 bg-indigo-50 p-5 dark:border-indigo-900/60 dark:bg-indigo-950/30">
              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                What this tool does not fully model
              </div>
              <div className="mt-4 space-y-3 text-sm text-slate-700 dark:text-slate-300">
                <p>
                  Results are estimates only. Real taxes, rent, healthcare, immigration rules,
                  and household costs vary by residency status, visa path, city, and local market conditions.
                </p>
                <p>
                  This tool does not fully model neighborhood-level housing differences, employer-provided benefits,
                  family-specific schooling choices, all social contribution edge cases, or every rule in local tax and residency law.
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
                Which European country is the cheapest to live in?
              </dt>
              <dd className="mt-1">
                It depends on what part of Europe you mean. Parts of Southern and Eastern Europe are often cheaper than Western Europe, but the tradeoffs around visas, wages, and English-speaking infrastructure can differ a lot.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900 dark:text-white">
                Does this calculator include European income taxes?
              </dt>
              <dd className="mt-1">
                Yes. Country-specific resident income tax models are applied across the supported destinations, but they are planning estimates and should be verified locally before major decisions.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900 dark:text-white">
                Can an American move to Europe without a job offer?
              </dt>
              <dd className="mt-1">
                Sometimes, yes. Several countries offer passive income, retirement, or digital nomad routes, but requirements vary significantly and should be checked directly with official sources.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900 dark:text-white">
                How much does it cost to relocate to Europe from the US?
              </dt>
              <dd className="mt-1">
                One-time costs usually include visa fees, flights, deposits, and temporary accommodation. The full number depends heavily on the destination country and your residency path.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900 dark:text-white">
                Is it cheaper to live in Europe than in the US?
              </dt>
              <dd className="mt-1">
                Sometimes, but not uniformly. Some destinations are cheaper on everyday living while others are not, and higher taxes can change the comparison even when rent looks favorable.
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
              See how relocating to Europe may change your FIRE timeline after taxes, spending, and housing costs.
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