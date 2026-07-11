import type { Metadata } from "next";
import AsiaRelocationCalculator from "@/components/AsiaRelocationCalculator";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Asia Relocation Calculator | Cost of Living, Taxes & Budget by City",
  description:
    "Compare taxes, rent, living costs, and take-home pay across 30+ Asian and Gulf cities. Estimate your moving budget for Bangkok, Tokyo, Singapore, Manila, Taipei, Hong Kong, Dubai, Doha, Riyadh, Muscat, and more.",
  alternates: {
    canonical: "https://www.relocationbynumbers.com/asia-relocation-calculator",
  },
  openGraph: {
    title: "Asia Relocation Calculator | Cost of Living, Taxes & Budget by City",
    description:
      "Compare taxes, rent, living costs, and take-home pay across 30+ Asian and Gulf cities. Estimate your moving budget for Bangkok, Tokyo, Singapore, Manila, Taipei, Hong Kong, Dubai, Doha, Riyadh, Muscat, and more.",
    url: "https://www.relocationbynumbers.com/asia-relocation-calculator",
    siteName: "Relocation by Numbers",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Asia Relocation Calculator | Cost of Living, Taxes & Budget by City",
    description:
      "Compare taxes, rent, living costs, and take-home pay across 30+ Asian and Gulf cities.",
  },
};

