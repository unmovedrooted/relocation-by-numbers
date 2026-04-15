import type { Metadata } from "next";
import Link from "next/link";
import AdSlot from "@/components/AdSlot";
import FireCalculator from "@/components/FireCalculator";
import { SEOFAQItem } from "@/components/SeoFAQ";

export const metadata: Metadata = {
  title: "How Much Do I Need to Retire? | Retirement Number Calculator",
  description:
    "Find out how much money you need to retire. Calculate your retirement number based on annual expenses, withdrawal rate, and investment returns. Uses the 4% rule and 25x spending guideline.",
  alternates: {
    canonical: "https://www.relocationbynumbers.com/how-much-do-i-need-to-retire",
  },
  openGraph: {
    title: "How Much Do I Need to Retire? | Retirement Number Calculator",
    description:
      "Find out how much money you need to retire. Calculate your retirement number based on annual expenses, withdrawal rate, and investment returns.",
    url: "https://www.relocationbynumbers.com/how-much-do-i-need-to-retire",
    siteName: "Relocation by Numbers",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "How Much Do I Need to Retire? | Retirement Number Calculator",
    description:
      "Find out how much money you need to retire based on your expenses, withdrawal rate, and investment returns.",
  },
};

export default function Page() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-10">
        <header className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            How Much Do I Need to Retire?
          </h1>

          <p className="mt-2 text-lg font-semibold text-slate-200">
            Calculate Your Retirement Number Based on Spending, Returns &amp; Withdrawal Rate
          </p>

          <p className="max-w-3xl text-slate-300 leading-7">
            The amount you need to retire depends mostly on your yearly spending,
            your withdrawal rate, and how long your money needs to last. A common
            starting point is the <span className="font-semibold text-white">4% rule</span>,
            which suggests you need about{" "}
            <span className="font-semibold text-white">25× your annual expenses</span>.
          </p>

          <p className="max-w-3xl text-sm leading-6 text-slate-400">
            But your retirement number also depends on where you live. Lower taxes and
            a lower cost of living can reduce annual spending, shrink the portfolio you
            need, and shorten your timeline by years.
          </p>

          <div className="text-xs text-slate-400">Assumptions updated: March 2026</div>

          <div className="pt-1">
            <Link
              href="/methodology"
              className="text-sm font-medium text-emerald-200 underline decoration-emerald-300/40 underline-offset-4 transition hover:text-emerald-100"
            >
              See methodology and data sources
            </Link>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Link href="/fire-calculator" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">FIRE calculator</Link>
            <Link href="/fire-number-calculator" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">FIRE number calculator</Link>
            <Link href="/lean-fire-calculator" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">Lean FIRE</Link>
            <Link href="/barista-fire-calculator" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">Barista FIRE</Link>
            <Link href="/" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">Compare cities</Link>
          </div>
        </header>

        {process.env.NEXT_PUBLIC_ADSENSE_SLOT_TOP ? (
          <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <AdSlot
              slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_TOP}
              className="min-h-[100px]"
            />
          </section>
        ) : null}

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold">
            How retirement numbers are usually calculated
          </h2>

          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-300">
            <p>
              The simplest version is:
              annual spending ÷ withdrawal rate = retirement number.
            </p>
            <p>
              If you expect to spend $50,000 a year and use a 4% withdrawal rate,
              your target is about $1.25 million. If you expect to spend $80,000,
              the same rule gives you a target of $2 million.
            </p>
            <p>
              That is why spending matters so much. A lower annual spending target
              does not just reduce your monthly needs — it directly lowers the size
              of portfolio required to retire.
            </p>
          </div>
        </section>

        <FireCalculator hideFAQ />

        {process.env.NEXT_PUBLIC_ADSENSE_SLOT_MID ? (
          <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <AdSlot
              slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_MID}
              className="min-h-[100px]"
            />
          </section>
        ) : null}

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold">
            What changes your retirement number most
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h3 className="font-semibold text-white">Annual spending</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Spending is the biggest driver. Lower annual expenses mean a lower retirement target.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h3 className="font-semibold text-white">Withdrawal rate</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                A lower withdrawal rate means you need a larger portfolio. A higher rate lowers the target, but with more risk.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h3 className="font-semibold text-white">Location</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Where you live changes taxes, housing costs, and everyday spending, which can materially change your number.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h3 className="font-semibold text-white">Retirement age</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Earlier retirement usually requires more caution because the portfolio needs to last longer.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold">
            Why location matters more than people think
          </h2>

          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-300">
            <p>
              Your retirement number is based on annual spending, not just investment returns.
              That means moving to a lower-cost city or lower-tax state can reduce the amount
              your portfolio needs to support every year.
            </p>
            <p>
              In practice, a relocation decision can sometimes improve the math more than a small
              raise or a slightly higher investment return assumption.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold">
            What this calculator includes — and what it does not
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4">
              <h3 className="font-semibold text-white">Included</h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-300">
                <li>Retirement number estimate</li>
                <li>4% rule and withdrawal-rate planning</li>
                <li>Location-aware spending and tax comparison</li>
                <li>Timeline testing through the FIRE calculator</li>
              </ul>
            </div>

            <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-4">
              <h3 className="font-semibold text-white">Not fully modeled</h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-300">
                <li>Every tax edge case or deduction</li>
                <li>Sequence-of-returns risk in full detail</li>
                <li>Healthcare and long-term care with precision</li>
                <li>Guaranteed future returns</li>
              </ul>
            </div>
          </div>

          <p className="mt-4 text-sm leading-7 text-slate-300">
            This is a planning tool, not a guaranteed retirement forecast.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            Frequently asked questions about retirement numbers
          </h2>

          <div className="grid gap-3">
            <SEOFAQItem
              q="How much money do I need to retire?"
              a="A common starting point is 25 times your annual expenses, based on the 4% rule. The exact number depends on your withdrawal rate, timeline, taxes, and expected spending."
            />
            <SEOFAQItem
              q="What is the 4% rule for retirement?"
              a="The 4% rule is a planning guideline suggesting a portfolio can support withdrawals of roughly 4% per year over a traditional retirement horizon. That implies a retirement number of about 25 times annual spending."
            />
            <SEOFAQItem
              q="How does where I live affect how much I need to retire?"
              a="Significantly. Lower spending and lower taxes reduce the size of portfolio your retirement must support."
            />
            <SEOFAQItem
              q="How much do I need to retire at 50?"
              a="Retiring at 50 usually requires a more conservative plan than retiring later because the portfolio may need to last 40 years or more. Many early retirees use a withdrawal rate lower than 4%."
            />
            <SEOFAQItem
              q="Does Social Security reduce how much I need to save?"
              a="Yes. Any reliable outside income reduces the amount your portfolio needs to cover each year."
            />
            <SEOFAQItem
              q="What investment return should I assume for retirement planning?"
              a="Many people use 5% to 7% nominal return assumptions for planning, but the right number depends on how conservative you want to be."
            />
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