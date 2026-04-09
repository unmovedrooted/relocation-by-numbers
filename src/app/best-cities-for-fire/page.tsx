import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Best Cities for FIRE | Compare Cost of Living & Early Retirement Timelines",
  description:
    "Find the best US cities for financial independence and early retirement. Compare housing costs, taxes, and how moving to a lower-cost city could shorten your FIRE timeline.",
  alternates: {
    canonical: "https://www.relocationbynumbers.com/best-cities-for-fire",
  },
  openGraph: {
    title: "Best Cities for FIRE | Compare Cost of Living & Early Retirement Timelines",
    description:
      "Find the best US cities for financial independence and early retirement. Compare housing costs, taxes, and how moving to a lower-cost city could shorten your FIRE timeline.",
    url: "https://www.relocationbynumbers.com/best-cities-for-fire",
    siteName: "Relocation by Numbers",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Best Cities for FIRE | Compare Cost of Living & Early Retirement Timelines",
    description:
      "Find the best US cities for financial independence and early retirement. Compare housing costs, taxes, and FIRE timelines.",
  },
};

const CITY_STARTERS = [
  { name: "New York City, NY", href: "/compare/nyc-ny/raleigh-nc", dest: "Raleigh, NC" },
  { name: "San Francisco, CA", href: "/compare/sf-ca/austin-tx", dest: "Austin, TX" },
  { name: "Boston, MA", href: "/compare/boston-ma/charlotte-nc", dest: "Charlotte, NC" },
  { name: "Seattle, WA", href: "/compare/seattle-wa/denver-co", dest: "Denver, CO" },
  { name: "Los Angeles, CA", href: "/compare/la-ca/phoenix-az", dest: "Phoenix, AZ" },
  { name: "Chicago, IL", href: "/compare/chicago-il/dallas-tx", dest: "Dallas, TX" },
];

const CITY_PAGES = [
  { href: "/best-cities-for-fire/charlotte-nc", label: "FIRE in Charlotte, NC" },
  { href: "/best-cities-for-fire/austin-tx", label: "FIRE in Austin, TX" },
  { href: "/best-cities-for-fire/miami-fl", label: "FIRE in Miami, FL" },
  { href: "/best-cities-for-fire/atlanta-ga", label: "FIRE in Atlanta, GA" },
  { href: "/best-cities-for-fire/denver-co", label: "FIRE in Denver, CO" },
  { href: "/best-cities-for-fire/seattle-wa", label: "FIRE in Seattle, WA" },
  { href: "/best-cities-for-fire/nyc-ny", label: "FIRE in New York City" },
];

