import type { Metadata } from "next";
import Link from "next/link";

const comparisons = [
  { href: "/compare/nyc-ny/charlotte-nc", label: "NYC vs Charlotte", group: "From NYC" },
  { href: "/compare/nyc-ny/austin-tx", label: "NYC vs Austin", group: "From NYC" },
  { href: "/compare/nyc-ny/la-ca", label: "NYC vs Los Angeles", group: "From NYC" },

  { href: "/compare/la-ca/nyc-ny", label: "Los Angeles vs NYC", group: "From California" },
  { href: "/compare/la-ca/austin-tx", label: "Los Angeles vs Austin", group: "From California" },
  { href: "/compare/la-ca/charlotte-nc", label: "Los Angeles vs Charlotte", group: "From California" },

  { href: "/compare/austin-tx/nyc-ny", label: "Austin vs NYC", group: "From Austin" },
  { href: "/compare/austin-tx/la-ca", label: "Austin vs Los Angeles", group: "From Austin" },
  { href: "/compare/austin-tx/seattle-wa", label: "Austin vs Seattle", group: "From Austin" },

  { href: "/compare/seattle-wa/nyc-ny", label: "Seattle vs NYC", group: "From Seattle" },
  { href: "/compare/seattle-wa/austin-tx", label: "Seattle vs Austin", group: "From Seattle" },
  { href: "/compare/seattle-wa/boston-ma", label: "Seattle vs Boston", group: "From Seattle" },

  { href: "/compare/boston-ma/nyc-ny", label: "Boston vs NYC", group: "From Boston" },
  { href: "/compare/boston-ma/seattle-wa", label: "Boston vs Seattle", group: "From Boston" },
  { href: "/compare/boston-ma/miami-fl", label: "Boston vs Miami", group: "From Boston" },

  { href: "/compare/charlotte-nc/nyc-ny", label: "Charlotte vs NYC", group: "From Charlotte" },
  { href: "/compare/charlotte-nc/austin-tx", label: "Charlotte vs Austin", group: "From Charlotte" },
  { href: "/compare/charlotte-nc/miami-fl", label: "Charlotte vs Miami", group: "From Charlotte" },
];

const groupedComparisons = [
  "From NYC",
  "From California",
  "From Austin",
  "From Seattle",
  "From Boston",
  "From Charlotte",
].map((group) => ({
  group,
  items: comparisons.filter((item) => item.group === group),
}));

export const metadata: Metadata = {
  title: "City-to-City Relocation Comparisons | Cost of Living, Taxes & Take-Home Pay",
  description:
    "Compare cost of living, take-home pay, housing costs, and taxes across popular US city moves. See how relocating from NYC, LA, Austin, Seattle, Boston, or Charlotte changes your real monthly budget.",
  alternates: {
    canonical: "https://www.relocationbynumbers.com/compare",
  },
  openGraph: {
    title: "City-to-City Relocation Comparisons | Cost of Living, Taxes & Take-Home Pay",
    description:
      "Compare cost of living, take-home pay, housing costs, and taxes across popular US city moves.",
    url: "https://www.relocationbynumbers.com/compare",
    siteName: "Relocation by Numbers",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "City-to-City Relocation Comparisons | Cost of Living, Taxes & Take-Home Pay",
    description:
      "Compare cost of living, take-home pay, housing costs, and taxes across popular US city moves.",
  },
};

