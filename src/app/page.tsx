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

const EXAMPLES = [
  {
    title: "NYC to Charlotte",
    body:
      "A move like New York City to Charlotte often improves affordability through lower housing costs more than salary alone. For many households, the biggest shift is not just taxes — it is how much monthly pressure drops once rent or mortgage costs come down.",
    href: "/compare/nyc-ny/charlotte-nc",
  },
  {
    title: "Los Angeles to Austin",
    body:
      "This move often gets framed as a tax win, but the real answer depends on whether you rent or buy, whether you keep the same income, and how your housing costs change. Lower taxes can help, but they do not automatically create a better monthly budget.",
    href: "/compare/la-ca/austin-tx",
  },
  {
    title: "Boston to Miami",
    body:
      "A move from Boston to Miami can look attractive because of state tax differences, but insurance, housing assumptions, and lifestyle costs still matter. The calculator helps show whether the gain is real in your monthly budget or just sounds good on paper.",
    href: "/compare/boston-ma/miami-fl",
  },
];

export default function Page() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900 dark:from-slate-950 dark:to-slate-900 dark:text-slate-100">
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

          <div className="mx-auto mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm">
            <Link
              href="/methodology"
              className="font-medium text-slate-600 underline decoration-slate-300 underline-offset-4 transition hover:text-slate-900 dark:text-slate-300 dark:decoration-slate-600 dark:hover:text-white"
            >
              See methodology and data sources
            </Link>
            <span className="hidden text-slate-300 sm:inline">•</span>
            <span className="text-slate-500 dark:text-slate-400">
              Planning estimates only. Results depend on salary, tax status, and housing assumptions.
            </span>
          </div>

          <div className="mx-auto mt-6 h-1 w-16 rounded-full bg-blue-600/80" />
        </div>
      </header>

      <section className="mx-auto max-w-5xl space-y-10 px-4 pb-12 sm:px-6">
        <Calculator monetization="home" />

        <div className="text-center text-xs text-slate-500 dark:text-slate-400">
          Assumptions updated: March 2026
        </div>

        {process.env.NEXT_PUBLIC_ADSENSE_SLOT_TOP ? (
          <section className="">
        
          </section>
        ) : null}

        {/* How it works */}
        <section className="rounded-2xl bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800">
          <div className="max-w-3xl">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white sm:text-xl">
              How this relocation calculator actually works
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
              This calculator estimates how your money changes when you move from one state to another.
              It starts with your gross annual salary, applies federal and state income tax rules, then
              compares housing and monthly cost differences so you can see what your income may actually
              feel like after a move.
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
              Instead of only showing headline salary, the calculator focuses on practical tradeoffs:
              how much take-home pay changes after taxes, how much housing costs shift, and how much
              monthly flexibility you may gain or lose after essential expenses.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
              <h3 className="font-semibold text-slate-900 dark:text-white">Taxes</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Compares estimated federal and state income tax impact so you can see how identical
                salaries can produce different take-home pay in different states.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
              <h3 className="font-semibold text-slate-900 dark:text-white">Housing pressure</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Looks at rent and housing-related affordability differences because housing is usually
                the biggest monthly expense people underestimate when relocating.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
              <h3 className="font-semibold text-slate-900 dark:text-white">Monthly flexibility</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Focuses on what may be left after essential costs. That matters more than raw salary
                because a higher paycheck can still leave you with less room in your budget.
              </p>
            </div>
          </div>
        </section>

        {/* What changes most */}
        <section className="rounded-2xl bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white sm:text-xl">
            What changes most when you move to another state
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
            Most relocation decisions are driven by a few major cost categories, but people often
            overfocus on salary and underfocus on everything around it. These are the variables that
            usually change the result most.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
              <h3 className="font-semibold text-slate-900 dark:text-white">State income tax</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Moving from a high-tax state to a no-income-tax state can improve take-home pay,
                but that does not automatically make the move cheaper overall.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
              <h3 className="font-semibold text-slate-900 dark:text-white">Housing costs</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                For most households, housing is still the biggest lever. A lower-tax state with
                higher rent, home prices, insurance, or property tax can erase part of the benefit.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
              <h3 className="font-semibold text-slate-900 dark:text-white">Renting vs buying</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                The same move can look very different depending on whether you plan to rent or buy.
                Ownership costs can shift the affordability math fast.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
              <h3 className="font-semibold text-slate-900 dark:text-white">Monthly breathing room</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                The real question is not whether a destination sounds cheaper. It is whether the
                move leaves you with more room each month after essential costs are covered.
              </p>
            </div>
          </div>
        </section>

        {/* Example scenarios */}
        <section className="rounded-2xl bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white sm:text-xl">
            Example relocation scenarios
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
            These examples show why relocation decisions cannot be reduced to one number. Taxes,
            housing, and take-home pay interact differently depending on the move.
          </p>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {EXAMPLES.map((item) => (
              <div
                key={item.href}
                className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950"
              >
                <h3 className="font-semibold text-slate-900 dark:text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {item.body}
                </p>
                <div className="mt-4">
                  <Link
                    href={item.href}
                    className="text-sm font-semibold text-slate-900 underline underline-offset-4 hover:no-underline dark:text-white"
                  >
                    Explore this comparison
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-5 text-xs leading-6 text-slate-500 dark:text-slate-400">
            These are planning examples, not guarantees. Your results depend on salary, filing
            status, and housing assumptions.
          </p>
        </section>

        {/* What this tool includes */}
        <section className="rounded-2xl bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white sm:text-xl">
            What this tool includes — and what it does not
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-emerald-200/70 bg-emerald-50 p-5 dark:border-emerald-900/60 dark:bg-emerald-950/30">
              <h3 className="font-semibold text-slate-900 dark:text-white">Included in the estimate</h3>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
                <li>Estimated federal and state income tax differences</li>
                <li>Housing-related affordability differences</li>
                <li>Monthly budget comparison between states</li>
                <li>Relocation impact based on where income may stretch further</li>
              </ul>
            </div>

            <div className="rounded-xl border border-amber-200/70 bg-amber-50 p-5 dark:border-amber-900/60 dark:bg-amber-950/30">
              <h3 className="font-semibold text-slate-900 dark:text-white">Not fully modeled</h3>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
                <li>Neighborhood-specific rent differences</li>
                <li>Childcare and school decisions</li>
                <li>Private health insurance variation</li>
                <li>One-time moving costs and closing costs</li>
                <li>Detailed local tax edge cases or employer-specific deductions</li>
              </ul>
            </div>
          </div>

          <p className="mt-5 text-sm leading-7 text-slate-600 dark:text-slate-300">
            This tool is built for planning, not perfect prediction. It is most useful for comparing
            the direction and scale of a move before you commit, then pressure-testing your decision
            with your own real housing and income numbers.
          </p>
        </section>

        {/* Popular comparisons */}
        <section className="rounded-2xl bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white sm:text-xl">
              Popular state-to-state relocation comparisons
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 sm:text-base">
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
                className="text-sm font-semibold text-slate-700 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              >
                Explore all relocation comparisons →
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="rounded-2xl bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white sm:text-xl">
            Frequently asked questions
          </h2>
          <dl className="mt-5 space-y-5 text-sm text-slate-600 dark:text-slate-300">
            <div>
              <dt className="font-semibold text-slate-900 dark:text-white">
                Why can a higher salary still leave you with less money after a move?
              </dt>
              <dd className="mt-1">
                Because gross income is only part of the picture. A raise can be offset by
                higher state taxes, more expensive housing, insurance, or other recurring costs.
                That is why this calculator compares take-home pay and monthly affordability,
                not just salary.
              </dd>
            </div>
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
                How do taxes and housing interact in this calculator?
              </dt>
              <dd className="mt-1">
                The calculator first estimates after-tax income, then compares how housing and
                essential expenses affect your monthly budget in each location. A lower-tax state
                can still feel tighter if housing costs rise enough to absorb the tax savings.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900 dark:text-white">
                Is it worth moving from a high-tax state to a low-tax state?
              </dt>
              <dd className="mt-1">
                Sometimes, but not automatically. Moving from California or New York to Texas or
                Florida can improve take-home pay, but higher housing, insurance, or property tax
                in the destination can offset part of the gain. The better move depends on your
                actual budget, not just the tax headline.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900 dark:text-white">
                What does this relocation calculator help me decide?
              </dt>
              <dd className="mt-1">
                It helps you pressure-test whether a move may improve affordability, reduce housing
                pressure, or change how far your salary stretches. It is most useful for comparing
                tradeoffs before you relocate, renegotiate salary, or choose between two states.
              </dd>
            </div>
          </dl>
        </section>

        {/* Explore more tools */}
        <section className="rounded-2xl bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800 text-center">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white sm:text-xl">
            Explore more relocation tools
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 sm:text-base">
            Browse calculators, salary tools, cost of living pages, and comparison pages in one place.
          </p>
          <div className="mt-5">
            <Link
              href="/explore"
              className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Explore All Tools
            </Link>
          </div>
        </section>

        {/* Lower-priority cross-sells */}
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-emerald-200/60 bg-emerald-50 p-5 dark:border-emerald-900/60 dark:bg-emerald-950/30">
            <div className="text-sm font-semibold text-slate-900 dark:text-white">
              Thinking bigger than just moving?
            </div>
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
              See how relocation may change your FIRE timeline after taxes, spending, and housing costs.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Link
                href="/fire-calculator"
                className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                🔥 Calculate My FIRE Timeline
              </Link>
              <Link
                href="/best-states-for-fire"
                className="text-sm font-semibold text-slate-700 underline underline-offset-4 hover:no-underline dark:text-slate-300"
              >
                Best states for FIRE
              </Link>
            </div>
          </section>

          <section className="rounded-2xl border border-sky-200/60 bg-sky-50 p-5 dark:border-sky-900/60 dark:bg-sky-950/30">
            <div className="text-sm font-semibold text-slate-900 dark:text-white">
              Planning a move abroad?
            </div>
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
              Compare taxes, rent, living costs, and take-home pay across countries before you relocate.
            </p>
            <div className="mt-3">
              <Link
                href="/international-relocation"
                className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Explore International Relocation →
              </Link>
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
