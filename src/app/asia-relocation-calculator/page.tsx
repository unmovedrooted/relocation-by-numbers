import type { Metadata } from "next";
import AsiaRelocationCalculator from "@/components/AsiaRelocationCalculator";

export const metadata: Metadata = {
  title: "Asia Relocation Calculator | Cost of Living, Taxes & Budget by City",
  description:
    "Compare taxes, rent, living costs, and take-home pay across major Asian cities. Estimate your moving budget for Bangkok, Tokyo, Singapore, Kuala Lumpur, Ho Chi Minh City, Jakarta, Seoul, and Dubai.",
  alternates: {
    canonical: "https://www.relocationbynumbers.com/asia-relocation-calculator",
  },
  openGraph: {
    title: "Asia Relocation Calculator | Cost of Living, Taxes & Budget by City",
    description:
      "Compare taxes, rent, living costs, and take-home pay across major Asian cities. Estimate your moving budget for Bangkok, Tokyo, Singapore, Kuala Lumpur, Ho Chi Minh City, Jakarta, Seoul, and Dubai.",
    url: "https://www.relocationbynumbers.com/asia-relocation-calculator",
    siteName: "Relocation by Numbers",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Asia Relocation Calculator | Cost of Living, Taxes & Budget by City",
    description:
      "Compare taxes, rent, living costs, and take-home pay across major Asian cities.",
  },
};

export default function Page() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="py-10 text-center">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-1.5 text-xs font-semibold tracking-widest text-rose-700 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
            🌏 ASIA RELOCATION
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Asia Relocation Calculator
          </h1>

          <p className="mt-2 text-xl font-semibold text-slate-700 dark:text-slate-300 sm:text-2xl">
            Compare Cost of Living, Taxes, Rent &amp; Moving Budget by City
          </p>

          <p className="mx-auto mt-3 max-w-4xl text-sm text-slate-600 dark:text-slate-300 sm:text-base">
            Compare taxes, rent, living costs, take-home pay, and one-time moving expenses
            across Bangkok, Tokyo, Singapore, Kuala Lumpur, Ho Chi Minh City, Jakarta,
            Seoul, Busan, Dubai, and Abu Dhabi.
          </p>

          <p className="mx-auto mt-2 max-w-3xl text-sm text-slate-500 dark:text-slate-400">
            Use this calculator to pressure-test your budget before relocating to Southeast
            or East Asia.
          </p>

          <div className="mx-auto mt-6 h-1 w-16 rounded-full bg-rose-600/80" />
        </div>
      </header>

      <section className="mx-auto max-w-5xl space-y-10 px-4 pb-12 sm:px-6">
        <AsiaRelocationCalculator />

        {/* FIRE cross-sell */}
        <section className="rounded-2xl border border-emerald-200/60 bg-emerald-50 p-5">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <div className="text-sm font-semibold text-slate-900">
                Thinking Bigger Than Just Moving?
              </div>
              <p className="mt-1 text-sm text-slate-700">
                See how relocating to Asia impacts your FIRE timeline.
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
            <a href="/europe-relocation-calculator" className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Europe Calculator
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
                What this Asia relocation calculator includes
              </h2>
              <div className="mt-4 space-y-3 text-sm sm:text-base text-slate-600 dark:text-slate-300">
                <p>
                  This calculator estimates how a move to Asia may affect your monthly budget —
                  covering income taxes, housing, living costs, and one-time relocation expenses
                  for major destinations across Southeast Asia, East Asia, and the Middle East.
                </p>
                <p>
                  City-level cost defaults are available for Bangkok, Tokyo, Singapore, Kuala
                  Lumpur, Ho Chi Minh City, Jakarta, Seoul, Busan, Dubai, and Abu Dhabi — with
                  country-specific tax models for each destination.
                </p>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Income and taxes</div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    Estimated take-home pay based on your salary, filing status, and
                    country-specific tax rules.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Housing and essentials</div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    Rent, utilities, groceries, transportation, and healthcare costs for each
                    Asian destination city.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Visa and permit costs</div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    Digital nomad visas, retirement visas, LTR programs, and estimated permit
                    fees included in your one-time moving budget.
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

            <div className="rounded-2xl border border-rose-200/70 bg-rose-50 p-5 dark:border-rose-900/60 dark:bg-rose-950/30">
              <div className="text-sm font-semibold text-slate-900 dark:text-white">Good to know before you use it</div>
              <div className="mt-4 space-y-3 text-sm text-slate-700 dark:text-slate-300">
                <p>
                  Results are estimates only. Real taxes, rent, healthcare, immigration rules,
                  and household costs vary by residency status, visa path, and local market
                  conditions.
                </p>
                <p>
                  Most Asian countries do not offer automatic long-term residency to foreigners.
                  Visa options vary widely — from Thailand's flexible LTR visa to Singapore's
                  strict employment pass requirements. Many expats use tourist visa extensions
                  or border runs while exploring longer-term options.
                </p>
                <p>
                  This tool is most useful for testing scenarios, comparing Asian destinations,
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
                Which Asian country is the cheapest to live in?
              </dt>
              <dd className="mt-1">
                Among the destinations in this calculator, Indonesia (Jakarta) and Vietnam
                (Ho Chi Minh City) are the most affordable, with cost indexes running
                roughly 40–55% of an average US city. Malaysia (Kuala Lumpur) and Thailand
                (Bangkok) are close behind and offer stronger English proficiency and expat
                infrastructure. Singapore is the most expensive Asian destination in this calculator.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900 dark:text-white">
                Does this calculator include Asian income taxes?
              </dt>
              <dd className="mt-1">
                Yes. Country-specific resident income tax models are applied for Thailand,
                Japan, Singapore, South Korea, Malaysia, Vietnam, Indonesia, and the UAE.
                Dubai and Abu Dhabi have no personal income tax. Tax estimates are based on
                published resident rates as of early 2026 and are intended for planning
                purposes only.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900 dark:text-white">
                What visa do I need to live in Thailand, Japan, or Singapore?
              </dt>
              <dd className="mt-1">
                Visa requirements vary significantly by country. Thailand offers a Long-Term
                Resident (LTR) visa for remote workers and retirees. Japan has a highly
                structured employment and residence visa system with few easy remote work
                options. Singapore's Employment Pass is employer-sponsored and difficult to
                obtain independently. Always verify current visa rules with official government
                sources before planning a move.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900 dark:text-white">
                How much money do I need to relocate to Asia?
              </dt>
              <dd className="mt-1">
                One-time relocation costs for most Asian destinations in this calculator
                range from $2,000 to $5,000, covering visa fees, flights, a security deposit,
                and temporary accommodation. The ongoing cost difference between your current
                city and the destination is often the more significant financial factor —
                use the calculator to estimate both.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900 dark:text-white">
                Is it cheaper to live in Asia than in the US?
              </dt>
              <dd className="mt-1">
                For most Asian cities in this calculator, yes — often significantly. Bangkok,
                Kuala Lumpur, Ho Chi Minh City, and Jakarta all have cost indexes well below
                major US cities. Tokyo and Singapore are higher-cost destinations that can
                approach or exceed US city costs depending on housing choice. Dubai sits
                in the mid-to-high range with no income tax, which meaningfully improves
                take-home pay.
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
