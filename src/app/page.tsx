import Calculator from "@/components/Calculator";
import Link from "next/link";
import AdSlot from "@/components/AdSlot";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Relocation Calculator by State | Compare Salary, Taxes & Cost of Living",
  description:
    "Compare take-home pay, income taxes, housing costs, and real affordability across all 50 states. See how far your salary goes before you move.",
  alternates: {
    canonical: "https://www.relocationbynumbers.com/relocation-calculator",
  },
  openGraph: {
    title: "Relocation Calculator by State | Compare Salary, Taxes & Cost of Living",
    description:
      "Compare take-home pay, income taxes, housing costs, and real affordability across all 50 states. See how far your salary goes before you move.",
    url: "https://www.relocationbynumbers.com/relocation-calculator",
    siteName: "Relocation by Numbers",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Relocation Calculator by State | Compare Salary, Taxes & Cost of Living",
    description:
      "Compare take-home pay, income taxes, and housing costs across all 50 states before you relocate.",
  },
};

const POPULAR = [
  { href: "/compare/nyc-ny/charlotte-nc", label: "NYC vs Charlotte" },
  { href: "/compare/la-ca/austin-tx", label: "LA vs Austin" },
  { href: "/compare/seattle-wa/dallas-tx", label: "Seattle vs Dallas" },
  { href: "/compare/boston-ma/miami-fl", label: "Boston vs Miami" },
];