export default function CompareHubPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto max-w-6xl px-4 space-y-10">

        <header className="space-y-4 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            City-to-City Relocation Comparisons
          </h1>

          <p className="mt-2 text-lg font-semibold text-slate-700">
            Compare Take-Home Pay, Rent, Housing Costs &amp; Taxes Across Popular US Moves
          </p>

          <p className="mx-auto max-w-3xl text-slate-600 leading-7">
            See how cost of living, take-home pay, rent, home prices, taxes, and monthly
            affordability change when you relocate from one city to another. These pages
            compare real relocation tradeoffs — not just gross salary.
          </p>

          <p className="mx-auto max-w-2xl text-sm text-slate-500 leading-6">
            Start with a popular move below, or use the main calculator to test your own
            salary, housing, and tax assumptions side by side.
          </p>

          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link
              href="/"
              className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Open relocation calculator
            </Link>
            <Link
              href="/explore"
              className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
            >
              Explore all tools
            </Link>
          </div>
        </header>

        {/* How to use */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            How to use these city comparison pages
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="font-semibold text-slate-900">Compare take-home pay</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Look beyond gross salary and see how state income taxes and deductions
                affect your real monthly income in each city.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="font-semibold text-slate-900">Compare housing costs</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Rent, mortgage, property tax, and insurance often shift the affordability
                picture more than people expect when moving between cities.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="font-semibold text-slate-900">Find your equivalent salary</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Each comparison page estimates what salary would feel equivalent after a
                move and how much monthly breathing room could change.
              </p>
            </div>
          </div>
        </section>

        {/* Grouped comparisons */}
        <section className="space-y-6">
          {groupedComparisons.map(({ group, items }) => (
            <div
              key={group}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                {group}
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-900 transition hover:bg-white hover:shadow-sm"
                  >
                    {item.label} →
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* What changes most */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            What changes most when you move to a new city?
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="font-semibold text-slate-900">State income taxes</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Moving from a high-tax state like California or New York to a no-income-tax
                state like Texas or Florida can add thousands to your annual take-home pay.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="font-semibold text-slate-900">Rent and home prices</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Housing is usually the biggest monthly expense and the biggest variable
                between cities — especially for people planning to buy.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="font-semibold text-slate-900">Transportation costs</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Car dependence, transit access, parking, and commute costs can add
                hundreds per month in some cities compared to others.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="font-semibold text-slate-900">Monthly flexibility</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                The most important number is often the simplest: how much is left after
                essential expenses each month — and how that changes when you move.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            Frequently asked questions about city cost of living comparisons
          </h2>
          <dl className="mt-5 space-y-5 text-sm text-slate-600">
            <div>
              <dt className="font-semibold text-slate-900">
                How do you compare cost of living between two cities?
              </dt>
              <dd className="mt-1">
                Each comparison page uses your gross salary, filing status, and state tax
                rules to estimate take-home pay in both cities. It then applies city-level
                rent and cost-of-living defaults to show your estimated monthly budget,
                housing pressure, and monthly flexibility side by side.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">
                Is it cheaper to live in Austin than NYC?
              </dt>
              <dd className="mt-1">
                Generally yes — Austin has lower rent, no state income tax, and lower
                overall living costs than New York City. However, the gap depends heavily
                on your income, housing choice, and lifestyle. Use the{" "}
                <Link href="/compare/nyc-ny/austin-tx" className="text-slate-900 underline hover:no-underline">
                  NYC vs Austin comparison
                </Link>{" "}
                to see the difference based on your specific salary.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">
                What is the equivalent salary when moving from one city to another?
              </dt>
              <dd className="mt-1">
                Each comparison page calculates a "comparable salary" — the gross income
                you would need in the destination city to maintain the same monthly budget
                as your current city. This accounts for state taxes, housing costs, and
                cost-of-living differences.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">
                Which US cities have the lowest cost of living?
              </dt>
              <dd className="mt-1">
                Among major metros, Charlotte, Raleigh, Atlanta, and Dallas consistently
                rank as lower-cost alternatives to high-cost cities like New York, San
                Francisco, and Seattle. The combination of no or low state income tax and
                lower housing costs makes a significant difference. See the{" "}
                <Link href="/best-cities-for-fire" className="text-slate-900 underline hover:no-underline">
                  best cities for FIRE
                </Link>{" "}
                page for a ranked view.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">
                How does state income tax affect a city comparison?
              </dt>
              <dd className="mt-1">
                State income tax can make a significant difference in take-home pay even
                when gross salary is identical. Moving from California (up to 13.3% state
                rate) or New York to Texas or Florida (no state income tax) on a $100,000
                salary could add $6,000–$10,000+ annually to your net pay.
              </dd>
            </div>
          </dl>
        </section>

        {/* Related tools */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">
            Keep exploring relocation tools
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Compare cities, then go deeper with cost of living guides, salary calculators,
            and FIRE tools built around relocation decisions.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Open relocation calculator
            </Link>
            <Link
              href="/explore"
              className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
            >
              Explore all tools
            </Link>
            <Link
              href="/best-cities-for-fire"
              className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
            >
              Best cities for FIRE
            </Link>
            <Link
              href="/best-states-for-fire"
              className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
            >
              Best states for FIRE
            </Link>
            <Link
              href="/international-relocation-calculator"
              className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
            >
              International relocation
            </Link>
          </div>
        </section>

      </div>
    </main>
  );
}
