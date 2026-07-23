import type { Metadata } from "next";
import Link from "next/link";
import FireCalculator from "@/components/FireCalculator";
import AdSlot from "@/components/AdSlot";
import { SEOFAQItem } from "@/components/SeoFAQ";
import { parseIncomeParam } from "@/lib/incomeParam";

export const metadata: Metadata = {
  title: "Lean FIRE Calculator | Retire Early on a Smaller Budget",
  description:
    "Calculate your Lean FIRE number. See how a lower spending level reduces the portfolio you need to retire early. Model your savings target, timeline, taxes, and withdrawal rate.",
  alternates: {
    canonical: "https://www.relocationbynumbers.com/lean-fire-calculator",
  },
  openGraph: {
    title: "Lean FIRE Calculator | Retire Early on a Smaller Budget",
    description:
      "Calculate your Lean FIRE number. See how a lower spending level reduces the portfolio you need to retire early.",
    url: "https://www.relocationbynumbers.com/lean-fire-calculator",
    siteName: "Relocation by Numbers",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lean FIRE Calculator | Retire Early on a Smaller Budget",
    description:
      "Calculate your Lean FIRE number. See how a lower spending level reduces the portfolio you need to retire early.",
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
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Lean FIRE Calculator
          </h1>

          <p className="mt-2 text-lg font-semibold text-slate-200">
            Retire Early on a Smaller Budget — How Low Can Your FIRE Number Go?
          </p>

          <p className="max-w-3xl leading-relaxed text-slate-300">
            <span className="font-semibold text-white">Lean FIRE</span> is financial
            independence on a lower spending level. Because your FIRE number is directly
            tied to annual expenses, spending less means a smaller target portfolio and
            often a faster path to early retirement.
          </p>

          <p className="max-w-3xl leading-relaxed text-slate-300">
            Many people think of Lean FIRE as living on roughly $40,000 per year or less,
            but the exact threshold is personal. The real question is whether your target
            spending is low enough to reduce the portfolio you need while still being sustainable.
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
            <Link href="/barista-fire-calculator" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">Barista FIRE</Link>
            <Link href="/coast-fire-calculator" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">Coast FIRE</Link>
            <Link href="/chubby-fire-calculator" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">Chubby FIRE</Link>
            <Link href="/fat-fire-calculator" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">Fat FIRE</Link>
            <Link href="/" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">Compare cities</Link>
          </div>
        </header>

        {process.env.NEXT_PUBLIC_ADSENSE_SLOT_TOP ? (
          <section className="">
            
          </section>
        ) : null}

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold">
            How Lean FIRE actually works
          </h2>
          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-300">
            <p>
              Lean FIRE uses the same basic math as traditional FIRE: annual spending divided
              by your withdrawal rate. The difference is that Lean FIRE assumes a much lower
              spending level, which lowers the size of portfolio required.
            </p>
            <p>
              At $30,000 per year in expenses and a 4% withdrawal rate, the target portfolio
              is about $750,000. At $40,000 per year, it is about $1 million. Lower spending
              reduces the number directly.
            </p>
          </div>
        </section>

        <section aria-label="Lean FIRE calculator">
          <FireCalculator hideFAQ initialIncome={initialIncome} />
        </section>

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
            What changes your Lean FIRE number most
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h3 className="font-semibold text-white">Annual spending</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Spending is the biggest lever. Lower expenses directly reduce the target portfolio.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h3 className="font-semibold text-white">Withdrawal rate</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                A lower withdrawal rate increases the target. A more conservative Lean FIRE plan usually needs a larger cushion.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h3 className="font-semibold text-white">Housing costs</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Housing is usually the biggest recurring expense, so lower rent or a cheaper city can materially change the math.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h3 className="font-semibold text-white">Lifestyle flexibility</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Lean FIRE only works long-term if the lower spending target is actually livable for you.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold">
            Who Lean FIRE is usually best for
          </h2>
          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-300">
            <p>
              Lean FIRE is usually best for people who are comfortable with a lower-spending
              lifestyle and want to reach financial independence faster by reducing the target
              portfolio instead of maximizing retirement spending.
            </p>
            <p>
              It is often most attractive for people willing to optimize housing costs, simplify
              recurring expenses, or use geographic arbitrage to lower annual spending.
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
                <li>Lean FIRE target math</li>
                <li>Timeline and savings modeling</li>
                <li>Withdrawal-rate-based estimates</li>
                <li>Location-aware planning through Move Impact</li>
              </ul>
            </div>

            <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-4">
              <h3 className="font-semibold text-white">Not fully modeled</h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-300">
                <li>Healthcare shocks or major emergencies</li>
                <li>Every tax edge case</li>
                <li>Sequence-of-returns risk in full detail</li>
                <li>Future lifestyle changes with precision</li>
              </ul>
            </div>
          </div>

          <p className="mt-4 text-sm leading-7 text-slate-300">
            This tool is built for planning direction, not certainty. Lean FIRE works best
            when you stress-test the assumptions instead of treating the result like a guaranteed finish line.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            Frequently asked questions about Lean FIRE
          </h2>

          <div className="grid gap-3">
            <SEOFAQItem
              q="What is Lean FIRE?"
              a="Lean FIRE is early retirement on a lower spending level. Because the target portfolio is tied to annual expenses, a lower spending target reduces the amount you need to retire."
            />
            <SEOFAQItem
              q="What is the Lean FIRE number?"
              a="It depends on your annual spending and withdrawal rate. At a 4% withdrawal rate, $30,000 of annual expenses implies a target of about $750,000, while $40,000 implies about $1 million."
            />
            <SEOFAQItem
              q="How is Lean FIRE different from regular FIRE?"
              a="Lean FIRE uses a smaller spending target than traditional FIRE, which lowers the portfolio needed but usually leaves less cushion for unexpected costs."
            />
            <SEOFAQItem
              q="Is Lean FIRE realistic long-term?"
              a="It can be, but it usually requires more discipline and is more sensitive to housing, healthcare, and other surprise costs than a higher-spending retirement plan."
            />
            <SEOFAQItem
              q="How can moving to a cheaper city help with Lean FIRE?"
              a="Lower cost-of-living cities reduce annual spending directly, which lowers the Lean FIRE number and can also improve how much you save along the way."
            />
            <SEOFAQItem
              q="What withdrawal rate should I use for Lean FIRE?"
              a="Many Lean FIRE planners use something more conservative than 4%, especially for long retirement horizons, but the right answer depends on your risk tolerance and planning assumptions."
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