export default function Page() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-10">

        <header className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Best Cities for FIRE
          </h1>

          <p className="mt-2 text-lg font-semibold text-slate-200">
            Which US Cities Are Best for Financial Independence &amp; Early Retirement?
          </p>

          <p className="leading-relaxed text-slate-300 max-w-2xl">
            For most people pursuing FIRE, the biggest lever is{" "}
            <span className="font-semibold text-white">expenses</span>. Moving to a
            lower cost-of-living city directly reduces your FIRE number and can shorten
            your timeline to financial independence by years. At a 4% withdrawal rate,
            every $12,000 reduction in annual spending lowers your FIRE number by
            $300,000.
          </p>

          <p className="text-sm text-slate-400 max-w-2xl">
            The best city for FIRE depends on your income, remote work flexibility,
            and lifestyle priorities. Use the comparisons below to see how moving from
            a high-cost city to a lower-cost alternative could change your monthly
            budget and FIRE timeline.
          </p>

          <div className="text-xs text-slate-400">Assumptions updated: March 2026</div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Link
              href="/"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
            >
              Compare cities →
            </Link>
            <Link
              href="/fire-calculator"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
            >
              FIRE calculator →
            </Link>
            <Link
              href="/best-states-for-fire"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
            >
              Best states for FIRE →
            </Link>
            <Link
              href="/explore"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
            >
              Explore all tools →
            </Link>
          </div>
        </header>

        {/* Quick comparisons */}
        <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-xl font-semibold">
            Popular high-cost to lower-cost city comparisons
          </h2>
          <p className="text-sm text-slate-400">
            Start with a common relocation path, then swap cities to match your situation.
            Each page compares take-home pay, housing costs, taxes, and monthly affordability
            side by side.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {CITY_STARTERS.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className="rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:bg-white/10"
              >
                <div className="text-sm font-semibold text-white">
                  {c.name} → {c.dest}
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  Compare take-home pay, rent &amp; taxes →
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* City FIRE pages */}
        <section className="space-y-4 rounded-2xl border border-white/10 bg-black/20 p-5">
          <h2 className="text-xl font-semibold">
            Can you FIRE in these cities?
          </h2>
          <p className="text-sm text-slate-400">
            Explore city-specific FIRE pages covering housing costs, salary targets,
            and financial independence timelines.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CITY_PAGES.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                {c.label} →
              </Link>
            ))}
          </div>
        </section>

        {/* What makes a city good for FIRE */}
        <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-xl font-semibold">
            What makes a city good for FIRE?
          </h2>
          <div className="space-y-3 leading-relaxed text-slate-300 text-sm">
            <p>
              There is no single best city for everyone pursuing financial independence.
              But cities that help people reach FIRE faster tend to share a few common traits:
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="font-semibold text-white">Low housing costs</div>
                <p className="mt-1 text-xs text-slate-400">
                  Rent and home prices are the biggest monthly expense for most people.
                  Lower housing directly reduces your FIRE number and frees up savings.
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="font-semibold text-white">Low or no state income tax</div>
                <p className="mt-1 text-xs text-slate-400">
                  No state income tax means more of each paycheck goes toward your
                  portfolio. Nine states currently have no personal income tax.
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="font-semibold text-white">Remote work compatibility</div>
                <p className="mt-1 text-xs text-slate-400">
                  The biggest FIRE wins come when you keep a high income while reducing
                  costs. Remote work makes this possible across a much wider range of cities.
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="font-semibold text-white">Quality of life fit</div>
                <p className="mt-1 text-xs text-slate-400">
                  A lower-cost city only helps if you actually want to live there.
                  Lifestyle fit matters for both the journey and retirement itself.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-5">
          <h2 className="text-xl font-semibold">
            Frequently asked questions about FIRE and city choice
          </h2>
          <dl className="space-y-5 text-sm text-slate-300">
            <div>
              <dt className="font-semibold text-white">
                Which US city is best for FIRE?
              </dt>
              <dd className="mt-1">
                It depends on your income and lifestyle. Cities like Charlotte, Raleigh,
                and Austin frequently come up as FIRE-friendly because they combine
                relatively low housing costs with no state income tax (Texas) or low
                tax rates (North Carolina). But the best city for FIRE is the one
                where your expenses are lowest relative to your income.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-white">
                How much does moving to a cheaper city reduce my FIRE number?
              </dt>
              <dd className="mt-1">
                At a 4% withdrawal rate, every $1,000 reduction in annual spending
                reduces your FIRE number by $25,000. Moving from a city with $4,000/mo
                rent to one with $1,800/mo rent saves $26,400 per year — reducing your
                FIRE number by $660,000 and accelerating both savings and the target.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-white">
                Can I reach FIRE faster by moving without changing my income?
              </dt>
              <dd className="mt-1">
                Yes — and for remote workers this is one of the most powerful strategies
                available. Moving to a lower-cost city while keeping the same salary
                simultaneously increases your savings rate and reduces your FIRE number.
                Use the Move Impact tab in the FIRE calculator to model your specific
                scenario.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-white">
                What is the cheapest major US city to retire early in?
              </dt>
              <dd className="mt-1">
                Among major metros, cities in the Southeast and South — including
                Charlotte, Raleigh, Atlanta, and Oklahoma City — consistently rank
                among the most affordable for both rent and overall cost of living.
                Texas cities like Austin and Dallas also rank well due to no state
                income tax, though housing costs have risen in recent years.
              </dd>
            </div>
          </dl>
        </section>

        {/* Next step */}
        <section className="rounded-2xl border border-white/10 bg-black/20 p-5 space-y-3">
          <h2 className="text-lg font-semibold">Next step</h2>
          <p className="text-slate-300 text-sm">
            Use the relocation calculator to estimate your post-move expenses, then
            plug that number into the FIRE calculator's{" "}
            <span className="font-semibold text-white">Move Impact</span> tab to see
            how many years relocating could save on your FIRE timeline.
          </p>
          <div className="flex flex-wrap gap-3 mt-2">
            <Link
              href="/"
              className="inline-flex items-center rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:opacity-90"
            >
              Compare cities →
            </Link>
            <Link
              href="/fire-calculator"
              className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
            >
              Open FIRE calculator
            </Link>
            <Link
              href="/best-states-for-fire"
              className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
            >
              Best states for FIRE
            </Link>
          </div>
        </section>

        <footer className="pt-2">
          <div className="mb-3 text-xs text-slate-400">Assumptions updated: March 2026</div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
            <Link href="/about" className="transition hover:text-white">About</Link>
            <span>•</span>
            <Link href="/disclaimer" className="transition hover:text-white">Disclaimer</Link>
            <span>•</span>
            <Link href="/privacy" className="transition hover:text-white">Privacy</Link>
            <span>•</span>
            <Link href="/terms" className="transition hover:text-white">Terms</Link>
          </div>
        </footer>

      </div>
    </main>
  );
}
