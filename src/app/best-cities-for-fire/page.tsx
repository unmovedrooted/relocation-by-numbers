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
  { name: "New York City, NY", href: "/compare/nyc-ny/charlotte-nc", dest: "Charlotte, NC" },
  { name: "New York City, NY", href: "/compare/nyc-ny/austin-tx", dest: "Austin, TX" },
  { name: "Los Angeles, CA", href: "/compare/la-ca/charlotte-nc", dest: "Charlotte, NC" },
  { name: "Los Angeles, CA", href: "/compare/la-ca/austin-tx", dest: "Austin, TX" },
  { name: "Seattle, WA", href: "/compare/seattle-wa/charlotte-nc", dest: "Charlotte, NC" },
  { name: "Boston, MA", href: "/compare/boston-ma/charlotte-nc", dest: "Charlotte, NC" },
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
      <div className="mx-auto max-w-5xl space-y-10 px-4 py-10">
        <header className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Best Cities for FIRE
          </h1>

          <p className="text-lg font-semibold text-slate-200">
            Which US Cities Are Best for Financial Independence &amp; Early Retirement?
          </p>

          <p className="max-w-3xl leading-relaxed text-slate-300">
            For most people pursuing FIRE, the biggest lever is{" "}
            <span className="font-semibold text-white">expenses</span>. Moving to a
            lower-cost city can reduce your FIRE number directly and shorten the path
            to financial independence by years.
          </p>

          <p className="max-w-3xl text-sm leading-6 text-slate-400">
            At a 4% withdrawal rate, every $12,000 reduction in annual spending lowers
            the required portfolio by $300,000. That is why city choice can matter so
            much for early retirement math.
          </p>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-slate-400">
            <span>Assumptions updated: March 2026</span>
            <span className="hidden sm:inline">•</span>
            <Link href="/methodology" className="underline underline-offset-4 hover:no-underline">
              See methodology
            </Link>
          </div>
        </header>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold">
            How this page evaluates FIRE-friendly cities
          </h2>

          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-300">
            <p>
              There is no single best city for everyone pursuing financial independence.
              A FIRE-friendly city is usually one where your recurring costs stay low enough
              relative to your income that you can both save faster and retire on a smaller portfolio.
            </p>

            <p>
              Relocation by Numbers looks at the practical variables that tend to matter most:
              housing costs, tax burden, take-home pay, and how much monthly flexibility is left
              after essential expenses. In other words, the site focuses less on vague rankings and
              more on how a city may change the actual math.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold">
            What tends to improve a FIRE timeline most
          </h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="font-semibold text-white">Lower housing costs</div>
              <p className="mt-1 text-sm leading-6 text-slate-400">
                Housing is the biggest monthly expense for most households. Lower rent or lower ownership costs
                directly reduce the spending your portfolio needs to support.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="font-semibold text-white">Lower tax drag</div>
              <p className="mt-1 text-sm leading-6 text-slate-400">
                Lower or no state income tax can increase take-home pay and improve how much of your income
                is available for investing.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="font-semibold text-white">Remote work leverage</div>
              <p className="mt-1 text-sm leading-6 text-slate-400">
                One of the strongest FIRE setups is keeping a higher salary while relocating to a lower-cost city.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="font-semibold text-white">Lifestyle fit</div>
              <p className="mt-1 text-sm leading-6 text-slate-400">
                A city is only FIRE-friendly if you can actually sustain the lifestyle there. Lower costs are useful,
                but only if the place works for your real life.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-xl font-semibold">
            Popular high-cost to lower-cost city comparisons
          </h2>
          <p className="text-sm text-slate-400">
            Start with a common relocation path. Each page compares take-home pay, housing costs,
            taxes, and monthly affordability side by side.
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
                There is no universal winner. The best city for FIRE is the one where your
                recurring expenses stay lowest relative to your income while still fitting your life.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-white">
                How much does moving to a cheaper city reduce my FIRE number?
              </dt>
              <dd className="mt-1">
                At a 4% withdrawal rate, every $1,000 reduction in annual spending reduces your
                FIRE number by $25,000. That is why housing changes can have such a large effect.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-white">
                Can I reach FIRE faster by moving without changing my income?
              </dt>
              <dd className="mt-1">
                Yes. For remote workers, this can be one of the strongest strategies available
                because it raises savings rate and lowers the portfolio target at the same time.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-white">
                What types of cities tend to be more FIRE-friendly?
              </dt>
              <dd className="mt-1">
                Cities with lower housing costs, manageable taxes, and good income retention tend
                to be stronger candidates than high-cost cities that absorb too much of each paycheck.
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-white/10 bg-black/20 p-5 space-y-3">
          <h2 className="text-lg font-semibold">Next step</h2>
          <p className="text-sm text-slate-300">
            Use the relocation calculator to estimate your post-move expenses, then plug that number
            into the FIRE calculator’s <span className="font-semibold text-white">Move Impact</span> tab
            to see how many years relocating could save on your timeline.
          </p>
          <div className="mt-2 flex flex-wrap gap-3">
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
            <span>•</span>
            <Link href="/methodology" className="transition hover:text-white">Methodology</Link>
          </div>
        </footer>
      </div>
    </main>
  );
}