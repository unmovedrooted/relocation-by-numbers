import type { Metadata } from "next";
import Link from "next/link";
import ComparePicker from "@/components/ComparePicker";
import { CITIES, findCity } from "@/lib/cities";
import { buildPairExample, PAIR_EXAMPLE_SALARY } from "@/lib/pairExample";
import { ALLOWED_COMPARE_ROUTES, COMPARE_ORIGIN_HUBS } from "@/lib/seo-allowlists";

const usd = (n: number) => `${n < 0 ? "-" : ""}$${Math.abs(Math.round(n)).toLocaleString("en-US")}`;
const signed = (n: number) => `${n >= 0 ? "+" : "-"}$${Math.abs(Math.round(n)).toLocaleString("en-US")}`;

/** Every published move, with the worked example computed by the site's tax engine at one salary. Sorted by what is left after rent. */
function publishedMoves() {
  return ALLOWED_COMPARE_ROUTES.map((route) => {
    const ex = buildPairExample(route.from, route.to);
    return ex ? { ...route, ex } : null;
  })
    .filter((m): m is NonNullable<typeof m> => m !== null)
    .sort((a, b) => (b.ex.afterRentChange ?? -Infinity) - (a.ex.afterRentChange ?? -Infinity));
}

const PATTERNS = [
  {
    title: "High-cost city to lower-cost city",
    body:
      "Many of the strongest relocation comparisons involve moving from expensive coastal metros to lower-cost cities where housing pressure may fall. The real benefit often comes from monthly affordability, not just headline salary.",
  },
  {
    title: "High-tax state to lower-tax state",
    body:
      "Moves to places like Texas or Florida are often framed as tax wins, but taxes alone do not decide the result. Housing, insurance, and transportation can offset part of the gain.",
  },
  {
    title: "Renters vs future home buyers",
    body:
      "The same move can look very different depending on whether you plan to rent or buy. Home prices, property tax, insurance, and mortgage costs can change the affordability picture fast.",
  },
];

const EXAMPLES = [
  {
    title: "NYC to Charlotte",
    body:
      "This route often improves affordability mostly because housing costs are lower. For many households, that matters more than salary optics alone.",
    href: "/compare/nyc-ny/charlotte-nc",
  },
  {
    title: "Los Angeles to Austin",
    body:
      "People often treat this as a simple tax move, but the better question is whether the monthly budget actually improves once housing assumptions are included.",
    href: "/compare/la-ca/austin-tx",
  },
  {
    title: "Boston to Miami",
    body:
      "State tax differences can help, but the outcome still depends on what happens to housing, insurance, and your overall monthly spending pattern.",
    href: "/compare/boston-ma/miami-fl",
  },
];

export const metadata: Metadata = {
  title: "City-to-City Relocation Comparisons | Cost of Living, Taxes & Take-Home Pay",
  description:
    "Compare cost of living, take-home pay, housing costs, and taxes across a focused set of flagship US city moves. See how relocating between major cities changes your real monthly budget.",
  alternates: {
    canonical: "https://www.relocationbynumbers.com/compare",
  },
  openGraph: {
    title: "City-to-City Relocation Comparisons | Cost of Living, Taxes & Take-Home Pay",
    description:
      "Compare cost of living, take-home pay, housing costs, and taxes across a focused set of flagship US city moves.",
    url: "https://www.relocationbynumbers.com/compare",
    siteName: "Relocation by Numbers",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "City-to-City Relocation Comparisons | Cost of Living, Taxes & Take-Home Pay",
    description:
      "Compare cost of living, take-home pay, housing costs, and taxes across a focused set of flagship US city moves.",
  },
};

