import type { Metadata } from "next";
import Link from "next/link";
import AdSlot from "@/components/AdSlot";
import FireCalculator from "@/components/FireCalculator";
import { SEOFAQItem } from "@/components/SeoFAQ";
import { parseIncomeParam } from "@/lib/incomeParam";

export const metadata: Metadata = {
  title: "FIRE Number Calculator | How Much Do You Need to Retire Early?",
  description:
    "Calculate your FIRE number — the portfolio size you need to retire early. Estimate years to financial independence using the 4% rule and your annual expenses.",
  alternates: {
    canonical: "https://www.relocationbynumbers.com/fire-number-calculator",
  },
  openGraph: {
    title: "FIRE Number Calculator | How Much Do You Need to Retire Early?",
    description:
      "Calculate your FIRE number — the portfolio size you need to retire early. Estimate years to financial independence using the 4% rule and your annual expenses.",
    url: "https://www.relocationbynumbers.com/fire-number-calculator",
    siteName: "Relocation by Numbers",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FIRE Number Calculator | How Much Do You Need to Retire Early?",
    description:
      "Calculate your FIRE number and years to financial independence using the 4% rule.",
  },
};

type PageProps = { searchParams: Promise<{ income?: string }> };

export default async function Page({ searchParams }: PageProps) {
  const { income } = await searchParams;
  const initialIncome = parseIncomeParam(income);
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-10">

        <header className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            FIRE Number Calculator
          </h1>

          <p className="mt-2 text-lg font-semibold text-slate-200">
            How Much Do You Need to Retire Early?
          </p>

          <p className="leading-relaxed text-slate-300">
            Your <span className="font-semibold text-white">FIRE number</span> is the portfolio
            size you need so your investments can support your lifestyle indefinitely. The most
            common method is the{" "}
            <span className="font-semibold text-white">4% rule</span>: divide your annual
            expenses by 0.04, or multiply by{" "}
            <span className="font-semibold text-white">25</span>. At $48,000 per year in
            expenses, your FIRE number is $1.2 million.
          </p>

          <p className="leading-relaxed text-slate-300">
            Enter your income, spending, state, and investing assumptions below to calculate
            your personal FIRE number and estimated years to financial independence.
          </p>

          <div className="text-xs text-slate-400">Assumptions updated: March 2026</div>

          <Link
            href="/explore"
            className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Explore All Tools
          </Link>

          <div className="flex flex-wrap gap-2 pt-2">
            <Link href="/fire-calculator" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">FIRE calculator →</Link>
            <Link href="/barista-fire-calculator" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">Barista FIRE →</Link>
            <Link href="/coast-fire-calculator" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">Coast FIRE →</Link>
            <Link href="/" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">Compare cities →</Link>
          </div>
        </header>

        <section aria-label="FIRE number calculator">
          {/* hideFAQ removes the component's built-in FAQ so only the page-level FAQ below renders */}
          <FireCalculator hideFAQ initialIncome={initialIncome} />
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            Frequently asked questions about FIRE numbers
          </h2>

          <div className="grid gap-3">
            <SEOFAQItem
              q="What is a FIRE number?"
              a="Your FIRE number is the total portfolio value you need so you can live off investment returns without working. It is calculated by dividing your expected annual expenses by your planned withdrawal rate. Using the 4% rule, your FIRE number is 25 times your annual spending."
            />
            <SEOFAQItem
              q="How do I calculate my FIRE number?"
              a="Take your expected annual expenses in retirement and divide by your withdrawal rate. For example: $60,000 annual expenses ÷ 0.04 (4% rule) = $1,500,000 FIRE number. You can also multiply annual expenses by 25 to get the same result."
            />
            <SEOFAQItem
              q="Is the 4% rule still valid?"
              a="The 4% rule is a commonly used planning starting point, based on historical research showing a 4% annual withdrawal from a diversified portfolio has historically lasted 30+ years. More conservative planners use 3% to 3.5%, particularly for early retirees with longer time horizons. The right rate depends on your risk tolerance, expected retirement length, and portfolio mix."
            />
            <SEOFAQItem
              q="How does location affect my FIRE number?"
              a="Your FIRE number is directly tied to your annual spending. If you move to a lower cost-of-living city or a state with no income tax, your annual expenses in retirement may be lower — which means a smaller FIRE number and potentially years shaved off your timeline."
            />
            <SEOFAQItem
              q="Do I need to include taxes in my FIRE number?"
              a="Yes, ideally. In retirement, withdrawals from taxable accounts and traditional 401(k) or IRA accounts are subject to income tax. Your effective tax rate in retirement depends on your withdrawal strategy, account mix, and state of residence. This calculator applies a state-specific tax model to help you plan more realistically."
            />
            <SEOFAQItem
              q="What is the difference between FIRE, Lean FIRE, and Barista FIRE?"
              a="Traditional FIRE targets a portfolio that fully covers all living expenses. Lean FIRE uses a smaller number by targeting a frugal lifestyle, typically under $40,000 per year. Barista FIRE is a partial retirement strategy where you cover some expenses with part-time income so your portfolio needs to be smaller. Each approach has a different FIRE number."
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