export default function Page() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900 dark:from-slate-950 dark:to-slate-900 dark:text-slate-100">
      <header className="py-10 text-center">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Asia &amp; Middle East Relocation Calculator
          </h1>

          <p className="mt-2 text-xl font-semibold text-slate-700 dark:text-slate-300 sm:text-2xl">
            Compare Cost of Living, Taxes, Rent &amp; Moving Budget by City
          </p>

          <p className="mx-auto mt-3 max-w-4xl text-sm text-slate-600 dark:text-slate-300 sm:text-base">
            Compare taxes, rent, living costs, take-home pay, and one-time moving expenses
            across Southeast Asia, East Asia, South Asia, and the Gulf — including Bangkok,
            Tokyo, Singapore, Manila, Taipei, Hong Kong, Bangalore, Shanghai, Dubai, Doha,
            Riyadh, and Muscat.
          </p>

          <div className="mx-auto mt-4 flex max-w-3xl flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
            <span>Planning estimates only.</span>
            <span className="hidden sm:inline">•</span>
            <span>Results depend on salary, visa path, residency status, and housing assumptions.</span>
            <span className="hidden sm:inline">•</span>
            <Link
              href="/methodology"
              className="font-medium text-slate-700 underline underline-offset-4 hover:no-underline dark:text-slate-300"
            >
              See methodology
            </Link>
          </div>

          <div className="mx-auto mt-6 h-1 w-16 rounded-full bg-rose-600/80" />
        </div>
      </header>

      <section className="mx-auto max-w-5xl space-y-10 px-4 pb-12 sm:px-6">
        <AsiaRelocationCalculator />

        <div className="text-center text-xs text-slate-500 dark:text-slate-400">
          Assumptions updated: March 2026
        </div>

        <section className="rounded-2xl bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800">
          <div className="max-w-3xl">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white sm:text-xl">
              How this Asia &amp; Gulf relocation calculator works
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
              This calculator is designed to help you pressure-test whether a move to Asia or the
              Middle East looks financially realistic before you commit. It compares destination-city
              rent, living costs, taxes, and one-time relocation expenses so you can see how the move
              may change your monthly budget and cash readiness.
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
              Instead of relying on headline cost-of-living lists, the tool focuses on the pieces that
              usually matter most in an international move: take-home pay, housing pressure, visa-related
              setup costs, and whether your savings create enough room to relocate without putting yourself
              under immediate financial strain.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
              <h3 className="font-semibold text-slate-900 dark:text-white">Taxes and take-home pay</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Compares country-level income tax treatment so you can see what reaches your budget after resident tax assumptions are applied.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
              <h3 className="font-semibold text-slate-900 dark:text-white">Housing and essentials</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Estimates rent, utilities, groceries, transport, healthcare, and other recurring costs by destination city.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
              <h3 className="font-semibold text-slate-900 dark:text-white">Relocation readiness</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Looks at moving costs, setup friction, and monthly flexibility so you can judge whether the move looks comfortable or tight.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white sm:text-xl">
            What makes relocating to Asia or the Gulf different
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
              <h3 className="font-semibold text-slate-900 dark:text-white">Visa path matters more</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                International relocation is not just a rent-and-tax problem. Visa type, sponsorship rules,
                permit fees, and residency eligibility can shape whether a move is realistic at all.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
              <h3 className="font-semibold text-slate-900 dark:text-white">Tax-free does not mean cheap</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Gulf cities like Dubai, Doha, and Riyadh may have no personal income tax, but that does not
                automatically make them low-cost once housing and setup costs are included.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
              <h3 className="font-semibold text-slate-900 dark:text-white">City variation is huge</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Tokyo and Singapore are not financially comparable to Bangkok or Ho Chi Minh City. Even within
                the same region, housing pressure and recurring costs can vary dramatically.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
              <h3 className="font-semibold text-slate-900 dark:text-white">Setup friction is real</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Deposits, flights, temporary stays, permit fees, and documentation can make the first months
                of an international move much more expensive than the monthly budget alone suggests.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800">
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
                What this calculator includes
              </h2>
              <div className="mt-4 space-y-3 text-sm sm:text-base text-slate-600 dark:text-slate-300">
                <p>
                  This calculator estimates how a move to Asia or the Middle East may affect your monthly
                  budget — covering income taxes, housing, living costs, and one-time relocation expenses
                  across 18 countries and 30+ cities.
                </p>
                <p>
                  City-level cost defaults cover Southeast Asia, East Asia, South Asia, the Pacific, and the Gulf,
                  including Bangkok, Kuala Lumpur, Ho Chi Minh City, Jakarta, Manila, Cebu, Tokyo, Seoul, Taipei,
                  Hong Kong, Shanghai, Beijing, Bangalore, Mumbai, Delhi, Hyderabad, Singapore, Sydney, Auckland,
                  Dubai, Abu Dhabi, Doha, Riyadh, and Muscat.
                </p>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Income and taxes</div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    Country-specific resident income tax models, with confidence badges showing estimate quality.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Housing and essentials</div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    Rent, utilities, groceries, transportation, and healthcare costs for each destination city.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Visa and permit context</div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    Visa programs, estimated permit fees, and key immigration notes for every destination.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Planning signals</div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    Monthly flexibility, comparable salary, savings coverage, and comfort signals to judge whether the move looks realistic.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-rose-200/70 bg-rose-50 p-5 dark:border-rose-900/60 dark:bg-rose-950/30">
              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                What this tool does not fully model
              </div>
              <div className="mt-4 space-y-3 text-sm text-slate-700 dark:text-slate-300">
                <p>
                  Results are estimates only. Real taxes, rent, healthcare, immigration rules, and household
                  costs vary by residency status, visa path, employer support, and local market conditions.
                </p>
                <p>
                  This tool does not fully model neighborhood-level rent differences, employer-provided housing,
                  detailed school choices, family-specific healthcare needs, or every edge case in local residency and tax law.
                </p>
                <p>
                  It is most useful for testing scenarios, comparing cities, and seeing whether your income and savings
                  create enough room to make the move comfortably.
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
                Which Asian country is the cheapest to live in?
              </dt>
              <dd className="mt-1">
                Among the destinations in this calculator, lower-cost options often include Indonesia, Vietnam,
                parts of the Philippines, and India. Malaysia and Thailand often stand out as strong middle-ground
                choices because they combine lower costs with stronger expat infrastructure.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900 dark:text-white">
                Does this calculator include Asian income taxes?
              </dt>
              <dd className="mt-1">
                Yes. The calculator applies country-specific resident income tax models across the supported destinations.
                Gulf cities like Dubai, Abu Dhabi, Doha, Riyadh, and Muscat have no personal income tax, but that still does
                not make them automatically low-cost once housing and setup costs are included.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900 dark:text-white">
                What visa do I need to live in Thailand, Japan, or Singapore?
              </dt>
              <dd className="mt-1">
                Visa requirements vary sharply by country. Thailand offers long-term options for some remote workers and retirees.
                Japan has specialist and newer remote-work pathways. Singapore is much stricter and usually employer-linked.
                Always verify current visa rules directly with official government sources before making plans.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900 dark:text-white">
                How much money do I need to relocate to Asia?
              </dt>
              <dd className="mt-1">
                The one-time moving cost is often only part of the story. In many cases, the bigger financial question is whether
                your ongoing monthly budget works in the destination city after housing, taxes, healthcare, and setup costs are included.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900 dark:text-white">
                Is it cheaper to live in Asia than in the US?
              </dt>
              <dd className="mt-1">
                Often yes, but not uniformly. Cities like Bangkok, Kuala Lumpur, Manila, Bangalore, and Ho Chi Minh City tend to
                be much cheaper than major US cities, while Singapore, Tokyo, and Hong Kong can be far more expensive than people expect.
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
              See how relocating to Asia or the Gulf may change your FIRE timeline after taxes, spending, and housing costs.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <a
                href="/fire-calculator"
                className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                🔥 Calculate My FIRE Timeline
              </a>
              <Link
                href="/best-states-for-fire"
                className="text-sm font-semibold text-slate-700 underline underline-offset-4 hover:no-underline"
              >
                Best states for FIRE
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