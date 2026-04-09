import type { Metadata } from "next";
import { STATES, type StateCode } from "@/lib/states";
import { citiesForState } from "@/lib/cities";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Best States for FIRE | Lowest Cost of Living & Taxes for Early Retirement",
  description:
    "Discover the best US states for financial independence and early retirement. Ranked by housing costs and tax burden — see which states let your money go furthest.",
  alternates: {
    canonical: "https://www.relocationbynumbers.com/best-states-for-fire",
  },
  openGraph: {
    title: "Best States for FIRE | Lowest Cost of Living & Taxes for Early Retirement",
    description:
      "Discover the best US states for financial independence and early retirement. Ranked by housing costs and tax burden — see which states let your money go furthest.",
    url: "https://www.relocationbynumbers.com/best-states-for-fire",
    siteName: "Relocation by Numbers",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Best States for FIRE | Lowest Cost of Living & Taxes for Early Retirement",
    description:
      "The best US states for financial independence and early retirement, ranked by housing costs and tax burden.",
  },
};

const NO_INCOME_TAX_STATES: StateCode[] = [
  "ak", "fl", "nv", "nh", "sd", "tn", "tx", "wa", "wy",
];

function scoreState(code: StateCode) {
  const cities = citiesForState(code);
  if (!cities.length) return 0;
  return cities.reduce((sum, c) => sum + (c.defaultRent ?? 0), 0) / cities.length;
}

export default function Page() {
  const ranked = STATES
    .map((s) => ({
      ...s,
      score: scoreState(s.code),
      noIncomeTax: NO_INCOME_TAX_STATES.includes(s.code),
    }))
    .filter((s) => s.score > 0)
    .sort((a, b) => a.score - b.score)
    .slice(0, 10);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-4xl px-4 py-10 space-y-8">

        <header className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Best States for FIRE
          </h1>

          <p className="mt-2 text-lg font-semibold text-slate-200">
            Lowest Cost of Living &amp; Taxes for Financial Independence &amp; Early Retirement
          </p>

          <p className="text-slate-300 max-w-2xl">
            Lower housing costs and state income taxes can dramatically shorten your path
            to financial independence. States with low average rent reduce your FIRE number
            directly — and states with no income tax increase how much of each paycheck you
            keep along the way.
          </p>

          <p className="text-sm text-slate-400 max-w-2xl">
            This ranking is based on average rent across major cities in each state.
            Lower rent means a lower monthly spending target, a smaller FIRE number, and
            a faster timeline to financial independence.
          </p>

          <div className="flex flex-wrap gap-2 pt-1">
            <Link
              href="/fire-calculator"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
            >
              FIRE calculator →
            </Link>
            <Link
              href="/best-cities-for-fire"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
            >
              Best cities for FIRE →
            </Link>
            <Link
              href="/explore"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
            >
              Explore all tools →
            </Link>
          </div>
        </header>

        {/* Rankings */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">
            Top 10 states for FIRE by average housing cost
          </h2>

          <div className="space-y-3">
            {ranked.map((state, i) => (
              <div
                key={state.code}
                className="rounded-xl border border-white/10 bg-white/5 p-4 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-400 w-6">
                    #{i + 1}
                  </span>
                  <div>
                    <div className="font-semibold text-white">{state.name}</div>
                    <div className="mt-0.5 flex flex-wrap gap-2 text-xs text-slate-400">
                      <span>
                        Avg rent ~${Math.round(state.score).toLocaleString()}/mo
                      </span>
                      {state.noIncomeTax && (
                        <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-emerald-300">
                          No income tax
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <Link
                  href={`/best-states-for-fire/${state.name.toLowerCase().replace(/\s/g, "-")}`}
                  className="shrink-0 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-emerald-300 hover:bg-white/10"
                >
                  View state →
                </Link>
              </div>
            ))}
          </div>

          <p className="text-xs text-slate-500 pt-1">
            Ranked by average rent across major cities in each state. Lower rent = lower FIRE
            number. Income tax status is based on current state tax law.
          </p>
        </section>

        {/* Why it matters */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
          <h2 className="text-xl font-semibold">
            Why your state matters for financial independence
          </h2>
          <div className="space-y-3 text-sm leading-7 text-slate-300">
            <p>
              Your FIRE number is based on annual spending. If you live in a lower-cost
              state, your annual expenses are lower — which means a smaller portfolio target
              and potentially years shaved off your timeline. At a 4% withdrawal rate, every
              $1,000 reduction in annual spending reduces your FIRE number by $25,000.
            </p>
            <p>
              State income tax adds a second dimension. Moving from a high-tax state like
              California or New York to a no-income-tax state like Texas, Florida, or Nevada
              can add thousands to your annual savings rate — directly accelerating both
              accumulation and lowering the income you need in retirement.
            </p>
            <p>
              The most FIRE-friendly states tend to combine relatively low housing costs with
              low or no state income tax. Use the FIRE calculator to model how a specific
              state move could change your personal timeline.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-5">
          <h2 className="text-xl font-semibold">
            Frequently asked questions about the best states for FIRE
          </h2>
          <dl className="space-y-5 text-sm text-slate-300">
            <div>
              <dt className="font-semibold text-white">
                What makes a state good for FIRE?
              </dt>
              <dd className="mt-1">
                The two biggest factors are housing costs and state income tax. Low average
                rent reduces your FIRE number directly, since your number is 25x your annual
                spending. No state income tax increases how much you save during accumulation
                and how much you keep during retirement withdrawals.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-white">
                Which states have no income tax?
              </dt>
              <dd className="mt-1">
                Nine states currently have no personal state income tax: Alaska, Florida,
                Nevada, New Hampshire, South Dakota, Tennessee, Texas, Washington, and
                Wyoming. Several of these also appear in the low-cost rankings above,
                making them strong FIRE candidates.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-white">
                How much does state income tax affect a FIRE timeline?
              </dt>
              <dd className="mt-1">
                Significantly. On a $100,000 salary, moving from California (up to 13.3%
                state rate) to Texas or Florida can increase annual after-tax income by
                $6,000–$10,000+. At a 50% savings rate, that could shave 2–3 years off
                a FIRE timeline while also reducing the portfolio needed if you retire in
                a no-tax state.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-white">
                Is it worth moving states to reach FIRE faster?
              </dt>
              <dd className="mt-1">
                It depends on your income, current rent, and the destination state. For
                remote workers or people with portable income, moving from a high-cost,
                high-tax state to a lower-cost alternative can be one of the highest-impact
                decisions in a FIRE plan. Use the relocation calculator to see the numbers
                for your specific situation.
              </dd>
            </div>
          </dl>
        </section>

        {/* Related tools */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3">
          <h2 className="text-lg font-semibold">Related tools</h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/fire-calculator"
              className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
            >
              FIRE Calculator
            </Link>
            <Link
              href="/best-cities-for-fire"
              className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
            >
              Best Cities for FIRE
            </Link>
            <Link
              href="/"
              className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
            >
              Relocation Calculator
            </Link>
            <Link
              href="/savings-rate-for-fire"
              className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
            >
              Savings Rate for FIRE
            </Link>
            <Link
              href="/explore"
              className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
            >
              Explore All Tools
            </Link>
          </div>
        </section>

        <footer className="pt-2">
          <div className="mb-3 text-xs text-slate-500">Assumptions updated: March 2026</div>
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
