import type { Metadata } from "next";
import { STATES, type StateCode } from "@/lib/states";
import { citiesForState } from "@/lib/cities";
import Link from "next/link";
import { ALLOWED_STATE_CODES } from "@/lib/seo-allowlists";

export const metadata: Metadata = {
  title: "Best States for FIRE | Lowest Cost of Living & Taxes for Early Retirement",
  description:
    "Discover the best US states for financial independence and early retirement. Ranked by housing costs and tax burden, see which states let your money go furthest.",
  alternates: {
    canonical: "https://www.relocationbynumbers.com/best-states-for-fire",
  },
  openGraph: {
    title: "Best States for FIRE | Lowest Cost of Living & Taxes for Early Retirement",
    description:
      "Discover the best US states for financial independence and early retirement. Ranked by housing costs and tax burden, see which states let your money go furthest.",
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
    .filter((state) => ALLOWED_STATE_CODES.includes(state.code))
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
      <div className="mx-auto max-w-4xl space-y-8 px-4 py-10">
        <header className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Best States for FIRE
          </h1>

          <p className="text-lg font-semibold text-slate-200">
            Lower Housing Costs &amp; Lower Tax Drag Can Make FIRE Easier
          </p>

          <p className="max-w-3xl text-slate-300 leading-7">
            State choice can materially change the math behind financial independence.
            Lower housing costs reduce the spending your portfolio needs to support,
            and lower state income tax can improve how much of each paycheck you keep
            while you are still building toward FIRE.
          </p>

          <p className="max-w-3xl text-sm leading-6 text-slate-400">
            This page is a starting-point ranking based primarily on average rent across
            major cities in each state, with no-income-tax states clearly marked. It is
            designed to help you spot promising FIRE-friendly states, not to replace
            a personalized comparison based on your own salary, taxes, and lifestyle.
          </p>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-slate-400">
            <span>Assumptions updated: March 2026</span>
            <span className="hidden sm:inline">•</span>
            <Link href="/methodology" className="underline underline-offset-4 hover:no-underline">
              See methodology
            </Link>
          </div>

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

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
          <h2 className="text-xl font-semibold">
            How this ranking is built
          </h2>

          <div className="space-y-3 text-sm leading-7 text-slate-300">
            <p>
              This ranking uses a simple housing-cost-first approach. For each state,
              Relocation by Numbers looks at average rent across the major cities tracked
              in the model, then ranks lower-rent states higher because lower recurring
              housing costs usually reduce the FIRE number directly.
            </p>

            <p>
              States with no personal income tax are also flagged because lower tax drag
              can improve take-home pay during the accumulation phase. That matters, but
              it is shown as an additional signal, not the only ranking factor.
            </p>

            <p>
              This means the page is most useful as a directional starting point. It is
              not a definitive ranking of every FIRE variable, and it should not be read
              as a guarantee that a state is better for your personal plan without checking
              your own budget, income, and housing assumptions.
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">
            Top 10 states for FIRE by average housing cost
          </h2>

          <div className="space-y-3">
            {ranked.map((state, i) => (
              <div
                key={state.code}
                className="flex flex-col items-start gap-4 rounded-xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 text-sm font-semibold text-slate-400">
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
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-emerald-300 hover:bg-white/10 sm:shrink-0"
                >
                  View state →
                </Link>
              </div>
            ))}
          </div>

          <p className="pt-1 text-xs text-slate-500">
            Ranked primarily by average rent across major cities in each state. Lower rent
            generally means a lower spending base and a smaller FIRE target. No-income-tax
            status is shown as an additional planning signal.
          </p>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
          <h2 className="text-xl font-semibold">
            Why your state matters for financial independence
          </h2>
          <div className="space-y-3 text-sm leading-7 text-slate-300">
            <p>
              Your FIRE number is based on annual spending. If you live in a lower-cost
              state, your annual expenses may fall, which means a smaller portfolio target
              and potentially a shorter timeline to financial independence.
            </p>
            <p>
              State income tax adds a second layer. Moving from a high-tax state to a no-income-tax
              state can increase after-tax income and improve how much you are able to save each year.
              That can accelerate the path to FIRE even before retirement begins.
            </p>
            <p>
              The most FIRE-friendly states often combine manageable housing costs with lower tax drag.
              But no state is automatically “best” without context. The right state for FIRE still depends
              on your income, housing choice, and lifestyle fit.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
          <h2 className="text-xl font-semibold">
            What to look for beyond the ranking
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="font-semibold text-white">Housing cost relative to your income</div>
              <p className="mt-1 text-sm leading-6 text-slate-400">
                A lower-rent state only helps if the move improves your actual income-to-cost ratio.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="font-semibold text-white">State income tax</div>
              <p className="mt-1 text-sm leading-6 text-slate-400">
                Lower tax drag can help, especially during accumulation, but it is only one part of the picture.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="font-semibold text-white">Remote income portability</div>
              <p className="mt-1 text-sm leading-6 text-slate-400">
                The biggest FIRE gains often come when you keep a stronger salary while reducing housing costs.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="font-semibold text-white">Lifestyle fit</div>
              <p className="mt-1 text-sm leading-6 text-slate-400">
                A lower-cost state is only useful if it supports the kind of life you actually want to live.
              </p>
            </div>
          </div>
        </section>

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
                The biggest factors are usually housing costs, tax drag, and how well the state supports
                a strong income-to-expense ratio. Lower costs reduce the spending your portfolio must support.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-white">
                Which states have no income tax?
              </dt>
              <dd className="mt-1">
                Nine states currently have no personal state income tax: Alaska, Florida, Nevada,
                New Hampshire, South Dakota, Tennessee, Texas, Washington, and Wyoming.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-white">
                How much does state income tax affect a FIRE timeline?
              </dt>
              <dd className="mt-1">
                It can matter a lot during accumulation because lower tax drag may improve how much you save each year.
                But it should still be evaluated alongside housing and full cost-of-living assumptions.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-white">
                Is it worth moving states to reach FIRE faster?
              </dt>
              <dd className="mt-1">
                Sometimes, yes. For people with portable income, moving from a higher-cost, higher-tax state to a
                lower-cost alternative can be one of the highest-impact decisions in a FIRE plan.
              </dd>
            </div>
          </dl>
        </section>

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
            <span>•</span>
            <Link href="/methodology" className="transition hover:text-white">Methodology</Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
