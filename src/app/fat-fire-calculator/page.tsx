import type { Metadata } from "next";
import Link from "next/link";
import FireCalculator from "@/components/FireCalculator";
import AdSlot from "@/components/AdSlot";
import { SEOFAQItem } from "@/components/SeoFAQ";
import { parseIncomeParam } from "@/lib/incomeParam";

export const metadata: Metadata = {
  title: "Fat FIRE Calculator | Retire Early With a Luxury Budget",
  description:
    "Calculate your Fat FIRE number, the portfolio that funds a high-spending, luxury early retirement (roughly $200k+ a year, $5M+). Model spending, timeline, taxes, and withdrawal rate.",
  alternates: {
    canonical: "https://www.relocationbynumbers.com/fat-fire-calculator",
  },
  openGraph: {
    title: "Fat FIRE Calculator | Retire Early With a Luxury Budget",
    description:
      "Calculate your Fat FIRE number, the portfolio for a high-spending, luxury early retirement.",
    url: "https://www.relocationbynumbers.com/fat-fire-calculator",
    siteName: "Relocation by Numbers",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fat FIRE Calculator | Retire Early With a Luxury Budget",
    description:
      "Calculate your Fat FIRE number, a high-spending, luxury early retirement.",
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
            Fat FIRE Calculator
          </h1>

          <p className="mt-2 text-lg font-semibold text-slate-200">
            Retire Early Without Cutting Back, The Luxury End of FIRE
          </p>

          <p className="max-w-3xl leading-relaxed text-slate-300">
            <span className="font-semibold text-white">Fat FIRE</span> is financial independence
            with a high, no-compromises spending level: premium travel, a larger home, private
            education, or whatever a full lifestyle looks like for you, without a budget hanging
            over every decision.
          </p>

          <p className="max-w-3xl leading-relaxed text-slate-300">
            Fat FIRE is commonly framed as roughly $200,000 or more in annual spending, which at a
            4% withdrawal rate implies a portfolio of about $5 million and up. The exact number
            scales with the lifestyle you plan to fund and your withdrawal-rate assumptions.
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
            <Link href="/chubby-fire-calculator" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">Chubby FIRE</Link>
            <Link href="/lean-fire-calculator" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">Lean FIRE</Link>
            <Link href="/coast-fire-calculator" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">Coast FIRE</Link>
          </div>
        </header>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold">How Fat FIRE actually works</h2>
          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-300">
            <p>
              Fat FIRE uses the same math as traditional FIRE, annual spending divided by your
              withdrawal rate, but with a much higher spending target, which means a much larger
              portfolio. The trade-off is more years of saving (or higher earning) in exchange for
              a retirement with no lifestyle compromises.
            </p>
            <p>
              At $200,000 per year in expenses and a 4% withdrawal rate, the target portfolio is
              about $5 million. At $250,000 per year, it is about $6.25 million. Because the
              numbers are large, the withdrawal rate and tax assumptions matter more than ever.
            </p>
          </div>
        </section>

        <section aria-label="Fat FIRE calculator">
          <FireCalculator hideFAQ initialIncome={initialIncome} />
        </section>

        {process.env.NEXT_PUBLIC_ADSENSE_SLOT_MID ? (
          <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_MID} className="min-h-[100px]" />
          </section>
        ) : null}

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold">What changes your Fat FIRE number most</h2>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h3 className="font-semibold text-white">Target spending</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                The lifestyle you plan to fund drives everything. At a 4% rate, every $10,000 of
                annual spending adds about $250,000 to the target.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h3 className="font-semibold text-white">Taxes</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                At Fat FIRE spending levels, taxes on withdrawals and investment income become a
                significant line item, worth modeling carefully, not assuming away.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h3 className="font-semibold text-white">Withdrawal rate</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                A conservative withdrawal rate raises an already-large target. On big portfolios,
                small rate changes move the number by hundreds of thousands.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h3 className="font-semibold text-white">Sequence-of-returns risk</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Longer, higher-spend retirements are more exposed to a bad early market. Stress-test
                with the Retirement Withdrawal Calculator&apos;s Monte Carlo view.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold">Who Fat FIRE is usually best for</h2>
          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-300">
            <p>
              Fat FIRE usually fits high earners who want to retire early without downgrading their
              lifestyle, and who are able to save aggressively or build significant equity to reach
              a larger target.
            </p>
            <p>
              It is the right frame for people whose planned retirement spending simply won&apos;t
              fit inside a traditional or Chubby FIRE budget, and who would rather build a bigger
              cushion than constrain their life.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Frequently asked questions about Fat FIRE</h2>

          <div className="grid gap-3">
            <SEOFAQItem
              q="What is Fat FIRE?"
              a="Fat FIRE is early retirement on a high, luxury-level spending budget, commonly $200,000 or more a year, with little need to budget or optimize spending."
            />
            <SEOFAQItem
              q="What is the Fat FIRE number?"
              a="At a 4% withdrawal rate, $200,000 of annual spending implies a target of about $5 million, and $250,000 implies about $6.25 million. Many Fat FIRE plans run from roughly $5 million upward."
            />
            <SEOFAQItem
              q="How is Fat FIRE different from Chubby FIRE?"
              a="Chubby FIRE funds a comfortable lifestyle (around $100,000–$150,000 a year, ~$2.5M–$3.75M), while Fat FIRE funds a luxury lifestyle at $200,000+ a year and a $5 million+ portfolio."
            />
            <SEOFAQItem
              q="Do taxes matter more for Fat FIRE?"
              a="Yes. At higher withdrawal amounts, federal and state income taxes and investment taxes take a meaningful bite, so building them into the plan matters more than at lower spending levels."
            />
            <SEOFAQItem
              q="What withdrawal rate should I use for Fat FIRE?"
              a="4% is a common starting point, but because the dollar amounts are large and horizons long, many Fat FIRE planners use a more conservative rate and stress-test against market volatility."
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
