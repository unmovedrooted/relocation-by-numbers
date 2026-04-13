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
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">

        <header className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            How Much Do I Need to Retire?
          </h1>

          <p className="mt-2 text-lg font-semibold text-slate-200">
            Calculate Your Retirement Number Based on Spending, Returns &amp; Withdrawal Rate
          </p>

          <p className="text-slate-300 max-w-2xl">
            The amount you need to retire depends on your yearly spending,
            investment returns, and withdrawal rate. A common starting point is
            the <span className="font-semibold text-white">4% rule</span>, which
            suggests you need roughly{" "}
            <span className="font-semibold text-white">25× your annual expenses</span>.
            At $50,000 per year in spending, that's a $1.25 million retirement
            number. At $80,000 per year, it's $2 million.
          </p>

          <p className="text-sm text-slate-400 max-w-2xl">
            But your retirement number also depends on where you live. Lower
            taxes and a lower cost of living reduce your annual spending, which
            directly shrinks the portfolio you need and can shorten your timeline
            by years.
          </p>

          <div className="text-xs text-slate-400">Assumptions updated: March 2026</div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Link
              href="/explore"
              className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Explore All Tools
            </Link>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Link href="/fire-calculator" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">FIRE calculator →</Link>
            <Link href="/fire-number-calculator" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">FIRE number calculator →</Link>
            <Link href="/lean-fire-calculator" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">Lean FIRE →</Link>
            <Link href="/barista-fire-calculator" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">Barista FIRE →</Link>
            <Link href="/" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">Compare cities →</Link>
          </div>
        </header>

        <FireCalculator hideFAQ />

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            Frequently asked questions about retirement numbers
          </h2>

          <div className="grid gap-3">
            <SEOFAQItem
              q="How much money do I need to retire?"
              a="The most common guideline is 25 times your annual expenses, based on the 4% rule. If you spend $50,000 per year, you need $1.25 million. If you spend $80,000, you need $2 million. The exact amount depends on your withdrawal rate, expected investment returns, inflation, and how long your retirement will last."
            />
            <SEOFAQItem
              q="What is the 4% rule for retirement?"
              a="The 4% rule is a guideline suggesting you can withdraw 4% of your portfolio each year in retirement without running out of money over a 30-year period, based on historical market returns. It means your retirement number is roughly 25 times your annual spending. More conservative planners use 3–3.5%, especially for early retirees with longer time horizons."
            />
            <SEOFAQItem
              q="How does where I live affect how much I need to retire?"
              a="Significantly. Your retirement number is based on your annual spending. If you move to a lower cost-of-living state or city, your expenses drop — which means a smaller portfolio target and potentially years shaved off your timeline. Moving from a high-tax state to a no-income-tax state also increases how much of your withdrawals you keep."
            />
            <SEOFAQItem
              q="How much do I need to retire at 50?"
              a="Retiring at 50 means your portfolio needs to last 40+ years, which is longer than the 30-year window the 4% rule was designed for. Most financial planners recommend using a 3–3.5% withdrawal rate for early retirement, which means multiplying your annual expenses by 28.6–33 instead of 25. At $60,000 per year in expenses, that's a target of roughly $1.7M–$2M."
            />
            <SEOFAQItem
              q="Does Social Security reduce how much I need to save?"
              a="Yes. If you plan to receive Social Security, that income reduces how much your portfolio needs to cover each year. For example, if you expect $18,000 per year in Social Security and spend $55,000 annually, your portfolio only needs to cover $37,000 — a retirement number of $925,000 at 4% instead of $1.375 million."
            />
            <SEOFAQItem
              q="What investment return should I assume for retirement planning?"
              a="A common planning assumption is 6–7% nominal annual return for a diversified stock and bond portfolio, which translates to roughly 4–5% after inflation. More conservative plans use 5–6% to account for sequence-of-returns risk in early retirement years. This calculator defaults to 7% in Phase 1, which you can adjust under the advanced settings."
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
          </div>
        </footer>

      </div>
    </main>
  );
}