export default function CompareHubPage() {
  const moves = publishedMoves();
  const pickerCities = CITIES.map((c) => ({ id: c.id, name: c.name, state: c.state })).sort((a, b) => a.name.localeCompare(b.name));
  const origins = COMPARE_ORIGIN_HUBS.map((id) => findCity(id)).filter((c): c is NonNullable<typeof c> => !!c);
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10">
      <div className="mx-auto max-w-6xl space-y-10 px-4">
        <header className="space-y-4 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
            City-to-City Relocation Comparisons
          </h1>

          <p className="mt-2 text-lg font-semibold text-slate-700 dark:text-slate-300">
            Compare Take-Home Pay, Housing Costs &amp; Taxes Across Flagship US Moves
          </p>

          <p className="mx-auto max-w-3xl text-slate-600 dark:text-slate-400 leading-7">
            See how cost of living, take-home pay, housing costs, and monthly affordability
            change when you relocate from one city to another. This hub focuses on a smaller
            set of high-value comparisons instead of spreading across dozens of weak routes.
          </p>

          <p className="mx-auto max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            Use these pages to compare common relocation paths, understand what usually changes
            most in a move, and pressure-test whether a destination may actually improve your budget.
          </p>

          <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
            <span>Planning estimates only.</span>
            <span className="hidden sm:inline">•</span>
            <span>Results depend on salary, tax status, and housing assumptions.</span>
            <span className="hidden sm:inline">•</span>
            <Link
              href="/methodology"
              className="font-medium text-slate-700 dark:text-slate-300 underline underline-offset-4 hover:no-underline"
            >
              See methodology
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link
              href="/"
              className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              Open relocation calculator
            </Link>
            <Link
              href="/explore"
              className="inline-flex items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-900 dark:text-slate-100 transition hover:bg-slate-50 hover:dark:bg-slate-950"
            >
              Explore all tools
            </Link>
          </div>
        </header>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Compare any two cities</h2>
          <p className="mb-4 mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
            Pick where you live now and where you are thinking of moving. The {moves.length} moves below have their own pages; any other pair opens the calculator with both cities filled in.
          </p>
          <ComparePicker
            cities={pickerCities}
            livePairs={ALLOWED_COMPARE_ROUTES.map((r) => ({ from: r.from, to: r.to }))}
            salary={PAIR_EXAMPLE_SALARY}
            defaultFrom="nyc-ny"
            defaultTo="charlotte-nc"
          />
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            The {moves.length} flagship moves at {usd(PAIR_EXAMPLE_SALARY)} a year
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-400">
            One single filer on the same salary in both cities, after federal, state and local income tax and typical rent. Sorted by how much more or less is left after rent each month.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[40rem] text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <th className="pb-2 pr-3">Move</th>
                  <th className="pb-2 pr-3 text-right">Take-home change</th>
                  <th className="pb-2 pr-3 text-right">Typical rent change</th>
                  <th className="pb-2 text-right">Left after rent</th>
                </tr>
              </thead>
              <tbody className="text-slate-700 dark:text-slate-300">
                {moves.map((m) => (
                  <tr key={`${m.from}-${m.to}`} className="border-t border-slate-200 dark:border-slate-800">
                    <td className="py-2 pr-3 font-medium">
                      <Link href={`/compare/${m.from}/${m.to}`} className="underline underline-offset-4 hover:no-underline">
                        {m.ex.from.name} to {m.ex.to.name}
                      </Link>
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums">{signed(m.ex.monthlyNetChange)} a month</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{m.ex.rentChange !== null ? `${signed(m.ex.rentChange)} a month` : "n/a"}</td>
                    <td className="py-2 text-right font-semibold tabular-nums">{m.ex.afterRentChange !== null ? `${signed(m.ex.afterRentChange)} a month` : "n/a"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs leading-6 text-slate-500 dark:text-slate-400">
            Computed with the site&apos;s 2026 tax engine (standard deduction, no 401(k) contribution). Rents are the U.S. Census Bureau&apos;s medians for each city
            (American Community Survey). Planning estimates, not tax advice. Your own salary and housing change these numbers, so open a move and enter yours.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Start from where you live</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
            Each origin page shows the same salary in popular destinations side by side.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {origins.map((o) => (
              <Link
                key={o.id}
                href={`/compare/${o.id}`}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-4 text-sm font-semibold text-slate-900 dark:text-slate-100 transition hover:bg-slate-100 dark:hover:bg-slate-900"
              >
                Moving from {o.name} →
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              What these city comparison pages are built to show
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400 sm:text-base">
              These comparison pages are designed to help you look past headline salary and
              focus on what a move may actually do to your budget. Instead of comparing cities
              only by broad cost-of-living rankings, the pages estimate how taxes, housing,
              and monthly flexibility may change across a specific route.
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400 sm:text-base">
              That matters because the same move can look very different depending on your
              income, filing status, and housing assumptions. A city with lower taxes is not
              automatically the better choice if rent, home prices, insurance, or other core
              costs rise enough to offset the benefit.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Compare take-home pay</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                Look beyond gross salary and see how state income taxes and deductions may
                affect your real monthly income in each city.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Compare housing pressure</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                Rent, mortgage, property tax, and insurance often change the affordability
                picture more than people expect when moving between cities.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Estimate comparable salary</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                Each comparison page helps estimate what salary may feel equivalent after a
                move once taxes and housing costs are considered together.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Common relocation patterns people compare most
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-400 sm:text-base">
            The strongest city-to-city searches usually follow a few predictable patterns.
            Understanding those patterns helps you read comparison pages more intelligently
            instead of focusing on one number in isolation.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {PATTERNS.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4"
              >
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Example relocation tradeoffs
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-400 sm:text-base">
            These quick examples show why a move should be evaluated as a full budget decision,
            not just a tax decision or a salary decision.
          </p>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {EXAMPLES.map((item) => (
              <div
                key={item.href}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-5"
              >
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{item.body}</p>
                <div className="mt-4">
                  <Link
                    href={item.href}
                    className="text-sm font-semibold text-slate-900 dark:text-slate-100 underline underline-offset-4 hover:no-underline"
                  >
                    Explore this comparison
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            What changes most when you move to a new city?
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">State income taxes</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                Moving from a high-tax state to a lower-tax state can improve take-home pay,
                but it does not automatically create a better overall budget.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Rent and home prices</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                Housing is usually the biggest monthly expense and often the biggest reason a
                move either helps or hurts affordability.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Transportation costs</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                Car dependence, parking, commute patterns, and transit access can change the
                real monthly cost of living more than people expect.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Monthly flexibility</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                The most important question is usually simple: how much is left after essential
                costs each month, and does the move improve that number?
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Frequently asked questions about city cost of living comparisons
          </h2>
          <dl className="mt-5 space-y-5 text-sm text-slate-600 dark:text-slate-400">
            <div>
              <dt className="font-semibold text-slate-900 dark:text-slate-100">
                How do you compare cost of living between two cities?
              </dt>
              <dd className="mt-1">
                Each comparison page uses your gross salary, filing status, and state tax
                rules to estimate take-home pay in both cities. It then applies city-level
                housing and cost assumptions to show your estimated monthly budget and
                flexibility side by side.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900 dark:text-slate-100">
                What is the equivalent salary when moving from one city to another?
              </dt>
              <dd className="mt-1">
                Each comparison page estimates a comparable salary, the gross income you may
                need in the destination city to maintain a similar monthly budget once taxes,
                housing costs, and core living costs are considered.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900 dark:text-slate-100">
                Why can a lower-tax city still feel expensive?
              </dt>
              <dd className="mt-1">
                Because taxes are only one part of the move. Rent, home prices, insurance,
                transportation, and other recurring costs can absorb part of the tax benefit.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900 dark:text-slate-100">
                Which US cities are common lower-cost alternatives to high-cost metros?
              </dt>
              <dd className="mt-1">
                Charlotte, Dallas, Austin, and similar cities are often compared against
                higher-cost metros like New York, Los Angeles, Boston, and Seattle because the
                housing and tax mix can create meaningful affordability differences.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900 dark:text-slate-100">
                Are these pages meant to replace exact personal budgeting?
              </dt>
              <dd className="mt-1">
                No. These pages are planning tools. They are most useful for comparing the
                direction and scale of a move before you plug in your own exact housing,
                salary, and household details.
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Keep exploring relocation tools
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
            Compare cities, then go deeper with the main relocation calculator and other
            relocation planning tools.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              Open relocation calculator
            </Link>
            <Link
              href="/explore"
              className="inline-flex items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-900 dark:text-slate-100 transition hover:bg-slate-50 hover:dark:bg-slate-950"
            >
              Explore all tools
            </Link>
            <Link
              href="/methodology"
              className="inline-flex items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-900 dark:text-slate-100 transition hover:bg-slate-50 hover:dark:bg-slate-950"
            >
              View methodology
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}