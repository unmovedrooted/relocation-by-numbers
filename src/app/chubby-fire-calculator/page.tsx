import type { Metadata } from "next";
import Link from "next/link";
import FireCalculator from "@/components/FireCalculator";
import AdSlot from "@/components/AdSlot";
import { SEOFAQItem } from "@/components/SeoFAQ";
import { parseIncomeParam } from "@/lib/incomeParam";

export const metadata: Metadata = {
  title: "Chubby FIRE Calculator | Comfortable Early Retirement Number",
  description:
    "Calculate your Chubby FIRE number, the portfolio that funds a comfortable early retirement (roughly $100k–$150k a year) without a Fat FIRE budget. Model spending, timeline, taxes, and withdrawal rate.",
  alternates: {
    canonical: "https://www.relocationbynumbers.com/chubby-fire-calculator",
  },
  openGraph: {
    title: "Chubby FIRE Calculator | Comfortable Early Retirement Number",
    description:
      "Calculate your Chubby FIRE number, the portfolio for a comfortable early retirement without a Fat FIRE budget.",
    url: "https://www.relocationbynumbers.com/chubby-fire-calculator",
    siteName: "Relocation by Numbers",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Chubby FIRE Calculator | Comfortable Early Retirement Number",
    description:
      "Calculate your Chubby FIRE number, a comfortable early retirement without a Fat FIRE budget.",
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
            Chubby FIRE Calculator
          </h1>

          <p className="mt-2 text-lg font-semibold text-slate-200">
            A Comfortable Early Retirement, Between Regular FIRE and Fat FIRE
          </p>

          <p className="max-w-3xl leading-relaxed text-slate-300">
            <span className="font-semibold text-white">Chubby FIRE</span> is financial
            independence with room to breathe: regular travel, eating out, a nice home, and
            hobbies without optimizing every dollar. It sits above traditional FIRE but below
            the luxury spending of Fat FIRE.
          </p>

          <p className="max-w-3xl leading-relaxed text-slate-300">
            Chubby FIRE is commonly framed as roughly $100,000 to $150,000 in annual spending,
            which at a 4% withdrawal rate implies a portfolio of about $2.5 million to $3.75
            million. Your exact number depends on your spending and withdrawal-rate assumptions.
          </p>

          <div className="text-xs text-slate-400">Assumptions updated: July 2026</div>

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
            <Link href="/lean-fire-calculator" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">Lean FIRE</Link>
            <Link href="/fat-fire-calculator" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">Fat FIRE</Link>
            <Link href="/coast-fire-calculator" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">Coast FIRE</Link>
          </div>
        </header>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold">How Chubby FIRE actually works</h2>
          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-300">
            <p>
              Chubby FIRE uses the same core math as traditional FIRE: annual spending divided
              by your withdrawal rate. The difference is a more comfortable spending target,
              which raises the portfolio you need but buys a materially higher standard of living.
            </p>
            <p>
              At $100,000 per year in expenses and a 4% withdrawal rate, the target portfolio is
              about $2.5 million. At $150,000 per year, it is about $3.75 million. The higher
              spending is the whole point, Chubby FIRE trades a bigger number for a roomier life.
            </p>
          </div>
        </section>

        <section aria-label="Chubby FIRE calculator">
          <FireCalculator hideFAQ initialIncome={initialIncome} />
        </section>

        {process.env.NEXT_PUBLIC_ADSENSE_SLOT_MID ? (
          <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_MID} className="min-h-[100px]" />
          </section>
        ) : null}

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold">What changes your Chubby FIRE number most</h2>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h3 className="font-semibold text-white">Target spending</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                The comfort level you plan for is the biggest lever. Every $10,000 of annual
                spending adds about $250,000 to the target at a 4% rate.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h3 className="font-semibold text-white">Withdrawal rate</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                A more conservative withdrawal rate raises the target. Many Chubby FIRE planners
                favor a cushion given the longer horizons of early retirement.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h3 className="font-semibold text-white">Healthcare &amp; travel</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Discretionary categories like travel, dining, and pre-Medicare healthcare are
                often what separates Chubby FIRE from a leaner plan.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h3 className="font-semibold text-white">Location</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Cost of living still matters. The same comfortable lifestyle costs far less in
                some cities than others, which changes the target directly.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold">Who Chubby FIRE is usually best for</h2>
          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-300">
            <p>
              Chubby FIRE tends to fit people who want financial independence without giving up a
              comfortable lifestyle, those who would rather work a bit longer or save a bit more
              than commit to a tight budget for decades.
            </p>
            <p>
              It is a popular middle ground for higher earners who find Lean FIRE too restrictive
              but do not need the luxury spending (or the much larger portfolio) that Fat FIRE requires.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Frequently asked questions about Chubby FIRE</h2>

          <div className="grid gap-3">
            <SEOFAQItem
              q="What is Chubby FIRE?"
              a="Chubby FIRE is early retirement on a comfortable but not luxurious budget, commonly around $100,000 to $150,000 a year, sitting between traditional FIRE and Fat FIRE."
            />
            <SEOFAQItem
              q="What is the Chubby FIRE number?"
              a="At a 4% withdrawal rate, $100,000 of annual spending implies a target of about $2.5 million, and $150,000 implies about $3.75 million. Your number scales with your planned spending and withdrawal rate."
            />
            <SEOFAQItem
              q="How is Chubby FIRE different from Fat FIRE?"
              a="Chubby FIRE funds a comfortable lifestyle with mindful spending, while Fat FIRE targets a luxury lifestyle with little budgeting. Fat FIRE typically means $200,000+ a year and a $5 million+ portfolio."
            />
            <SEOFAQItem
              q="How is Chubby FIRE different from regular FIRE?"
              a="Regular FIRE often assumes a moderate, middle-class budget, while Chubby FIRE plans for a roomier lifestyle, more travel, dining, and discretionary spending, and therefore a larger portfolio."
            />
            <SEOFAQItem
              q="What withdrawal rate should I use for Chubby FIRE?"
              a="Many planners use 4% as a starting point, but a longer early-retirement horizon can justify something more conservative. Use this calculator to test how the rate changes your target."
            />
          </div>
        </section>

        <footer className="pt-2">
          <div className="mb-3 text-xs text-slate-400">Assumptions updated: July 2026</div>
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
