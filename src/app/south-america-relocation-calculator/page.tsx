import type { Metadata } from "next";
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
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="py-10 text-center">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            South America Relocation Calculator
          </h1>

          <p className="mt-2 text-xl font-semibold text-slate-700 dark:text-slate-300 sm:text-2xl">
            Compare Cost of Living, Taxes, Rent &amp; Moving Budget by City
          </p>

          <p className="mx-auto mt-3 max-w-4xl text-sm text-slate-600 dark:text-slate-300 sm:text-base">
  Compare taxes, rent, living costs, take-home pay, and one-time moving expenses across major South American cities.
</p>

<p className="mx-auto mt-2 max-w-3xl text-sm text-slate-500 dark:text-slate-400">
  Use this calculator to pressure-test your budget before relocating to South America — including Colombia, Argentina, Chile, Peru, Brazil, Ecuador, Uruguay, Paraguay, Bolivia, Guyana, Suriname, and Venezuela.
</p>

          <div className="mx-auto mt-6 h-1 w-16 rounded-full bg-amber-600/80" />
        </div>
      </header>

      <section className="mx-auto max-w-5xl space-y-10 px-4 pb-12 sm:px-6">
        <SouthAmericaRelocationCalculator />

        {/* FIRE cross-sell */}
        <section className="rounded-2xl border border-emerald-200/60 bg-emerald-50 p-5">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <div className="text-sm font-semibold text-slate-900">
                Thinking Bigger Than Just Moving?
              </div>
              <p className="mt-1 text-sm text-slate-700">
                See how relocating to South America impacts your FIRE timeline.
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
            <a href="/caribbean-relocation-calculator" className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Caribbean Calculator
            </a>
            <a href="/europe-relocation-calculator" className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Europe Calculator
            </a>
            <a href="/asia-relocation-calculator" className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Asia Calculator
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
                What this South America relocation calculator includes
              </h2>
              <div className="mt-4 space-y-3 text-sm sm:text-base text-slate-600 dark:text-slate-300">
               <p>
  This calculator estimates how a move to South America may affect your monthly
  budget — covering income taxes, housing, living costs, and one-time relocation
  expenses across major South American countries and cities.
</p>
<p>
  It includes city-level cost defaults, country-specific tax models, visa context,
  monthly flexibility, savings coverage, and comparable salary estimates to help
  you compare relocation scenarios more clearly.
</p>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Income and taxes</div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Estimated take-home pay based on your salary, filing status, and country-specific tax rules.</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Housing and essentials</div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Rent, utilities, groceries, transportation, and healthcare costs for each South American city.</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Visa and permit context</div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Digital nomad visas, pensionado programs, rentista options, and estimated permit fees — with income requirements and key notes per country.</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Planning signals</div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Monthly flexibility, comparable salary, savings coverage, and a comfort score to judge whether the move looks realistic.</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-200/70 bg-amber-50 p-5 dark:border-amber-900/60 dark:bg-amber-950/30">
              <div className="text-sm font-semibold text-slate-900 dark:text-white">Good to know before you use it</div>
              <div className="mt-4 space-y-3 text-sm text-slate-700 dark:text-slate-300">
                <p>
                  Results are estimates only. Real taxes, rent, healthcare, immigration rules,
                  and household costs vary by residency status, visa path, and local market
                  conditions.
                </p>
                <p>
                  South America offers some of the lowest costs of living available to North
                  American and European expats. Colombia and Peru have become major digital
                  nomad hubs. Argentina's parallel exchange rate market means real purchasing
                  power often differs significantly from official-rate estimates.
                </p>
                <p>
                  This tool is most useful for testing scenarios, comparing South American
                  destinations, and seeing whether your income and savings create enough room
                  to make the move comfortably.
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
                Which South American country is the cheapest to live in?
              </dt>
              <dd className="mt-1">
                Paraguay, Bolivia, and Colombia tend to be the most affordable destinations
                in this calculator. Asunción and Cochabamba sit at the lower end of the cost
                range, while Medellín combines low everyday costs with a large established
                expat community. Peru (Lima) and Argentina (Buenos Aires) can also be very
                affordable, especially for those holding USD. Ecuador (Cuenca in particular)
                is popular with retirees looking for low costs with a dollarized economy.
                Chile (Santiago) and Uruguay (Montevideo) are higher-cost but offer stronger
                infrastructure, stability, and quality of life.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900 dark:text-white">
                What is the easiest South American country to get a visa for?
              </dt>
              <dd className="mt-1">
                Colombia's Digital Nomad Visa is one of the most accessible in the region —
                remote workers earning just $800/month qualify for a 2-year renewable stay.
                Chile also offers a dedicated Digital Nomad Visa requiring $1,500/month.
                Ecuador's pensioner and rentista visa paths are popular with retirees, with
                relatively accessible income thresholds. Paraguay is frequently cited for
                straightforward permanent residency pathways at a lower cost base. Argentina,
                Peru, and Brazil have rentista and retirement visa options with varying income
                requirements. Always verify current requirements with official government
                sources before applying.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900 dark:text-white">
                How does this calculator handle Argentina's currency situation?
              </dt>
              <dd className="mt-1">
                The calculator uses official exchange rates for its estimates. In practice,
                many expats in Argentina access a significantly higher rate through legal
                parallel exchange mechanisms, which can make the real cost of living
                substantially lower than official-rate estimates suggest. The calculator
                includes a warning note for Argentina and recommends verifying current rates
                independently.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900 dark:text-white">
                Is Ecuador a good option for retirees?
              </dt>
              <dd className="mt-1">
                Ecuador is one of the most popular retirement destinations in South America.
                It is dollarized — so there is no currency conversion complexity — and cities
                like Cuenca and Manta offer a lower cost of living than most North American
                or European cities. Pensioner and rentista residency paths are well-established
                and accessible. Healthcare costs can be materially lower than in the US.
                The calculator includes Quito, Guayaquil, Cuenca, and Manta as destination
                cities for Ecuador.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900 dark:text-white">
                Is Medellín, Colombia a good place for remote workers?
              </dt>
              <dd className="mt-1">
                Yes — Medellín is one of the most popular remote work destinations in the
                Americas. It combines low rent, fast internet, a large English-speaking expat
                community, spring-like weather year-round, and Colombia's accessible Digital
                Nomad Visa. The calculator defaults to Medellín when Colombia is selected.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900 dark:text-white">
                Why is Paraguay included and what should I know about its tax system?
              </dt>
              <dd className="mt-1">
                Paraguay is included because it is a genuine lower-cost relocation option
                with accessible residency pathways and one of the simpler tax regimes in the
                region. Paraguay operates a territorial tax system, which means the tax
                treatment of foreign-source income may differ from locally-earned income —
                but the specifics depend on your situation and residency status. The
                calculator models this conservatively and flags it clearly. Always verify
                the tax treatment of your specific income type with a local advisor before
                treating it as a planning assumption.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900 dark:text-white">
                How much money do I need to relocate to South America?
              </dt>
              <dd className="mt-1">
                One-time relocation costs across the destinations in this calculator typically
                range from $2,000 to $6,000, covering visa fees, flights, a security deposit,
                and temporary accommodation. Paraguay, Bolivia, and Colombia tend toward the
                lower end. Chile, Uruguay, and Brazil are somewhat higher. Use the calculator
                to estimate both the upfront cash needed and the ongoing monthly budget
                difference for your specific destination.
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
