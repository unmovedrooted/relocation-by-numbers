import type { Metadata } from "next";
import Link from "next/link";
import FireCalculator from "@/components/FireCalculator";
import { SEOFAQItem } from "@/components/SeoFAQ";
import { parseIncomeParam } from "@/lib/incomeParam";

export const metadata: Metadata = {
  title: "Barista FIRE Calculator | Part-Time Income & Partial Retirement Planning",
  description:
    "Calculate your Barista FIRE number. See how part-time income reduces the portfolio you need to retire early. Model your savings target, timeline, and withdrawal rate.",
  alternates: {
    canonical: "https://www.relocationbynumbers.com/barista-fire-calculator",
  },
  openGraph: {
    title: "Barista FIRE Calculator | Part-Time Income & Partial Retirement Planning",
    description:
      "Calculate your Barista FIRE number. See how part-time income reduces the portfolio you need to retire early.",
    url: "https://www.relocationbynumbers.com/barista-fire-calculator",
    siteName: "Relocation by Numbers",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Barista FIRE Calculator | Part-Time Income & Partial Retirement Planning",
    description:
      "Calculate your Barista FIRE number. See how part-time income reduces the portfolio you need to retire early.",
  },
};

type PageProps = { searchParams: Promise<{ income?: string }> };

export default async function Page({ searchParams }: PageProps) {
  const { income } = await searchParams;
  const initialIncome = parseIncomeParam(income);
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-10">
        <header className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Barista FIRE Calculator
          </h1>

          <p className="text-lg font-semibold text-slate-200">
            Part-Time Income, Partial Retirement, How Much Do You Actually Need?
          </p>

          <p className="leading-relaxed text-slate-300">
            <span className="font-semibold text-white">Barista FIRE</span> is a middle ground
            between full-time work and full retirement. Instead of building a portfolio large
            enough to cover 100% of your expenses forever, you plan for part-time income to
            cover part of your lifestyle and let your investments cover the rest.
          </p>

          <p className="leading-relaxed text-slate-300">
            That changes the math. If your annual expenses are $60,000 and you expect $24,000
            of part-time income, your portfolio only needs to support $36,000 per year. At a
            4% withdrawal rate, that means a $900,000 target instead of $1,500,000.
          </p>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-slate-400">
            <span>Assumptions updated: March 2026</span>
            <span className="hidden sm:inline">•</span>
            <Link href="/methodology" className="underline underline-offset-4 hover:no-underline">
              See methodology
            </Link>
          </div>
        </header>

        <section aria-label="Barista FIRE calculator">
          <FireCalculator hideFAQ initialIncome={initialIncome} />
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold">
            How Barista FIRE actually works
          </h2>
          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-300">
            <p>
              Traditional FIRE assumes your portfolio must cover your full annual spending.
              Barista FIRE changes that by reducing the amount your investments need to fund.
              The more reliable part-time income you expect, the lower your portfolio target can be.
            </p>
            <p>
              In practical terms, the formula is simple: expected annual expenses minus expected
              annual part-time income equals the amount your portfolio needs to cover. That amount
              is then divided by your withdrawal rate to estimate your Barista FIRE number.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold">
            What changes your Barista FIRE number most
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h3 className="font-semibold text-white">Part-time income</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Even modest recurring income can dramatically reduce the size of portfolio you need.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h3 className="font-semibold text-white">Annual spending</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                The higher your target lifestyle cost, the more investments still need to do.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h3 className="font-semibold text-white">Withdrawal rate</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                A lower withdrawal rate raises the target portfolio. A higher one lowers it, but with more risk.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h3 className="font-semibold text-white">Healthcare and benefits</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                One reason Barista FIRE is popular is that some part-time work may help cover benefits,
                which can reduce pressure on your portfolio.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold">
            Who Barista FIRE is usually best for
          </h2>
          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-300">
            <p>
              Barista FIRE often makes the most sense for people who want more freedom before reaching
              full traditional FIRE, but are still comfortable earning some income through lower-stress
              or more flexible work.
            </p>
            <p>
              It can be especially attractive for people who want to leave full-time corporate work,
              reduce burnout, or shorten the years required to reach a fully self-funded retirement.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold">
            What this calculator includes, and what it does not
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4">
              <h3 className="font-semibold text-white">Included</h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-300">
                <li>Portfolio target based on reduced spending need</li>
                <li>Timeline and savings target modeling</li>
                <li>Withdrawal-rate-based planning estimate</li>
                <li>Comparison against standard FIRE math</li>
              </ul>
            </div>

            <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-4">
              <h3 className="font-semibold text-white">Not fully modeled</h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-300">
                <li>Variable healthcare costs</li>
                <li>Taxes on part-time income in every scenario</li>
                <li>Benefit eligibility from specific employers</li>
                <li>Sequence-of-returns risk in detail</li>
              </ul>
            </div>
          </div>

          <p className="mt-4 text-sm leading-7 text-slate-300">
            This tool is built for planning direction, not perfect prediction. It is most useful
            for seeing how much part-time income changes the retirement math.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            Frequently asked questions about Barista FIRE
          </h2>

          <div className="grid gap-3">
            <SEOFAQItem
              q="What is Barista FIRE?"
              a="Barista FIRE is a partial retirement strategy where you leave full-time work but continue earning part-time income, enough to cover some living expenses so your investment portfolio can be smaller."
            />
            <SEOFAQItem
              q="How is Barista FIRE different from regular FIRE?"
              a="Traditional FIRE requires a portfolio large enough to cover 100% of your expenses indefinitely. Barista FIRE reduces that requirement by supplementing with part-time income, which means you can often reach your number sooner."
            />
            <SEOFAQItem
              q="How do I calculate my Barista FIRE number?"
              a="Subtract expected annual part-time income from annual expenses, then divide the remainder by your withdrawal rate. Example: $60,000 expenses minus $24,000 income leaves $36,000 to be covered by the portfolio. At 4%, that implies a $900,000 target."
            />
            <SEOFAQItem
              q="Why is Barista FIRE popular?"
              a="It reduces the portfolio required to leave full-time work and can shorten the time to financial independence. It also gives people a middle ground between full-time employment and full retirement."
            />
            <SEOFAQItem
              q="What is a good part-time income for Barista FIRE?"
              a="It depends on your expenses, but even moderate recurring income can materially reduce the size of portfolio required."
            />
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold">
            Explore related FIRE and relocation tools
          </h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/fire-calculator" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">FIRE calculator →</Link>
            <Link href="/coast-fire-calculator" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">Coast FIRE calculator →</Link>
            <Link href="/lean-fire-calculator" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">Lean FIRE calculator →</Link>
            <Link href="/chubby-fire-calculator" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">Chubby FIRE →</Link>
            <Link href="/fat-fire-calculator" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">Fat FIRE →</Link>
            <Link href="/" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">Compare cities →</Link>
            <Link href="/explore" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">Explore all tools →</Link>
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