export default function Page() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">

      <header className="py-10 text-center">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Relocation Calculator by State
          </h1>

          <p className="mt-2 text-xl font-semibold text-slate-700 dark:text-slate-300 sm:text-2xl">
            Compare Salary, Taxes &amp; Cost of Living Across All 50 States
          </p>

          <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600 dark:text-slate-300 sm:text-base">
            See how far your salary really goes after state income taxes, housing costs,
            and everyday expenses — before you move.
          </p>

          <div className="mx-auto mt-4">
            <Link
              href="/methodology"
              className="text-sm font-medium text-slate-600 underline decoration-slate-300 underline-offset-4 transition hover:text-slate-900 dark:text-slate-300 dark:decoration-slate-600 dark:hover:text-white"
            >
              See methodology and data sources
            </Link>
          </div>

          <div className="mx-auto mt-6 h-1 w-16 rounded-full bg-blue-600/80" />
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 sm:px-6 pb-12 space-y-10">
        <Calculator monetization="home" />

        {process.env.NEXT_PUBLIC_ADSENSE_SLOT_TOP ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <AdSlot
              slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_TOP}
              className="min-h-[100px]"
            />
          </section>
        ) : null}

        {/* FIRE CTA */}
        <section className="rounded-2xl border border-emerald-200/60 bg-emerald-50 p-5">
          <div className="flex items-center justify-between gap-6">
            <div>
              <div className="text-sm font-semibold text-slate-900">
                Thinking Bigger Than Just Moving?
              </div>
              <p className="mt-1 text-sm text-slate-700">
                See how this relocation impacts your FIRE timeline.
              </p>
              <div className="mt-3 flex items-center gap-4 flex-wrap">
                <Link
                  href="/fire-calculator"
                  className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  🔥 Calculate My FIRE Timeline
                </Link>
                <div className="h-5 w-px bg-emerald-200" />
                <div className="flex items-center gap-5 text-sm text-slate-600">
                  <Link href="/coast-fire-calculator" className="hover:text-slate-900">Coast FIRE</Link>
                  <Link href="/barista-fire-calculator" className="hover:text-slate-900">Barista FIRE</Link>
                  <Link href="/lean-fire-calculator" className="hover:text-slate-900">Lean FIRE</Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* International CTA */}
        <section className="rounded-2xl border border-sky-200/60 bg-sky-50 p-5">
          <div className="flex items-center justify-between gap-6">
            <div>
              <div className="text-sm font-semibold text-slate-900">
                Planning a Move Abroad?
              </div>
              <p className="mt-1 text-sm text-slate-700">
                Compare taxes, rent, living costs, and take-home pay across countries before you relocate.
              </p>
              <div className="mt-3">
                <Link
                  href="/international-relocation-calculator"
                  className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Explore International Relocation →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Popular comparisons */}
        <section className="rounded-2xl bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
              Popular State-to-State Relocation Comparisons
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-300">
              A higher salary can shrink fast after state taxes and housing costs. Compare
              take-home pay and real monthly expenses before you commit to a move.
            </p>
            <div className="mt-5 text-xs font-semibold tracking-widest text-slate-500">
              POPULAR COMPARISONS
            </div>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {POPULAR.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-700"
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="mt-5">
              <Link
                href="/compare"
                className="text-sm font-semibold text-slate-700 transition hover:text-slate-900"
              >
                Explore all relocation comparisons →
              </Link>
            </div>
          </div>
        </section>

        {/* Popular cost of living */}
        <div className="text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Popular cost of living guides
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            {[
              { href: "/cost-of-living/charlotte-nc", label: "Charlotte" },
              { href: "/cost-of-living/nyc-ny", label: "NYC" },
              { href: "/cost-of-living/austin-tx", label: "Austin" },
              { href: "/cost-of-living/la-ca", label: "Los Angeles" },
              { href: "/cost-of-living/seattle-wa", label: "Seattle" },
              { href: "/cost-of-living/boston-ma", label: "Boston" },
              { href: "/cost-of-living/miami-fl", label: "Miami" },
            ].map((x) => (
              <Link
                key={x.href}
                href={x.href}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                {x.label}
              </Link>
            ))}
          </div>
        </div>

        {/* FIRE tools */}
        <section className="rounded-2xl bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800">
          <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Financial Independence Tools
          </h2>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
            <Link href="/fire-calculator" className="text-blue-600 hover:underline dark:text-blue-400">FIRE calculator</Link>
            <Link href="/fire-with-100k-salary" className="text-blue-600 hover:underline dark:text-blue-400">FIRE with 100k salary</Link>
            <Link href="/fire-with-150k-salary" className="text-blue-600 hover:underline dark:text-blue-400">FIRE with 150k salary</Link>
            <Link href="/best-cities-for-fire" className="text-blue-600 hover:underline dark:text-blue-400">Best cities for FIRE</Link>
            <Link href="/best-states-for-fire" className="text-blue-600 hover:underline dark:text-blue-400">Best states for FIRE</Link>
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
                Which states have no income tax?
              </dt>
              <dd className="mt-1">
                Nine states currently have no state income tax: Alaska, Florida, Nevada,
                New Hampshire, South Dakota, Tennessee, Texas, Washington, and Wyoming.
                This calculator accounts for each state's tax rules so you can see the
                real take-home difference before you move.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900 dark:text-white">
                How much does it cost to relocate to another state?
              </dt>
              <dd className="mt-1">
                One-time moving costs typically include a security deposit, first month's
                rent, moving truck or shipping fees, and travel. Beyond the upfront costs,
                this calculator shows how your monthly budget changes after taxes and
                housing — which is often the bigger long-term factor.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900 dark:text-white">
                Is it worth moving from a high-tax state to a low-tax state?
              </dt>
              <dd className="mt-1">
                It depends on your income and housing costs. Moving from California or
                New York to Texas or Florida can save thousands per year in state income
                tax, but higher property taxes and housing costs in some markets can
                offset a portion of the gain. This calculator shows the net monthly
                difference so you can judge for your specific situation.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900 dark:text-white">
                How does this relocation calculator work?
              </dt>
              <dd className="mt-1">
                Enter your current state and income on the left, then select a destination
                state on the right. The calculator applies state and federal income tax
                rules, adjusts for local housing costs, and shows you your estimated
                take-home pay and monthly budget in each location side by side.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900 dark:text-white">
                What is the cheapest state to live in?
              </dt>
              <dd className="mt-1">
                Mississippi, Arkansas, Oklahoma, and Kansas consistently rank among the
                most affordable states when combining housing costs, taxes, and everyday
                expenses. Use the calculator to compare any two states directly based on
                your income and lifestyle.
              </dd>
            </div>
          </dl>
        </section>
      </section>

      {/* Explore all tools */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 pb-12">
        <div className="rounded-2xl bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800 text-center">
          <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Explore More Relocation Tools
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-300">
            Browse calculators, salary tools, cost of living pages, and FIRE planning resources in one place.
          </p>
          <div className="mt-5">
            <Link
              href="/explore"
              className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Explore All Tools
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <a href="/about" className="transition hover:text-slate-900">About</a>
            <span>•</span>
            <a href="/disclaimer" className="transition hover:text-slate-900">Disclaimer</a>
            <span>•</span>
            <a href="/privacy" className="transition hover:text-slate-900">Privacy</a>
            <span>•</span>
            <a href="/terms" className="transition hover:text-slate-900">Terms</a>
          </div>
        </div>
      </footer>

    </main>
  );
}
