import type { Metadata } from "next";
import AdSlot from "@/components/AdSlot";
import EuropeRelocationCalculator from "@/components/EuropeRelocationCalculator";

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
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
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

          <p className="mx-auto mt-2 max-w-3xl text-sm text-slate-500 dark:text-slate-400">
            Use this calculator to pressure-test your budget before relocating to Europe.
          </p>

          <div className="mx-auto mt-6 h-1 w-16 rounded-full bg-indigo-600/80" />
        </div>
      </header>

      <section className="mx-auto max-w-5xl space-y-10 px-4 pb-12 sm:px-6">
        <EuropeRelocationCalculator />

        {/* FIRE cross-sell */}
        <section className="rounded-2xl border border-emerald-200/60 bg-emerald-50 p-5">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <div className="text-sm font-semibold text-slate-900">
                Thinking Bigger Than Just Moving?
              </div>
              <p className="mt-1 text-sm text-slate-700">
                See how relocating to Europe impacts your FIRE timeline.
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
            Keep comparing your options with more relocation, budgeting, and FIRE tools
            from Relocation by Numbers.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a href="/explore" className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
              Explore all tools
            </a>
            <a href="/international-relocation" className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              International Calculator
            </a>
            <a href="/caribbean-relocation-calculator" className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Caribbean Calculator
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
            <a href="/best-cities-for-fire" className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Best Cities for FIRE
            </a>
          </div>
        </section>

        {/* What this calculator includes */}
        <section className="rounded-2xl bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800">
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
                What this Europe relocation calculator includes
              </h2>
              <div className="mt-4 space-y-3 text-sm sm:text-base text-slate-600 dark:text-slate-300">
                <p>
                  This calculator estimates how a move to Europe may affect your monthly budget —
                  covering income taxes, housing, living costs, and one-time relocation expenses
                  for destinations across the EU, UK, and wider Europe.
                </p>
                <p>
                  It covers 35+ European countries including Portugal, the UK, Spain, France,
                  Germany, Italy, the Netherlands, Ireland, and more — with country-specific tax
                  models and city-level cost defaults for Lisbon, Porto, and London.
                </p>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Income and taxes</div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    Estimated take-home pay based on your salary, filing status, and
                    country-specific European tax rules.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Housing and essentials</div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    Rent, utilities, groceries, transportation, and healthcare costs for
                    each European destination.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Visa and permit costs</div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    EU freedom of movement, national visa programs, digital nomad visas,
                    and estimated permit fees included in your one-time moving budget.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Planning signals</div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    Monthly flexibility, comparable salary, savings coverage, and a comfort
                    score to judge whether the move looks realistic.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-indigo-200/70 bg-indigo-50 p-5 dark:border-indigo-900/60 dark:bg-indigo-950/30">
              <div className="text-sm font-semibold text-slate-900 dark:text-white">Good to know before you use it</div>
              <div className="mt-4 space-y-3 text-sm text-slate-700 dark:text-slate-300">
                <p>
                  Results are estimates only. Real taxes, rent, healthcare, immigration rules,
                  and household costs vary by residency status, visa path, and local market
                  conditions.
                </p>
                <p>
                  EU citizens moving within the EU benefit from freedom of movement — visa
                  costs may be minimal. Non-EU citizens (including Americans, Canadians, and
                  Australians) typically need a national visa or residency permit, which varies
                  significantly by country and income requirements.
                </p>
                <p>
                  This tool is most useful for testing scenarios, comparing European destinations,
                  and seeing whether your income and savings create enough room to make the
                  move comfortably.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
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
                Among popular expat destinations, Portugal is consistently one of the most
                affordable Western European countries — particularly Porto, which has lower
                costs than Lisbon. Eastern European countries like Poland, Hungary, and Romania
                are generally cheaper still, though they may have fewer English-speaking communities
                and different visa considerations for non-EU citizens.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900 dark:text-white">
                Does this calculator include European income taxes?
              </dt>
              <dd className="mt-1">
                Yes. Country-specific resident income tax models are applied for all 35+
                European countries in this calculator, including Portugal, the UK, Spain,
                France, Germany, Italy, Ireland, the Netherlands, and more. Tax estimates
                are based on published resident rates as of early 2026 and are intended for
                planning purposes only.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900 dark:text-white">
                Can an American move to Europe without a job offer?
              </dt>
              <dd className="mt-1">
                Yes, in several countries. Portugal's D7 Passive Income Visa, Spain's
                Non-Lucrative Visa, and Italy's Elective Residency Visa allow non-EU citizens
                to live in Europe without a local job offer, typically requiring proof of
                sufficient passive income or savings. Many countries also offer digital nomad
                visas for remote workers. Requirements vary — always verify with official
                government sources.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900 dark:text-white">
                How much does it cost to relocate to Europe from the US?
              </dt>
              <dd className="mt-1">
                One-time relocation costs typically include visa application fees, flights,
                a security deposit, and temporary accommodation. For most Western European
                destinations, budget $3,000–$7,000 in upfront costs before ongoing monthly
                expenses begin. The calculator estimates one-time costs alongside monthly
                budget comparisons for each destination.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900 dark:text-white">
                Is it cheaper to live in Europe than in the US?
              </dt>
              <dd className="mt-1">
                It depends on the country and city. Portugal and Southern European cities
                are often 20–40% cheaper than major US cities on everyday costs, though
                income taxes tend to be higher. London is comparable to or more expensive
                than New York. Nordic countries have high taxes and costs but strong social
                benefits. Use the calculator to compare your specific European destination
                against your current US city.
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
