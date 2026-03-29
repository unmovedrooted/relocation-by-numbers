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

export const metadata = {
  title: "City Cost of Living and Relocation Comparisons | Relocation by Numbers",
  description:
    "Compare cost of living, take-home pay, housing costs, and salary needs across popular city-to-city moves. Explore relocation comparisons by city.",
};

export default function CompareHubPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto max-w-6xl px-4 space-y-10">
        <header className="space-y-4 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Popular Relocation Comparisons
          </h1>

   <p className="mx-auto max-w-6xl text-slate-600 leading-7">
  Compare city-to-city moves and see how take-home pay, rent, home prices, taxes, and monthly affordability
  <br className="hidden md:block" />
  can change when you relocate. These pages are built to help you compare real relocation tradeoffs instead of looking at salary alone.
</p>

          <p className="mx-auto max-w-4xl text-sm text-slate-500 leading-6 lg:whitespace-nowrap">
  Start with a popular move below, or use the main calculator to test your own
  salary, housing, and tax assumptions side by side.
</p>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            How to use these comparison pages
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="font-semibold text-slate-900">Compare take-home pay</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Look beyond gross salary and compare how taxes and deductions can affect
                real monthly income in each location.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="font-semibold text-slate-900">Compare housing pressure</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Rent, mortgage cost, property tax, and insurance can shift the full
                affordability picture more than people expect.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="font-semibold text-slate-900">Check salary tradeoffs</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Use the comparison pages to estimate what salary may feel equivalent
                after a move and how much monthly breathing room could change.
              </p>
            </div>
          </div>
        </section>

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
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-900 transition hover:bg-white"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            What changes most when you move?
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="font-semibold text-slate-900">Taxes</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                State income taxes can materially change take-home pay even when gross
                salary stays the same.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="font-semibold text-slate-900">Housing</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Rent and home prices often create the biggest difference between two
                cities, especially for people planning to buy.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="font-semibold text-slate-900">Transportation</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Car dependence, transit access, parking, and commute costs can all
                affect what a move really feels like month to month.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="font-semibold text-slate-900">Monthly flexibility</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                The biggest question is often simple: how much money is left after the
                essentials are paid each month?
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">
            Keep exploring related tools
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Compare cities, then go deeper with cost-of-living pages, salary-needed
            pages, and FIRE tools built around relocation decisions.
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Open calculator
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
          </div>
        </section>
      </div>
    </main>
  );
}